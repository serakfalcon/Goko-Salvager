/*jslint browser: true, devel: true, indent: 4, vars: true, nomen: true, regexp: true, forin: true, white:true */
/*global $, _, GS, FS */

(function() {
    "use strict";

    var mod = GS.modules.blacklist = new GS.Module('Blacklist');
    mod.dependencies = ['FS.MeetingRoom', 'FS.ClassicTableView'];
    mod.load = function () {
        FS.MeetingRoom.prototype.old_onRoomChat = FS.MeetingRoom.prototype.onRoomChat;
        FS.MeetingRoom.prototype.onRoomChat = function (resp) {
            var player = this.playerList.findByAddress(resp.data.playerAddress).getName();

            // Hide chat messages from censored players
            var blist = GS.get_option('blacklist2');
            if (typeof blist[player] === 'undefined' || !blist[player].censor) {
                this.old_onRoomChat(resp);
            }
        };

        FS.ClassicTableView.prototype.old_modifyDOM = FS.ClassicTableView.prototype.modifyDOM;
        FS.ClassicTableView.prototype.modifyDOM = function () {
            FS.ClassicTableView.prototype.old_modifyDOM.call(this);
    
            var players, name, blacklisted, localPlayerJoined;
    
            if (this.model && this.model.getJoinedPlayers) {

                players = this.model.getJoinedPlayers();

                _(players).each(function (player, index, list) {
                    name = player.getName();

                    // Determine whether a blacklisted player is at the table
                    var blist = GS.get_option('blacklist2');
                    if (typeof blist[name] !== 'undefined' && !blist[name].noplay
                            && this.model && this.model.view && this.model.view.$el) {
                        blacklisted = true;
                    }

                    // Determine whether we're at the table
                    if (name === this.meetingRoom.getLocalPlayer().getName()) {
                        localPlayerJoined = true;
                    }
                }, this);
    
                if (blacklisted && !localPlayerJoined) {
                    // Hide games with blacklisted players unless we're in them too
                    this.model.view.$el.hide();
                } else if (blacklisted && localPlayerJoined) {
                    // This shouldn't happen: our game should kick the blacklisted
                    // player, while his should be invisible to us.
                    console.log("Error: in a game with a blacklisted player.");
                }
            }
        };

        GS.fetchBlacklistOnline = function (callback) {
            // Try to send blacklist to gokosalvager
            if (GS.WS.isConnReady()) {
                GS.WS.sendMessage('QUERY_BLACKLIST', {}, callback);
            }

            console.log('No connection to ' + GS.WS.domain + '.  '
                      + 'Cannot submit blacklist.');
            callback(null);
        };

        GS.storeBlacklistOnline = function (blist, merge, callback) {
            // First delete the angularJS display hash keys
            _.keys(blist).map(function (pname) {
                delete blist[pname].$$hashKey;
            });

            // Try to send blacklist to gokosalvager
            if (GS.WS.isConnReady()) {
                GS.WS.sendMessage('SUBMIT_BLACKLIST', {
                    blacklist: blist,
                    merge: merge
                }, callback);
            } else {
                console.log('No connection to ' + GS.WS.domain + '.  '
                          + 'Cannot submit blacklist.');
                if (typeof callback !== 'undefined') {
                    callback(null);
                }
            }
        };
    };
}());
