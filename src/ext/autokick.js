/*jslint browser: true, devel: true, indent: 4, vars: true, nomen: true, regexp: true, forin: true, white:true */
/*global $, _, Audio */

/*
 * Auto kick module
 */
var loadAutokickModule = function (gs, zch) {
    "use strict";

    var getProRating, kickOrNotify, kickOrNotify2;

    getProRating = function (gokoconn, playerId, callback) {
        gokoconn.getRating({
            playerId: playerId,
            ratingSystemId: '501726b67af16c2af2fc9c54'
        }, function (resp) {
            return callback(resp.data.rating);
        });
    };

    kickOrNotify = function (gokoconn, table, joiner) {

        // Asynchronously get my rating
        getProRating(gokoconn, gokoconn.connInfo.playerId, function (myRating) {
            if (typeof myRating === 'undefined') {
                console.log('No pro rating found for me -- using 1000');
                myRating = 1000;
            }

            // Asynchronously get joiner's rating
            getProRating(gokoconn, joiner.get('playerId'), function (hisRating) {
                if (typeof hisRating === 'undefined') {
                    console.log('No pro rating found for ' + joiner.get('playerName') + ' -- using 1000');
                    hisRating = 1000;
                }

                kickOrNotify2(gokoconn, JSON.parse(table.get('settings')).name,
                    table.get('number'), myRating, hisRating,
                    joiner.get('playerName'), joiner.get('isBot'),
                    joiner.get('playerAddress'));
            });
        });
    };

    kickOrNotify2 = function (gokoconn, tablename, tableNum, myRating, hisRating, hisName, heIsBot, hisAddress) {
        var shouldKick = false;

        // Kick players whose ratings are too high or too low for me
        if (gs.get_option('autokick_by_rating') && !heIsBot) {

            var range = gs.parseRange(tablename, myRating);
            var minRating = range[0];
            var maxRating = range[1];

            if ((minRating && hisRating < minRating)
                    || (maxRating && hisRating > maxRating)) {
                console.log(hisName + 'is outside my rating range... kicking');
                shouldKick = true;
            }
        }
        
        // Kick players not listed in "For X, Y, ..."
        if (gs.get_option('autokick_by_forname')) {
            var m = tablename.toLowerCase().match(/for (.*)/);
            if (m && m[1].indexOf(hisName.toLowerCase()) < 0) {
                console.log(hisName + 'is not my requested opponent... kicking');
                shouldKick = true;
            }
        }

        // Kick players on my blacklist
        var i, blackList = gs.get_option('blacklist');
        for (i = 0; i < blackList.length; i += 1) {
            if (blackList[i].toLowerCase() === hisName.toLowerCase()) {
                console.log(hisName + 'is on my blacklist... kicking');
                shouldKick = true;
            }
        }

        // Kick joiner or play a sound to notify of successful join
        if (shouldKick) {
            gokoconn.bootTable({
                table: tableNum,
                playerAddress: hisAddress
            });
        } else {
            new Audio('sounds/startTurn.ogg').play();
        }
    };

    gs.alsoDo(zch, 'onPlayerJoinTable', null, function (t, tp) {
        if (this.isLocalOwner(t)) {
            kickOrNotify(this.meetingRoom.conn, t, tp.get('player'));
        }
    });
};

window.GokoSalvager.depWait(
    ['GokoSalvager',
     'FS.ZoneClassicHelper'],
    100, loadAutokickModule, this, 'Autokick module'
);
