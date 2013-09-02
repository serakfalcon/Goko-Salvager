/*jslint browser: true, devel: true, indent: 4, es5: true, vars: true, nomen: true, regexp: true, forin: true, white:true */
/*global jQuery, _, $, Audio  */

var createSidebar, resizeSidebar;

// Add logviewer to GUI
createSidebar = function () {
    "use strict";
    $('#goko-game').append(
        ['<div id="sidebar">',
         '  <table id="vptable">',
         '    <tr>',
         '      <td>Player 1</td>',
         '      <td>500</td>',
         '    </tr>',
         '  </table>',
         '  <div id="prettylog"></div>',
         '</div>'
        ].join('\n')
    );

    window.addEventListener('resize', function () {
        setTimeout(resizeSidebar, 100);
    }, false);
};

// Resize and reposition the logviewer to match the new window size
resizeSidebar = function () {
    "use strict";

    // Move Goko play area to far left
    var lshift = (-1) * Math.floor(window.innerWidth / 2);
    window.document.getElementById('goko-game')
                   .setAttribute('style', 'margin-left: ' + lshift + 'px !important');

    // Calculate new logviewer size and position
    var goko_canvas = document.getElementById("myCanvas");
    var goko_w = goko_canvas.offsetWidth;
    var goko_h = goko_canvas.offsetHeight;
    var w = window.innerWidth - goko_w;
    var t = goko_canvas.style.marginTop;

    // Resize and reposition logviewer
    $('#sidebar').css('left', goko_w + 'px')
                 .css('margin-top', t)
                 .css('width', w + 'px')
                 .css('height', goko_h);
    //$('#logdiv').css('height', (goko_h - 200) + 'px')
    //            .css('width', (w - 10) + 'px');

    // Scroll to bottom of log
    //$('#logdiv').scrollTop($('#logdiv')[0].scrollHeight);
};

createSidebar();

//window.GokoSalvager.depWait(
//    ['GokoSalvager',
//     'FS.Dominion.CardBuilder.Data.cards',
//     'Dom.LogManager',
//     'Dom.DominionWindow'],
//    5000, createSidebar, this, 'PrettyLog View'
//);
