// Build the image+button overlay with DOM APIs (no innerHTML).
var holder = document.createElement('div');
holder.className = 'holder-yt';

var titleDiv = document.createElement('div');
titleDiv.id = id + '_title';
holder.appendChild(titleDiv);

var link = document.createElement('a');
link.href = '#';
link.id = 'cat-youtubevid-' + id;
(function (vidId, vw, vh) {
    link.addEventListener('click', function (e) {
        e.preventDefault();
        LoadYoutubeVidOnPreviewClick(vidId, vw, vh);
    });
})(id, w, h);

var img = document.createElement('img');
img.src = 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg';
img.alt = '';
img.style.width = w + 'px';
img.style.height = h + 'px';
link.appendChild(img);

var playBtn = document.createElement('div');
playBtn.setAttribute('style', YT_PLAY_BTN_STYLE);
link.appendChild(playBtn);

holder.appendChild(link);

// Replace the iframe with the image+button node.
frame.parentNode.replaceChild(holder, frame);
i--;
