/*jslint browser: true, devel: true, indent: 4, vars: true, nomen: true, regexp: true, forin: true */
/*global $, _, GS, Goko, FS */

(function () {
    "use strict";

    var mod = GS.modules.avatars = new GS.Module('Avatars');
    mod.dependencies = [
        'FS.AvatarHelper.loadAvatarImage',
        'Goko.Player.preloader',
        'GS.WS'
    ];
    mod.load = function () {

        // Cache of who has custom avatars: playerid --> true/false
        var gsAvatarLoader, retroboxAvatarLoader, gokoAvatarLoader;
        GS.hasAvatar = {};

        // Goko's default avatar loader and our replacement function
        gokoAvatarLoader = FS.AvatarHelper.loadAvatarImage;
        gsAvatarLoader = function (playerid, size, callback) {
            var img = new Image();

            img.onerror = function () {
                // Defer to retrobox if GokoSalvager fails
                retroboxAvatarLoader(playerid, size, callback);
            };

            img.crossOrigin = "Anonymous";
            img.src = "https://www.andrewiannaccone.com:8889/"
                    + "avatars/" + playerid + ".jpg";
            callback({
                playerid: playerid,
                image: img
            });
        };
        retroboxAvatarLoader = function (playerid, size, callback) {
            var img = new Image();
            img.onerror = function () {
                // Defer to Goko if GokoSalvager fails
                gokoAvatarLoader(playerid, size, callback);
            };
            img.src = "http://dom.retrobox.eu/avatars/" + playerid + ".png";
            img.onerror = function () {
                gokoAvatarLoader(playerid, size, callback);
            };
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
                    gsAvatarLoader(playerid, size, callback);
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
                    if (resp.available === true) {
                        gsAvatarLoader(playerid, size, callback);
                    } else {
                        gokoAvatarLoader(playerid, size, callback);
                    }
                });
            }
        };

        // Prevent Goko's preloader from building a cache of vanilla avatars.
        // Note that the cache will still be populated later and used, but it
        // will be populated using the avatar loading code in this module.
        Goko.Player.preloader = function (ids, which) {};

        // Also clear anything that got into the cache befor this module loaded
        try {
            Goko.ObjectCache.getInstance().player = {};
        } catch (e) {
            // Player cache does not yet exist --> no need to clear it
        }
    };
}());
