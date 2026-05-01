(() => {
  console.log('[YLM] Inject script loaded');
  let previousQuality = 'default';
  let currentTargetQuality = null;
  let tinyEnforceTimer = null;
  let navRestoreTimers = [];

  function cancelTinyEnforcement() {
    if (tinyEnforceTimer) {
      clearInterval(tinyEnforceTimer);
      tinyEnforceTimer = null;
    }
  }

  function cancelNavRestoreTimers() {
    navRestoreTimers.forEach(clearTimeout);
    navRestoreTimers = [];
  }

  function updateQuality(quality) {
    // If we're no longer targeting tiny, stop enforcement and cancel
    // any pending navigation-restore retries so they don't undo us.
    if (quality !== 'tiny') {
      cancelTinyEnforcement();
    } else {
      cancelNavRestoreTimers();
    }
    const player =
      document.getElementById('movie_player') || document.querySelector('.html5-video-player');
    if (!player) {
      console.log('[YLM] Player not found for quality update');
      return;
    }

    const available =
      typeof player.getAvailableQualityLevels === 'function'
        ? player.getAvailableQualityLevels()
        : [];
    const currentQ =
      typeof player.getPlaybackQuality === 'function' ? player.getPlaybackQuality() : 'unknown';
    console.log(`[YLM] Setting quality to ${quality} (Current: ${currentQ}, Available: [${available}]`);

    // Avoid redundant calls if already at target quality
    if (currentQ === quality && (quality !== 'tiny' || quality === 'unknown')) {
      console.log('[YLM] Already at target quality, skipping redundunt update.');
      return;
    }

    // Store current quality before switching to tiny.
    // Skip 'auto' and 'unknown' — they aren't real quality levels
    // and can't be used later to unlock the player from 'tiny'.
    if (quality === 'tiny') {
      if (currentQ !== 'tiny' && currentQ !== 'unknown' && currentQ !== 'auto') {
        previousQuality = currentQ;
        console.log('[YLM] Remembered previous quality:', previousQuality);
      }
    } else if (quality === 'default') {
      // Restore to recorded quality, or use a reasonable fallback
      if (previousQuality !== 'tiny' && previousQuality !== 'default') {
        console.log('[YLM] Restoring to previous quality:', previousQuality);
        quality = previousQuality;
      } else {
        // No recorded quality (fresh session or cross-tab persistence).
        // Pick the best available HD quality so we don't leave the user
        // stuck at 720p when 1080p (or higher) is available.
        const tiers = ['hd1080', 'hd720', 'large', 'medium'];
        let best = 'hd720';
        for (const tier of tiers) {
          if (available.includes(tier)) {
            best = tier;
            break;
          }
        }
        console.log('[YLM] No previous quality recorded, using', best, 'fallback');
        quality = best;
      }
    }

    currentTargetQuality = quality;

    function apply() {
      // Prevent old retries from overriding newer requests
      if (currentTargetQuality !== quality) return;

      // Re-check quality before applying in retries
      const q = typeof player.getPlaybackQuality === 'function' ? player.getPlaybackQuality() : '';
      if (q === quality && quality !== 'tiny') return;

      if (typeof player.setPlaybackQualityRange === 'function') {
        // Lock to 'tiny' with two-arg (min,max) so YouTube can't auto-escalate.
        // For restoring from 'tiny', use single-arg (minimum-only) — two-arg
        // restore calls are ignored when the player was previously locked.
        if (quality === 'tiny') {
          player.setPlaybackQualityRange(quality, quality);
        } else {
          player.setPlaybackQualityRange(quality);
        }
      }
      if (typeof player.setPlaybackQuality === 'function') {
        player.setPlaybackQuality(quality);
      }
      if (typeof player.setOption === 'function') {
        try {
          player.setOption('playback', 'quality', quality);
        } catch (e) {
          console.error('[YLM] Error in setoption', e);
        }
      }
      player.dispatchEvent(new Event('onPlaybackQualityChange'));
    }

    apply();

    // Enforce tiny quality for a few seconds after switching.
    // YouTube (or our own navigation handler) may race to restore quality
    // before content.js re-enables listen mode on the next video.
    // This loop catches and corrects any premature quality restoration.
    if (quality === 'tiny') {
      cancelTinyEnforcement();
      let ticks = 0;
      const MAX_TICKS = 10; // 5 seconds at 500ms intervals
      const enforceUrl = location.href;
      tinyEnforceTimer = setInterval(() => {
        // If the URL changed under us (navigation without an event),
        // kill the loop. content.js will restart it if appropriate.
        if (location.href !== enforceUrl) {
          cancelTinyEnforcement();
          return;
        }
        ticks++;
        const player =
          document.getElementById('movie_player') || document.querySelector('.html5-video-player');
        if (!player) {
          cancelTinyEnforcement();
          return;
        }
        const q =
          typeof player.getPlaybackQuality === 'function'
            ? player.getPlaybackQuality()
            : 'unknown';
        // 'unknown' means the player is being rebuilt (navigation transition).
        // Don't interfere and don't count this tick — the player isn't ready.
        if (q === 'unknown') {
          ticks--;
        } else if (q !== 'tiny') {
          console.log('[YLM] Quality drifted to', q, '- re-enforcing tiny');
          apply();
        }
        if (ticks >= MAX_TICKS) {
          cancelTinyEnforcement();
        }
      }, 500);
    }
  }

  // Listen for custom events from the content script (ISOLATED world)
  window.addEventListener('ytb-listen-mode-quality', (event) => {
    const { quality } = event.detail || {};
    if (quality) {
      updateQuality(quality);
    }
  });

  // On navigation, if we're stuck at 'tiny' from a previous listen mode session,
  // restore quality to default.
  let lastUrl = location.href;

  function onNavigate() {
    // Ignore spurious popstate events that don't change the URL
    const url = location.href;
    if (url === lastUrl) return;
    lastUrl = url;

    console.log('[YLM] Navigation detected, checking if quality needs restoration');
    // Kill enforcement immediately so it can't fire between now and when
    // we find the player. If the new video is whitelisted, content.js will
    // dispatch 'tiny' which starts a fresh loop.
    cancelTinyEnforcement();
    cancelNavRestoreTimers();

    function restoreToDefault() {
      const player =
        document.getElementById('movie_player') || document.querySelector('.html5-video-player');
      if (!player) return false;

      const currentQ =
        typeof player.getPlaybackQuality === 'function' ? player.getPlaybackQuality() : 'unknown';
      if (currentQ === 'tiny') {
        console.log('[YLM] Navigation: resetting stuck low quality to default');
        updateQuality('default');
      }
      // If quality is not tiny, YouTube already switched — nothing to restore.
      // Enforcement was already killed above, so it won't re-apply 'tiny'.
      return true;
    }

    // Try immediately, then with retries if player isn't ready.
    // Track timers so a later tiny request can cancel them.
    if (!restoreToDefault()) {
      [100, 300, 500, 1000, 2000].forEach((delay) => {
        navRestoreTimers.push(setTimeout(() => restoreToDefault(), delay));
      });
    }
  }

  // YouTube's SPA navigation event (most navigations)
  window.addEventListener('yt-navigate-finish', onNavigate);

  // Browser back/forward (YouTube may use history.replaceState, skipping yt-navigate-finish)
  window.addEventListener('popstate', onNavigate);

  // bfcache restoration (page restored from back/forward cache)
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) onNavigate();
  });
})();
