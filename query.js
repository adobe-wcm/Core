window.onYouTubeIframeAPIReady_cookiePolicy = function() {
    if (typeof OnetrustActiveGroups === 'undefined' ||
        OnetrustActiveGroups == null ||
        !OnetrustActiveGroups.includes('C0004')) {
        return;
    }

    if (window.__degYtPlayersInitialized) {
        return;
    }

    var createPlayers = function() {
        if (window.__degYtPlayersInitialized) {
            return;
        }

        var $gallery = $('.pdp-gallery iframe');
        var $technology = $('.technology iframe');

        // Don't latch the flag on pages with no videos (scenario M)
        if (!$gallery.length && !$technology.length) {
            return;
        }

        window.__degYtPlayersInitialized = true;

        /* ytplayer for pdpGallery */
        $gallery.each(function (index, value) {
            /* >>> PASTE EXISTING BODY FROM LINES 470-489, UNCHANGED <<< */
        });

        /* ytplayer for pdpTechnology */
        $technology.each(function (index, value) {
            /* >>> PASTE EXISTING BODY FROM LINES 492-507, UNCHANGED <<< */
        });
    };

    if (window.YT && window.YT.Player) {
        createPlayers();
        return;
    }

    var previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function() {
        if (typeof previousReady === 'function') {
            previousReady();
        }
        createPlayers();
    };

    // This code loads the IFrame Player API code asynchronously.
    // validation to prevent load the script multiple times
    if (!$('script[src="https://www.youtube.com/iframe_api"]').length) {
        var tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
};
