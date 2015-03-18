window.onload = function() {
    var shit = document.getElementById('shit');
    var mainstream = document.getElementById('mainstream');

    function share(text, url) {
        console.log(text + url);
        var windowW = 550,
            windowH = 450,
            screenH = screen.height,
            screenW = screen.width,
            left = Math.round((screenW / 2) - (windowW / 2)),
            top = (screenH > windowH) ? Math.round((screenH / 2) - (windowH / 2)) : 0;
        window.open('https://twitter.com/intent/tweet' +
            '?text=' + encodeURIComponent(text) +
            '&url=' + encodeURIComponent(url), '', 'left=' + left + ',top=' + top + ',width=' + windowW + ',height=' + windowH + ',personalbar=0,toolbar=0,scrollbars=1,resizable=1');
    }

    document.getElementById('message').onsubmit = function(evt) {
        evt.preventDefault();

        var url = location.href.replace(/\?.*$/,'');
        url += "?" + encodeURIComponent(shit.value) + ":" +
               encodeURIComponent(mainstream.value);

        share(shit.value + "はクソ、時代は" + mainstream.value + "。",
              url);

        location.replace(url);
    };



    var query = window.location.search.substring(1);
    var params = query.split(':').map(function(s){ return decodeURIComponent(s); });

    shit.value = params[0] || "";
    mainstream.value = params[1] || "";
};
