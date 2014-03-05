/*jslint browser: true, devel: true, indent: 4, vars: true, nomen: true, regexp: true, forin: true */
/*global $, _, GS, Goko, FS */

(function () {
    "use strict";

    var mod = GS.modules.avatars = new GS.Module('Avatars');
    mod.dependencies = [
        'FS.AvatarHelper.loadAvatarImage',
        'Goko.Player.AvatarLoader',
        'GS.WS'
    ];
    mod.load = function () {

        // Cache of who has custom avatars: playerid --> true/false
        var customAvatarLoader, gokoAvatarLoader;
        GS.hasAvatar = {};

        // Prevent Goko from pre-caching its own avatars, as this will prevent
        // it from calling .loadAvatarImage() later.
        Goko.Player.preloader = function (ids, which) {};

        // Goko's default avatar loader and our replacement function
        gokoAvatarLoader = FS.AvatarHelper.loadAvatarImage;
        customAvatarLoader = function (playerid, size, callback) {
            var img = new Image();

            img.onerror = function () {
                GS.hasAvatar[playerid] = false;
            };

            img.crossOrigin = "Anonymous";
            img.src = "https://www.andrewiannaccone.com:8889/"
                    + "avatars/medium/" + playerid + ".png";
            callback({
                playerid: playerid,
                image: img
            });
        };

        // Let goko provide the large sized and non-custom avatars.
        // Ask gokosalvager.com to provide small and medium sized custom avatars.
        // NOTE: The 'size' argument used to be called 'which'
        var SMALL = 1, MEDIUM = 2;
        FS.AvatarHelper.loadAvatarImage = function (playerid, size, callback) {
            if (size > MEDIUM) {
                gokoAvatarLoader(playerid, size, callback);
            } else if (typeof GS.hasAvatar[playerid] !== 'undefined') {
                if (GS.hasAvatar[playerid]) {
                    customAvatarLoader(playerid, size, callback);
                } else {
                    gokoAvatarLoader(playerid, size, callback);
                }
            } else if (!GS.WS.isConnReady()) {
                console.log('No connection to gokosalvager server.  '
                          + 'Using non-custom avatar for player: ' + playerid);
                gokoAvatarLoader(playerid, size, callback);
            } else {
                // Ask GS server whether custom avatar is available.
                // Continue asynchronously by showing the avatar.
                GS.WS.sendMessage('QUERY_AVATAR', {playerid: playerid}, function (resp) {
                    GS.hasAvatar[playerid] = resp.available;
                    //console.log(resp);
                    if (resp.available) {
                        customAvatarLoader(playerid, size, callback);
                    } else {
                        gokoAvatarLoader(playerid, size, callback);
                    }
                });
            }
        };
    };
}());
