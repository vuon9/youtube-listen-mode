(function () {
    console.log('[YLM] Inject script loaded');
    let previousQuality = 'default';
    let currentTargetQuality = null;

    function updateQuality(quality) {
        const player = document.getElementById('movie_player') || document.querySelector('.html5-video-player');
        if (!player) {
            console.log('[YLM] Player not found for quality update');
            return;
        }

        const currentQ = typeof player.getPlaybackQuality === 'function' ? player.getPlaybackQuality() : 'unknown';
        console.log(`[YLM] Setting quality to ${quality} (Current: ${currentQ})`);

        // Avoid redundant calls if already at target quality
        if (currentQ === quality && (quality !== 'tiny' || quality === 'unknown')) {
            console.log('[YLM] Already at target quality, skipping redundunt update.');
            return;
        }

        // Store current quality before switching to tiny
        if (quality === 'tiny') {
            if (currentQ !== 'tiny' && currentQ !== 'unknown') {
                previousQuality = currentQ;
                console.log('[YLM] Remembered previous quality:', previousQuality);
            }
        } else if (quality === 'default') {
            // Restore to previous quality or 'auto' if never set
            if (previousQuality === 'default') {
                // Never recorded a quality, use 'auto' to let YouTube decide
                console.log('[YLM] No previous quality recorded, using auto');
                quality = 'auto';
            } else if (previousQuality !== 'tiny') {
                // Use the recorded previous quality
                console.log('[YLM] Restoring to previous quality:', previousQuality);
                quality = previousQuality;
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
                player.setPlaybackQualityRange(quality, quality);
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
        // Retries for robustness ONLY when enabling 144p (tiny) mode
        if (quality === 'tiny') {
            [500, 1000, 2000].forEach(delay => setTimeout(apply, delay));
        }
    }

    // Listen for custom events from the content script (ISOLATED world)
    window.addEventListener('ytb-listen-mode-quality', (event) => {
        const { quality } = event.detail || {};
        if (quality) {
            updateQuality(quality);
        }
    });

    // Reset previous quality on navigation to ensure we capture the fresh quality for the next video
    window.addEventListener('yt-navigate-finish', () => {
        previousQuality = 'default';
        console.log('[YLM] Reset previous quality due to navigation');

        // Early quality restoration: try to restore quality to auto immediately
        // This prevents videos from starting at low quality when listen mode was enabled in another tab
        // If listen mode should be enabled, content.js will dispatch 'tiny' which overrides this
        function restoreToAuto() {
            const player = document.getElementById('movie_player') || document.querySelector('.html5-video-player');
            if (!player) return false;

            const currentQ = typeof player.getPlaybackQuality === 'function' ? player.getPlaybackQuality() : 'unknown';
            // Only restore if currently at 'tiny' (was set by listen mode in another tab)
            if (currentQ === 'tiny') {
                console.log('[YLM] Early restoration: resetting low quality to auto');
                updateQuality('default'); // 'default' becomes 'auto' in updateQuality
                return true;
            }
            return false;
        }

        // Try immediately, then with retries if player isn't ready
        if (!restoreToAuto()) {
            [100, 300, 500, 1000, 2000].forEach(delay => {
                setTimeout(() => restoreToAuto(), delay);
            });
        }
    });
})();
