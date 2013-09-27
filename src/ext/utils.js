/*jslint browser: true, devel: true, indent: 4, es5: true, vars: true, nomen: true, regexp: true, forin: true */

(function () {
    "use strict";

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

    GS.get_options = function () {
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

    GS.set_options = function (options) {
        localStorage.salvagerOptions = JSON.stringify(options);
    };

    GS.get_option = function (optName) {
        return GS.get_options()[optName];
    };

    GS.set_option = function (optionName, optionValue) {
        var opts = GS.get_options();
        opts[optionName] = optionValue;
        GS.set_options(opts);
    };

    GS.debug = function (text) {
        if (this.get_option('debug_mode')) {
            console.log(text);
        }
    };

    GS.alsoDo = function (object, methodname, fnBefore, fnAfter) {

        // If we've already overridden this method, then override the
        // overriding method instead
        var methodname_o = '_' + methodname + '_orig';
        if (object.prototype.hasOwnProperty(methodname_o)) {
            return GS.alsoDo(object, methodname_o, fnBefore, fnAfter);
        }

        // Cache original method
        object.prototype[methodname_o] = object.prototype[methodname];
    
        // Replace original method with a method sandwich
        object.prototype[methodname] = function () {

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

    // Parse numbers like 303 and 4.23k
    GS.parseNum = function (str) {
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
    GS.parseRange = function (tablename, myRating) {
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

    GS.alertPlayer = function (message, sound) {
        if (GS.get_option('alert_sounds')) {
            sound.play();
        }
        if (GS.get_option('alert_popups')) {
            alert(message);
        }
    };
}());
