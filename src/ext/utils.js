/*jslint browser: true, devel: true, indent: 4, es5: true, vars: true, nomen: true, regexp: true, forin: true */
/*globals GokoSalvager */

GokoSalvager = {};

(function () {
    "use strict";

    var gs = window.GokoSalvager;
    console.log('Running Goko Salvager v2.3.3');

    var default_options = {
        autokick_by_rating: true,
        autokick_by_forname: true,
        alert_popups: false,
        alert_sounds: true,
        generator: true,
        proranks: true,
        sortrating: true,
        adventurevp: true,
        sidebar: true,
        vp_request: true,
        vp_refuse: false,
        always_stack: false,
        blacklist: [],
        automatch_blacklist: [],
        automatch_on_seek: true,
        automatch_min_players: 2,
        automatch_max_players: 2,
        automatch_min_sets: 1,
        automatch_max_sets: 15,
        automatch_rSystem: 'pro',
        automatch_rdiff: 1500,
        debug_mode: false,
        lasttablename: 'My Table'
    };

    gs.get_options = function () {
        var optName, out = {};
        if (localStorage.hasOwnProperty('salvagerOptions')) {
            out = JSON.parse(localStorage.salvagerOptions);
        }
        for (optName in default_options) {
            if (!out.hasOwnProperty(optName)) {
                out[optName] = default_options[optName];
            }
        }
        return out;
    };

    gs.set_options = function (options) {
        localStorage.salvagerOptions = JSON.stringify(options);
    };

    gs.get_option = function (optName) {
        return gs.get_options()[optName];
    };

    gs.set_option = function (optionName, optionValue) {
        var opts = gs.get_options();
        opts[optionName] = optionValue;
        gs.set_options(opts);
    };

    window.GokoSalvager.debugMode = false;
    window.GokoSalvager.debug = function (text) {
        if (this.get_option('debug_mode')) {
            console.log(text);
        }
    };

    window.GokoSalvager.alsoDo = function (obj, methodname, fnBefore, fnAfter) {

        // If we've already overridden this method, then override the
        // overriding method instead
        var methodname_o = '_' + methodname + '_orig';
        if (obj.prototype.hasOwnProperty(methodname_o)) {
            return window.GokoSalvager.alsoDo(obj, methodname_o, fnBefore, fnAfter);
        }

        // Cache original method
        obj.prototype[methodname_o] = obj.prototype[methodname];
    
        // Replace original method with a method sandwich
        obj.prototype[methodname] = function () {

            // Run fnBefore
            if (typeof fnBefore !== 'undefined' && fnBefore !== null) {
                fnBefore.apply(this, arguments);
            }

            // Run the original method
            var out = this[methodname_o].apply(this, arguments);

            // Run fnAfter
            if (typeof fnAfter !== 'undefined' && fnAfter !== null) {
                fnAfter.apply(this, arguments);
            }

            // Return the result of the original method
            return out;
        };
    };

    window.GokoSalvager.depWait = function (argNames, waitPeriod, callback, context, name) {
        function index(obj, i) { return obj[i]; }
        if (typeof name === 'undefined') { name = null; }

        var waitLoop;
        var exists = function (y) {
            return typeof y !== 'undefined' && y !== null;
        };
        var depTry = function () {
            var x;

            try {
                if (name) {
                    window.GokoSalvager.debug('Checking deps for ' + name);
                }
                x = argNames.map(function (argName) {
                    switch (argName[0]) {
                    case '#':
                        return window.document.getElementById(argName.substr(1));
                    case '.':
                        return window.document.getElementsByClassName(argName.substr(1))[0];
                    default:
                        return argName.split('.').reduce(index, window);
                    }
                });
            } catch (e) {
                if (name) {
                    window.GokoSalvager.debug('Error while looking for deps for ' + name);
                }
                return;
            }

            if (x.every(exists)) {
                if (name) { window.GokoSalvager.debug('Found deps for ' + name); }
                clearInterval(waitLoop);
                callback.apply(null, x);
                if (name) { window.GokoSalvager.debug('Found deps and ran ' + name); }
            } else if (name) {
                var i;
                for (i = 0; i < x.length; i += 1) {
                    if (!exists(x[i])) {
                        window.GokoSalvager.debug(name + ' is missing dependency: ' + argNames[i]);
                    }
                }
            }

        };
        waitLoop = setInterval(depTry, waitPeriod);
    };

    // Parse numbers like 303 and 4.23k
    window.GokoSalvager.parseNum = function (str) {
        try {
            var m = str.match(/^([0-9.]+)([kK]?)$/);
            return Math.floor(parseFloat(m[1]) * (m[2] !== '' ? 1000 : 1));
        } catch (e) {
            // Fail silently if unparseable strings get here
            return null;
        }
    };

    // Parse titles like X+, Y-, X-Y, and +/-Z
    // Precedence: +/- > range > min thresh > max thresh
    window.GokoSalvager.parseRange = function (tablename, myRating) {
        var m, minRating = null, maxRating = null;

        if ((m = tablename.match(/(\d+(.\d+)?([kK])?)-/)) !== null) {
            minRating = null;
            maxRating = this.parseNum(m[1]);
        }
        if ((m = tablename.match(/(\d+(.\d+)?([kK])?)\+/)) !== null) {
            minRating = this.parseNum(m[1]);
            maxRating = null;
        }
        if ((m = tablename.match(/(\d+(.\d+)?([kK])?)-(\d+(.\d+)?([kK])?)/)) !== null) {
            minRating = this.parseNum(m[1]);
            maxRating = this.parseNum(m[4]);
        }
        if ((m = tablename.match(/\+\/-(\d+(.\d+)?([kK])?)/)) !== null) {
            minRating = myRating - this.parseNum(m[1]);
            maxRating = myRating + this.parseNum(m[1]);
        }

        return [minRating, maxRating];
    };

    window.GokoSalvager.alertPlayer = function (message, sound) {
        if (window.GokoSalvager.get_option('alert_sounds')) {
            sound.play();
        }
        if (window.GokoSalvager.get_option('alert_popups')) {
            window.alert(message);
        }
    };
}());
