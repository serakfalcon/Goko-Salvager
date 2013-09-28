/*jslint browser:true, devel:true, white:true, vars:true, forin:true */
/*globals $, angular, GS */

(function () {
    "use strict";

    // List of GS modules still waiting for their dependencies
    var toLoad = Object.keys(GS.modules).map(function(key){
        return GS.modules[key];
    });

    // How many times each module has failed to find its dependencies
    var failCounts = {};
    toLoad.map(function (mod) {
        failCounts[mod.name] = 0;
    });

    var notLoaded = function (mod) {
        return !mod.loaded;
    };

    // Try to load all not-yet-loaded modules
    var intvl = setInterval(function () {
        toLoad = toLoad.filter(notLoaded);

        var i, mod, missing;
        for (i = 0; i < toLoad.length; i += 1) {
            mod = toLoad[i];
            missing = mod.getMissingDeps();
            if (missing.length === 0) {
                mod.loaded = true;
                mod.load();
            } else {
                failCounts[mod.name] += 1;
                if (failCounts[mod.name] % 10 === 0) {
                    GS.debug('Module ' + mod.name + ' is missing dependencies:');
                    GS.debug(missing);
                }
            }
        }
    }, 500);
} ());
