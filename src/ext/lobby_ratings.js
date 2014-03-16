/*jslint browser: true, devel: true, indent: 4, vars: true, nomen: true, regexp: true, forin: true, white:true */
/*global $, _, GS, FS, mtgRoom, DEFAULT_RATING */

/*
 * Lobby ratings module
 *
 * Goko dependencies:
 * - getRating API specifics ($elPro and $elQuit trigger getting the pro ranking)
 * - class name of the player list rank element ('player-rank')
 * - format of the text content of the player list element ('username Rating: 1000')
 * - FS.RatingHelper, FS.ClassicRoomView, FS.MeetingRoomSetting
 * Internal dependencies:
 * - option: proranks
 * - option: sortrating
 * - option: blacklist
 */
(function () {
    "use strict";

    var mod = GS.modules.lobbyRatings = new GS.Module('Lobby Ratings');
    mod.dependencies = [
        'FS.RatingHelper',
        'FS.ClassicRoomView',
        'FS.MeetingRoomSetting',
        'mtgRoom'
    ];
    mod.load = function () {
        var insertInPlace, getSortablePlayerObjectFromElement;

        // NOTE: This inappropriately named function actually takes an HTML
        // element and inserts the rating into its .player-rank span element.
        FS.RatingHelper.prototype.old_getRating = FS.RatingHelper.prototype.getRating;

        // Hijack this method to sort the player list, show pro/iso ratings,
        // and hide censored players
        FS.RatingHelper.prototype.getRating = function (opts, callback) {
            var newCallback = callback, playerElement;
            if (opts.$el && opts.$el.hasClass('player-rank')) {
                playerElement = opts.$el.closest('li')[0];
                newCallback = function (resp) {
                    callback(resp);

                    // Keep the list of players sorted
                    insertInPlace(playerElement);

                    if (GS.get_option('isoranks')) {
                        // Players with rating=1000 are players with no games.
                        // Goko assigns this without querying its Connection,
                        // so we can't intercept the query.  Assign these
                        // players the default Isotropish rating of 0.
                        var playerId = playerElement.querySelector('.player-list-item')
                                                    .getAttribute('data-playerid');
                        var playerName = mtgRoom.playerList
                                                .findById(playerId)[0]
                                                .get('playerName');
                        var msg = { playerId: playerId, playerName: playerName };
                        GS.WS.waitSendMessage('QUERY_ISOLEVEL', msg, function(resp2) {
                            var rankDiv = playerElement.querySelector('.rank');
                            $(rankDiv).append('  Level: ')
                                      .append($('<span>').text(resp2.isolevel)
                                                         .addClass('iso-level'));

                            // Keep the list of players sorted
                            insertInPlace(playerElement);
                        });
                    }

                    // Don't show censored players on the player list
                    var blist = GS.getCombinedBlacklist(true);
                    var pname = playerElement
                        .querySelector('.fs-mtrm-player-name>strong').innerHTML;
                    if (typeof blist[pname.toLowerCase()] !== 'undefined'
                            && blist[pname.toLowerCase()].censor) {
                        $(playerElement).hide();
                    } else {
                        $(playerElement).show();
                    }
                };
                if (GS.get_option('proranks')) {
                    opts.$elPro = opts.$el;
                    opts.$elQuit = $(document.createElement('div'));
                    delete opts.$el;
                }
            }
            FS.RatingHelper.prototype.old_getRating.call(this, opts, newCallback);
        };

        FS.ClassicRoomView.prototype.old_modifyDOM = FS.ClassicRoomView.prototype.modifyDOM;
        FS.ClassicRoomView.prototype.modifyDOM = function () {
            var originalRating = this.meetingRoom.options.ratingSystemId;
            if (GS.get_option('proranks')) {
                this.meetingRoom.options.ratingSystemId = FS.MeetingRoomSetting.ratingSystemPro;
            }
            FS.ClassicRoomView.prototype.old_modifyDOM.call(this);
            this.meetingRoom.options.ratingSystemId = originalRating;
        };

        insertInPlace = function (element) {
            var list = element.parentNode;
            if (!list) {
                return; // Removed from the list before the ranking came
            }
            list.removeChild(element);

            var newEl = getSortablePlayerObjectFromElement(element),
                elements = list.children,
                b = elements.length,
                a = 0;

            while (a !== b) {
                var c = Math.floor((a + b) / 2);
                var compare = getSortablePlayerObjectFromElement(elements[c]);

                // sort first by rating, then alphabetically
                if (compare > newEl) {
                    b = c;
                } else {
                    a = c + 1;
                }
            }
            list.insertBefore(element, elements[a] || null);
        };

        getSortablePlayerObjectFromElement = function (element) {
            switch (GS.get_option('sortkey'))
            {
            case('pname'):
                return element.querySelector('.fs-mtrm-player-name>strong').innerHTML;
            case('pro'):
                var rankSpan = element.querySelector('.player-rank>span');
                return rankSpan ? parseInt(-rankSpan.innerHTML, 10) : 1;
            case('iso'):
                var isoSpan = element.querySelector('.iso-level');
                return isoSpan ? parseFloat(-isoSpan.innerHTML, 10) : 1;
            default:
                throw 'Invalid sort key: ' + GS.get_option('sortkey');
            }
        };
    };
}());
