/*jslint browser: true, devel: true, indent: 4, vars: true, nomen: true, regexp: true, forin: true */
/*global $, _, */

var loadConfigurationModule;
(function () {
    "use strict";
    window.GokoSalvager = window.GokoSalvager || {};
    loadConfigurationModule(window.GokoSalvager);
}());

/*
 * GokoSalvager Configuration module
 *
 * Goko dependencies: none
 * Internal dependencies: none
 */
loadConfigurationModule = function (gs) {
    "use strict";

    var default_options = {
        version: 2.2,
        autokick: true,
        autoautomatch: null,
        generator: true,
        proranks: true,
        sortrating: true,
        adventurevp: true,
        vpEnabled: true,
        vpAlwaysOn: false,
        vpAlwaysOff: false,
        alwaysStack: false,
        blacklist: [""]
    };

    gs.options_save = function () {
        localStorage.salvagerOptions = JSON.stringify(gs.options);
    };

    gs.options_load = function () {
        if (localStorage.salvagerOptions) {
            gs.options = JSON.parse(localStorage.salvagerOptions);
        }
        var o;
        for (o in default_options) {
            if (!(gs.options.hasOwnProperty(o))) {
                gs.options[o] = default_options[o];
            }
        }
    };
};
