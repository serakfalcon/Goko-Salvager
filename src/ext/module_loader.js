/*jslint browser:true, devel:true, white:true, vars:true, forin:true */
/*globals $, angular, GS */

(function () {
    "use strict";

    // How many times each module has failed to find its dependencies
    var failCounts = {};

    // Track which modules have been loaded
    var loaded = [];

    // Try to load all not-yet-loaded modules.
    // Keep looping indefinitely in case this runs before all modules
    // have been defined.
    var intvl = setInterval(function () {
        // List of GS modules still waiting for their dependencies
        var toLoad = Object.keys(GS.modules).map(function(key){
            return GS.modules[key];
        }).filter(function (mod) {
            return loaded.indexOf(mod.name) === -1;
        });

        var i, mod, missing;
        for (i = 0; i < toLoad.length; i += 1) {
            mod = toLoad[i];
            missing = mod.getMissingDeps();
            if (missing.length === 0) {
                mod.load();
                loaded.push(mod.name);
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
