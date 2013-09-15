/*jslint browser: true, devel: true, indent: 4, maxlen: 90, es5: true */
/*global jQuery, $ */

(function () {
    "use strict";

    var gs = window.GokoSalvager;
    gs.AM = gs.AM || {};

    gs.AM.appendGamePopup = function () {
        $('#viewport')
            .append($('<div>').attr('id', 'gamepop')
                              .attr('title', 'Creating Automatch Game')
                .append($('<div>')
                    .append('Host: ')
                    .append($('<span>').attr('id', 'gamehost')))
                .append($('<div>')
                    .append('Guest: ')
                    .append($('<ul>').attr('id', 'gameguests')))
                .append($('<p>').text('Automatch will create the game and seat you '
                                    + 'automatically. This dialog should disappear '
                                    + 'when it does.'))
                .append($('<input>').attr('type', 'button')
                                    .attr('id', 'abortgame')
                                    .attr('value', 'Abort')));
        $('#gamepop')
            .dialog({
                modal: false,
                width: 500,
                draggable: true,
                resizeable: false,
                autoOpen: false
            });

        $('#abortgame').click(function (evt) {
            $('#abortgame').prop('disabled', true);
            gs.AM.abortGame();
            $('#gamepop').css('visibility', 'hidden');
        });
    };

    // Update and show/hide the dialog
    gs.AM.showGamePop = function (visible) {
        if (typeof visible === "undefined") {
            visible = true;
        }

        $('#gamehost').text('');
        $('#gameguests').empty();

        if (gs.AM.state.game !== null) {
            var hostname = gs.AM.state.game.hostname;
            $('#gamehost').text(hostname);

            // List guest names
            gs.AM.state.game.seeks.map(function (s) {
                return s.player.pname;
            }).filter(function (pname) {
                return pname !== gs.AM.state.game.hostname;
            }).map(function (pname) {
                $('#gameguests').append($('<li>').text(pname));
            });

            $('#abortgame').prop('disabled', false);
        }
        $('#gamepop').dialog(visible ? 'open' : 'close');
    };
}());
