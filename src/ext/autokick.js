/*jslint browser: true, devel: true, indent: 4, vars: true, nomen: true, regexp: true, forin: true */
/*global $, _, FS, Goko */

/*
 * Auto kick module
 *
 * Goko dependencies:
 *   - getRating API specifics ($elPro and $elQuit trigger getting the pro ranking)
 *   - onPlayerJoinTable API
 *   - lot of other APIs (bootTable, table settings, isLocalOwner)
 * Internal dependencies
 *   - rating-based auto kick enabled by options.autokick
 *   - personal black list auto kick enabled by options.blacklist
 */
(function () {
    "use strict";

    window.GokoSalvager = (window.GokoSalvager || {});

    var joinSound = document.createElement('div');
    joinSound.innerHTML = '<audio id="_joinSound" style="display: none;" src="sounds/startTurn.ogg"></audio>';
    document.getElementById('viewport').appendChild(joinSound);
    FS.ZoneClassicHelper.prototype.old_onPlayerJoinTable =
        FS.ZoneClassicHelper.prototype.onPlayerJoinTable;
    FS.ZoneClassicHelper.prototype.onPlayerJoinTable = function (t, tp) {
        this.old_onPlayerJoinTable(t, tp);
        var p = tp.get('player');

        if (window.GokoSalvager.options.autokick && this.isLocalOwner(t)) {
            var settings = JSON.parse(t.get("settings"));
            var pro = settings.ratingType === 'pro';
            var m = settings.name.toLowerCase().match(/\b(\d+)(\d{3}|k)\+/);
            var mr = null;
            if (m) {
                mr = parseInt(m[1], 10) * 1000 + (m[2] === 'k' ? 0 : parseInt(m[2], 10));
            }
            var ratingHelper = this.meetingRoom.getHelper('RatingHelper');
            var self = this;
            if (mr) {
                ratingHelper.getRating({
                    playerId: p.get("playerId"),
                    $elPro: $(document.createElement('div')),
                    $elQuit: $(document.createElement('div'))
                }, function (resp) {
                    if (!resp.data) {
                        return;
                    }
                    var r = pro ? resp.data.ratingPro : resp.data.rank;
                    if (r !== undefined && r < mr) {
                        self.meetingRoom.conn.bootTable({
                            table: t.get('number'),
                            playerAddress: p.get('playerAddress')
                        });
                    } else {
                        document.getElementById('_joinSound').play();
                    }
                });
            }
        }

        if (window.GokoSalvager.options.blacklist.indexOf(tp.getName()) > -1 && this.isLocalOwner(t)) {
            this.meetingRoom.conn.bootTable({
                table: t.get('number'),
                playerAddress: p.get('playerAddress')
            });
        }
    };
}());


