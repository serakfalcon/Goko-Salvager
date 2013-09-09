/*jslint browser: true, devel: true, indent: 4, es5: true, vars: true, nomen: true, regexp: true, forin: true, white:true */
/*global jQuery, _, $, Audio  */

var createSidebar, resizeSidebar;

// Resize and reposition the logviewer to match the new window size
resizeSidebar = function (gs) {
    "use strict";

    // Hide sidebar if disabled in options
    if (!gs.get_option('sidebar')) {
        $('#sidebar').css('display', 'none');
    }

    // Keep Goko play area in center
    if ($('#sidebar').css('display') === 'none') {
        $('#goko-game').attr('style', 'left: 50% !important; margin-left: -512px !important');
        return;
    }

    // Move Goko play area to far left
    // Note that the usual jQuery .css() function doesn't have precendence
    // over the entries in Goko's .css files.
    $('#goko-game').attr('style', 'left: 0px !important; margin-left: 0px !important');

    // Calculate new logviewer size and position
    var goko_w = $('#myCanvas').width();
    var w = window.innerWidth - goko_w;

    // Resize and reposition the sidebar
    $('#sidebar').css('left', goko_w + 'px')
                 .css('width', w + 'px')
                 .css('margin-top', $('#myCanvas').css('margin-top'))
                 .css('height', $('#myCanvas').css('height'))
                 .css('border-collapse', 'collapse');
    $('#prettylog').css('height', $('#sidebar').height() - $('#vptable').height() - 10);

    //var goko_h = goko_canvas.offsetHeight;
    //var t = goko_canvas.style.marginTop;
    //newLog.setAttribute("style", "position:absolute; overflow:auto; left:" + goko_w + "px; width:" + w + "px; margin-top:" + t + "; height:" + goko_h + "px; background-color: white; z-index: -1");

    //newLog.innerHTML = vp_div() + '<div id="newlogcontainer" style="overflow:auto;height:' + (goko_h - 200) + 'px;width:' + (w - 10) + 'px;padding:195px 5px 5px 5px">' + newLogText + "</div>";

    // Scroll to bottom of log
    $('#prettylog').scrollTop(99999999);
};

// Add sidebar to GUI
// Children: VP table, prettified log
createSidebar = function (gs, logManager) {
    "use strict";
    $('#goko-game')
        .append($('<div>').attr('id', 'sidebar')
            .append($('<table>').attr('id', 'vptable'))
            .append($('<div>').attr('id', 'prettylog')));

    // Hide sidebar until first game message
    $('#sidebar').hide();

    gs.alsoDo(logManager, 'addLog', null, function (opt) {
        if ($('#goko-game').css('display') !== 'none') {
            // TODO: this is excessive
            $('#sidebar').show();
            resizeSidebar(gs);
        }
    });

    window.addEventListener('resize', function () {
        setTimeout(function () {
            resizeSidebar(gs);
        }, 100);
    }, false);
};

window.GokoSalvager.depWait(
    ['GokoSalvager',
     'Dom.LogManager'],
    100, createSidebar, this, 'Sidebar'
);
