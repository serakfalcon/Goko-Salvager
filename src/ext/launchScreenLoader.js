/*jslint browser: true, devel: true, indent: 4, vars: true, nomen: true, regexp: true, forin: true */
/*global $, _, GS, FS, fsConnectionParams */

if (typeof GS.LSLoader === 'undefined') {
    GS.LSLoader = {};
}
(function () {
    "use strict";
    console.log('Loading LaunchScreenLoader');
    GS.modules.launchScreenLoader = new GS.Module('Launch Screen Loader');
    GS.modules.launchScreenLoader.dependencies = [
        '$',
        'angular',
        '#viewport',
        '.fs-rs-logout-row',
        'mtgRoom',
        'FS',
        'Goko.Player.AvatarLoader',
        'GS.LSLoader',
        'fsConnectionParams',
        'GS.LSLoader.addSettingsLink',
        'Goko.Player.preloader',
        'FS.AvatarHelper',
        'FS.LaunchScreen'
    ];
    GS.modules.launchScreenLoader.load = function () {
        var optslvl1 = {
            container: 'launch-screen-container',
            conn: FS.LaunchScreen.Main._instance.container.conn,
            gameId: fsConnectionParams.gameId,
            background: [
                './img-launch-screen/game-background.jpg',
                './img/display960x640/ui_loading_screen_background.jpg',
                './img/display1024x768/ui_loading_screen_background.jpg',
                './img-launch-screen/ui_loading_screen_background.jpg'],
            onRegisterClick: FS.LaunchScreen.Main._instance.container._onRegisterClick,
            onSignOutClick: FS.LaunchScreen.Main._instance.container._onSignOutClick
        };
        
        var persist = FS.LaunchScreen.Persistent.getInstance(optslvl1.conn, optslvl1.gameId, optslvl1);
        
        var allCallbacks = function () {
            //GS.LSLoader.addChangeAvatarLink();
            //GS.LSLoader.setLoginScreenAvatar();
            GS.LSLoader.addSettingsLink();
        };

        FS.LaunchScreen.View.Container.prototype.options = {
            opts: optslvl1,
            persistent: persist,
            root: FS.LaunchScreen.Main
        };
        FS.LaunchScreen.View.Container.prototype.init(allCallbacks);
        
        //for Chrome
        allCallbacks();
    };
}());
