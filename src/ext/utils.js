/*jslint browser: true, devel: true, indent: 4, es5: true, vars: true, nomen: true, regexp: true, forin: true */
/*globals mtgRoom */

GokoSalvager = {};

(function () {
    "use strict";

    console.log('Running Goko Salvager');

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

    GokoSalvager.get_options = function () {
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

    GokoSalvager.set_options = function (options) {
        localStorage.salvagerOptions = JSON.stringify(options);
    };

    GokoSalvager.get_option = function (optName) {
        return GokoSalvager.get_options()[optName];
    };

    GokoSalvager.set_option = function (optionName, optionValue) {
        var opts = GokoSalvager.get_options();
        opts[optionName] = optionValue;
        GokoSalvager.set_options(opts);
    };

    GokoSalvager.debugMode = false;
    GokoSalvager.debug = function (text) {
        if (this.get_option('debug_mode')) {
            console.log(text);
        }
    };

    GokoSalvager.alsoDo = function (object, methodname, fnBefore, fnAfter) {

        // If we've already overridden this method, then override the
        // overriding method instead
        var methodname_o = '_' + methodname + '_orig';
        if (object.prototype.hasOwnProperty(methodname_o)) {
            return GokoSalvager.alsoDo(object, methodname_o, fnBefore, fnAfter);
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

    GokoSalvager.depWait = function (argNames, waitPeriod, callback, context, name) {
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
                    GokoSalvager.debug('Checking deps for ' + name);
                }
                x = argNames.map(function (argName) {
                    switch (argName[0]) {
                    case '#':
                        return document.getElementById(argName.substr(1));
                    case '.':
                        return document.getElementsByClassName(argName.substr(1))[0];
                    default:
                        return argName.split('.').reduce(index, window);
                    }
                });
            } catch (e) {
                if (name) {
                    GokoSalvager.debug('Error while looking for deps for ' + name);
                }
                throw e;
                return;
            }

            if (x.every(exists)) {
                if (name) { GokoSalvager.debug('Found deps for ' + name); }
                clearInterval(waitLoop);
                callback.apply(null, x);
                if (name) { GokoSalvager.debug('Found deps and ran ' + name); }
            } else if (name) {
                var i;
                for (i = 0; i < x.length; i += 1) {
                    if (!exists(x[i])) {
                        GokoSalvager.debug(name + ' is missing dependency: ' + argNames[i]);
                    }
                }
            }

        };
        waitLoop = setInterval(depTry, waitPeriod);
    };

    // Parse numbers like 303 and 4.23k
    GokoSalvager.parseNum = function (str) {
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
    GokoSalvager.parseRange = function (tablename, myRating) {
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

    GokoSalvager.alertPlayer = function (message, sound) {
        if (GokoSalvager.get_option('alert_sounds')) {
            sound.play();
        }
        if (GokoSalvager.get_option('alert_popups')) {
            alert(message);
        }
    };

    GokoSalvager.getTableName = function () {
        try {
            return JSON.parse(mtgRoom.getCurrentTable().get('settings')).name;
        } catch (e) {
            return null;
        }
    };

    GokoSalvager.getMyName = function () {
        return mtgRoom.localPlayer.get('playerName');
    };

    GokoSalvager.getGameClient = function () {
        if (typeof mtgRoom !== 'undefined') {
            var roomId = mtgRoom.currentRoomId;
            if (roomId !== null) {
                var table = mtgRoom.getCurrentTable();
                var tableNo = table !== null ? table.get('number') : 0;
                var key = roomId + ':' + tableNo;
                return mtgRoom.games[key];
            }
        }
        return null;
    };
    
    GokoSalvager.sendRoomChat = function (message) {
        var gc = GokoSalvager.getGameClient();
        gc.clientConnection.send('sendChat', {text: message});
    };

    // Show a message in my chat box without sending
    GokoSalvager.showRoomChat = function (message) {
        var gc = GokoSalvager.getGameClient();
        gc.clientConnection.trigger("addChat", {
            playerName: '**',
            text: message
        });
    };

    GokoSalvager.url = 'www.gokosalvager.com';
}());
