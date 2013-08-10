/*jslint browser: true, devel: true, indent: 4, vars: true, nomen: true, regexp: true, forin: true */
/*global $, _, FS, Goko */

/*
 * Blacklist Module
 */
(function () {
    "use strict";

    FS.MeetingRoom.prototype.old_onRoomChat =
        FS.MeetingRoom.prototype.onRoomChat;
    FS.MeetingRoom.prototype.onRoomChat = function (resp) {
        var player = this.playerList.findByAddress(resp.data.playerAddress).getName();

        if (window.GokoSalvager.options.blacklist.indexOf(player) > -1) {
            return;
        }

        this.old_onRoomChat(resp);
    };

    FS.ClassicTableView.prototype.old_modifyDOM =
        FS.ClassicTableView.prototype.modifyDOM;
    FS.ClassicTableView.prototype.modifyDOM = function () {
        FS.ClassicTableView.prototype.old_modifyDOM.call(this);

        var players, name, blacklisted, localPlayerJoined;

        if (this.model && this.model.getJoinedPlayers) {
            players = this.model.getJoinedPlayers();
            _(players).each(function (player, index, list) {
                name = player.getName();
                if (window.GokoSalvager.options.blacklist.indexOf(name) > -1 && this.model && this.model.view && this.model.view.$el) {
                    blacklisted = true;
                }
                if (name === this.meetingRoom.getLocalPlayer().getName()) {
                    localPlayerJoined = true;
                }
            }, this);

            if (blacklisted && !localPlayerJoined) {
                this.model.view.$el.hide();
            } else if (blacklisted && localPlayerJoined) {
                console.log("Warning: in a game with a blacklisted player.");
            }
        }
    };
}());

//
// Always Stack module
//
// Goko dependencies:
// - addView API (setting stackCards in that function, value of autoStackCards)
// Internal dependencies:
// - options.alwaysStack
//
(function () {
    "use strict";
    FS.Cards.CardStackPanel.prototype.old_addView =
        FS.Cards.CardStackPanel.prototype.addView;
    FS.Cards.CardStackPanel.prototype.addView = function (view, index) {
        var ret = this.old_addView(view, index);
        if (window.GokoSalvager.options.alwaysStack && this.autoStackCards) {
            this.stackCards = true;
        }
        return ret;
    };
}());
