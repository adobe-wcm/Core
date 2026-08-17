// Allow-list: a YouTube video id is exactly 11 chars of [A-Za-z0-9_-].
if (!/^[A-Za-z0-9_-]{11}$/.test(id)) { continue; }

iframe = document.createElement('iframe');
    iframe.src = 'https://' + youtubePlayer + '/embed/' + id +
                 '/?autohide=1&border=0&wmode=opaque&enablejsapi=1';
    iframe.width = w;
    iframe.height = h;
    iframe.frameBorder = 0;
    iframe.allow = 'fullscreen';
    iframe.allowFullscreen = true;

    div = document.getElementById("cat-youtubevid-" + id);
    div.parentNode.replaceChild(iframe, div);
