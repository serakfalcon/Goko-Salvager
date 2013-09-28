/*jslint browser:true, devel:true, white:true, vars:true */
/*globals $, angular, GS */

(function () {
    "use strict";

    var mod = GS.modules.settingsDialog;
    var failCount = 0;
    var intvl = window.setInterval(function () {
        if (mod.hasAllDeps()) {
            window.clearInterval(intvl);
            mod.load();
        } else {
            failCount += 1;
            if (failCount % 10 === 0) {
                var missingDeps = mod.getUnreadyDeps();
                GS.debug('Module ' + mod.name + ' is missing dependencies:');
                GS.debug(missingDeps);
            }
        }
    }, 500);
} ());
