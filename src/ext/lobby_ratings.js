/*jslint browser: true, devel: true, indent: 4, vars: true, nomen: true, regexp: true, forin: true */
/*global $, _ */

var loadLobbyRatingsModule;
(function () {
    "use strict";

    var exists = function (obj) {
        return (typeof obj !== 'undefined' && obj !== null);
    };

    var waitLoop = setInterval(function () {
        try {
            window.GokoSalvager = window.GokoSalvager || {};
    
            var gs = window.GokoSalvager;
            var rh = window.FS.RatingHelper;
            var crv = window.FS.ClassicRoomView;

            if ([gs, rh, crv].every(exists)) {
                clearInterval(waitLoop);
                loadLobbyRatingsModule(gs, rh, crv);
            }
        } catch (e) {}
    });
}());



/*
 * Lobby ratings module
 *
 * Goko dependencies:
 * - getRating API specifics ($elPro and $elQuit trigger getting the pro ranking)
 * - class name of the player list rank element ('player-rank')
 * - format of the text content of the player list element ('username Rating: 1000')
 * Internal dependencies:
 * - pro rating display enabled by options.proranks
 * - sort by rating enabled by options.sortrating
 * - blacklisted players to be hidden set in options.blacklist
 * - insertInPlace()
 * - getRatingObject()
 */
var loadLobbyRatingsModule = function (gs, rh, crv) {
    "use strict";
    var insertInPlace, getSortablePlayerObjectFromElement;

    rh.prototype.old_getRating = rh.prototype.getRating;
    rh.prototype.getRating = function (opts, callback) {
        var newCallback = callback, playerElement;
        if (opts.$el && opts.$el.hasClass('player-rank')) {
            playerElement = opts.$el.closest('li')[0];
            newCallback = function (resp) {
                callback(resp);
                if (gs.options.sortrating) {
                    insertInPlace(playerElement);
                }
                if (gs.options.blacklist.indexOf(playerElement.querySelector('.fs-mtrm-player-name>strong').innerHTML) > -1) {
                    $(playerElement).hide();
                } else {
                    $(playerElement).show();
                }
            };
            if (gs.options.proranks) {
                opts.$elPro = opts.$el;
                opts.$elQuit = $(document.createElement('div'));
                delete opts.$el;
            }
        }
        rh.prototype.old_getRating.call(this, opts, newCallback);
    };

    crv.prototype.old_modifyDOM = crv.prototype.modifyDOM;
    crv.prototype.modifyDOM = function () {
        var originalRating = this.meetingRoom.options.ratingSystemId;
        if (gs.options.proranks) {
            this.meetingRoom.options.ratingSystemId = FS.MeetingRoomSetting.ratingSystemPro;
        }
        crv.prototype.old_modifyDOM.call(this);
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
            if (compare.rating < newEl.rating || (compare.rating === newEl.rating && compare.name > newEl.name)) {
                b = c;
            } else {
                a = c + 1;
            }
        }
        list.insertBefore(element, elements[a] || null);
    };

    getSortablePlayerObjectFromElement = function (element) {
        var rankSpan = element.querySelector('.player-rank>span');
        return {
            name: element.querySelector('.fs-mtrm-player-name>strong').innerHTML,
            rating: rankSpan ? parseInt(rankSpan.innerHTML, 10) : -1
        };
    };
};
