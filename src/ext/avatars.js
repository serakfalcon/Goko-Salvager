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

        // Cache of who has custom avatars: playerId --> true/false
        var gsAvatarLoader, retroboxAvatarLoader, gokoAvatarLoader;
        GS.hasAvatar = {};

        // Goko's default avatar loader and our replacement function
        gokoAvatarLoader = FS.AvatarHelper.loadAvatarImage;
        gsAvatarLoader = function (playerId, size, callback) {
            // NOTE: there is no need for image-resizing code that used to be
            //       here.  The Goko framework will resize as necessary.
            var img = new Image();

            img.onerror = function () {
                // Defer to retrobox if GokoSalvager is offline
                retroboxAvatarLoader(playerId, size, callback);
            };

            img.crossOrigin = "Anonymous";
            // TODO: Switch from port 8889 back to 443 after server transition
            img.src = "https://gokosalvager.com:8889/"
                    + "gs/avatars/" + playerId + ".jpg";
            callback({
                playerId: playerId,
                image: img
            });
        };
        retroboxAvatarLoader = function (playerId, size, callback) {
            var img = new Image();
            img.onerror = function () {
                // Defer to Goko if GokoSalvager fails
                gokoAvatarLoader(playerId, size, callback);
            };
            img.src = "http://dom.retrobox.eu/avatars/" + playerId + ".png";
            img.onerror = function () {
                gokoAvatarLoader(playerId, size, callback);
            };
            callback({
                playerId: playerId,
                image: img
            });
        };

        // Prevent the billions of 404 CORS and mixed content errors that
        // loading avatars from retrobox causes:
        // 1. Use the GS websocket to ask whether a custom avatar exists.
        // 2a. Look up a custom avatar from GS via https
        // 2b. Look up a vanilla avatar using the regular goko method
        // 
        // Goko should also provide any large (size >= 3) versions of the
        // avatars, even if a custom one is available.
        //
        // NOTE: The 'size' argument used to be called 'which'
        var SMALL = 1, MEDIUM = 2;
        FS.AvatarHelper.loadAvatarImage = function (playerId, size, callback) {
            if (size > MEDIUM) {
                gokoAvatarLoader(playerId, size, callback);
            } else if (typeof GS.hasAvatar[playerId] !== 'undefined') {
                if (GS.hasAvatar[playerId]) {
                    gsAvatarLoader(playerId, size, callback);
                } else {
                    gokoAvatarLoader(playerId, size, callback);
                }
            } else if (!GS.WS.isConnReady()) {
                console.log('No connection to gokosalvager server.  '
                          + 'Using retrobox to fetch avatar for player: ' + playerId);
                retroboxAvatarLoader(playerId, size, callback);
            } else {
                // Ask GS server whether custom avatar is available.
                // Continue asynchronously by showing the avatar.
                GS.WS.sendMessage('QUERY_AVATAR', {playerId: playerId}, function (resp) {
                    GS.hasAvatar[playerId] = resp.available;
                    if (resp.available === true) {
                        gsAvatarLoader(playerId, size, callback);
                    } else {
                        gokoAvatarLoader(playerId, size, callback);
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
