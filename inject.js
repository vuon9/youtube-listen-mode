(function() {
    console.log('[YLM] Inject script loaded');
    let previousQuality = 'default';

    function updateQuality(quality) {
        const player = document.getElementById('movie_player') || document.querySelector('.html5-video-player');
        if (!player) {
            console.log('[YLM] Player not found for quality update');
            return;
        }

        console.log('[YLM] Setting quality to', quality);

        // Store current quality before switching to tiny
        if (quality === 'tiny') {
            const current = typeof player.getPlaybackQuality === 'function' ? player.getPlaybackQuality() : 'default';
            if (current !== 'tiny' && current !== 'unknown') {
                previousQuality = current;
                console.log('[YLM] Remembered previous quality:', previousQuality);
            }
        } else if (quality === 'default' && previousQuality !== 'tiny') {
            // Restore to previous quality instead of just default
            console.log('[YLM] Restoring to previous quality:', previousQuality);
            quality = previousQuality;
        }

        function apply() {
            if (typeof player.setPlaybackQualityRange === 'function') {
                player.setPlaybackQualityRange(quality, quality);
            }
            if (typeof player.setPlaybackQuality === 'function') {
                player.setPlaybackQuality(quality);
            }
            if (typeof player.setOption === 'function') {
                try {
                    player.setOption('playback', 'quality', quality);
                    player.setOption('playback-video', 'quality', quality);
                } catch (e) {
                    console.error('[YLM] Error in setOption', e);
                }
            }
            player.dispatchEvent(new Event('onPlaybackQualityChange'));
        }

        apply();
        // Retries for robustness
        [100, 500, 1000, 2000].forEach(delay => setTimeout(apply, delay));
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
    });
})();
