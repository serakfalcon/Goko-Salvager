/*jslint browser: true, devel: true, indent: 4, vars: true, nomen: true, regexp: true, forin: true, white:true */
/*global $, _, Audio */

/*
 * Auto kick module
 */
var loadAutokickModule = function (gs, zch) {
    "use strict";

    // Parse numbers like 303 and 4.23k
    var parseNum = function (str) {
        try {
            var m = str.match(/^([0-9.]+)([kK]?)$/);
            return Math.floor(parseFloat(m[1]) * (m[2] !== '' ? 1000 : 1));
        } catch (e) {
            // Fail silently if unparseable strings get here
            return null;
        }
    };

    // Parse titles like X+, Y-, X-Y, and +/-Z
    // Precedence: +/- > range > min thresh > max thresh
    var parseRange = function (tablename, myRating) {
        var m, minRating = null, maxRating = null;

        if ((m = tablename.match(/(\d+(.\d+)?([kK])?)-/)) !== null) { 
            minRating = null;
            maxRating = parseNum(m[1]);
        }
        if ((m = tablename.match(/(\d+(.\d+)?([kK])?)\+/)) !== null) {
            minRating = parseNum(m[1]);
            maxRating = null;
        }
        if ((m = tablename.match(/(\d+(.\d+)?([kK])?)-(\d+(.\d+)?([kK])?)/)) !== null) {
            minRating = parseNum(m[1]);
            maxRating = parseNum(m[4]);
        }
        if ((m = tablename.match(/\+\/-(\d+(.\d+)?([kK])?)/)) !== null) {
            minRating = myRating - parseNum(m[1]);
            maxRating = myRating + parseNum(m[1]);
        }

        return [minRating, maxRating];
    };

    var getProRating = function (gokoconn, playerId, callback) {
        gokoconn.getRating({
            playerId: playerId,
            ratingSystemId: '501726b67af16c2af2fc9c54'
        }, function (resp) {
            return callback(resp.data.rating);
        });
    };

    var kickOrNotify = function (gokoconn, table, joiner) {

        // Asynchronously get my rating
        getProRating(gokoconn, gokoconn.connInfo.playerId, function (myRating) {
            if (typeof myRating === 'undefied') {
                console.log('No pro rating found for me -- using 1000');
                myRating = 1000;
            }

            console.log('My rating: ' + myRating);

            // Determine my acceptable rating range
            var tablename = JSON.parse(table.get("settings")).name;
            var range = parseRange(tablename, myRating);
            var minRating = range[0];
            var maxRating = range[1];

            console.log('My range: ' + range);

            // Asynchronously get joiner's rating
            getProRating(gokoconn, joiner.get('playerId'), function (hisRating) {
                if (typeof hisRating === 'undefied') {
                    console.log('No pro rating found for ' + joiner.get('playerName') + ' -- using 1000');
                    hisRating = 1000;
                }
                console.log('Joiner rating: ' + hisRating);

                var shouldKick = false;

                if (gs.get_option('autokick')
                    && !joiner.get('isBot') 
                    && ((minRating !== null && hisRating < minRating) || 
                        (maxRating !== null && hisRating > maxRating))) {

                    // Kick if joiner is rated too high or too low
                    console.log('Outside my range... kicking');
                    shouldKick = true;

                } else if (gs.get_option('blacklist')
                             .indexOf(joiner.get('playerName')) > -1) {

                    // Kick if joiner is on my blacklist
                    console.log('On my blacklist... kicking');
                    shouldKick = true;
                }

                // Kick joiner or notify me with a sound
                if (shouldKick) {
                    gokoconn.bootTable({
                        table: table.get('number'),
                        playerAddress: joiner.get('playerAddress')
                    });
                } else {
                    new Audio('sounds/startTurn.ogg').play();
                }
            });
        });
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
