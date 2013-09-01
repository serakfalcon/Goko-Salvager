/*jslint browser: true, devel: true, indent: 4, es5: true, vars: true, nomen: true, regexp: true, forin: true */

(function () {
    "use strict";

    window.GokoSalvager = window.GokoSalvager || {};

    window.GokoSalvager.alsoDo = function (object, methodname, fnBefore, fnAfter) {
        // Cache old version without overriding previous old versions' names
        var methodname_o = '_' + methodname + '_orig';
        while (typeof object.prototype[methodname_o] !== 'undefined') {
            methodname_o = methodname_o + 'X';
        }
        object.prototype[methodname_o] = object.prototype[methodname];
    
        // Run old version sandwiched between "before" and "after" functions
        object.prototype[methodname] = function () {
            if (typeof fnBefore !== 'undefined' && fnBefore !== null) {
                fnBefore.apply(this, arguments);
            }
            var out = this[methodname_o].apply(this, arguments);
            if (typeof fnAfter !== 'undefined' && fnAfter !== null) {
                fnAfter.apply(this, arguments);
            }
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
            if (name) { console.log('Checking deps for ' + name); }
            var x = argNames.map(function (argName) {
                return argName.split('.').reduce(index, window);
            });
            
            if (x.every(exists)) {
                if (name) { console.log('Found deps for ' + name); }
                callback.apply(null, x);
            } else if (name) {
                var i;
                for (i = 0; i < x.length; i += 1) {
                    if (!exists(x[i])) {
                        console.log(name + ' is missing dependency: ' + argNames[i]);
                    }
                }
            }

            clearInterval(waitLoop);
            if (name) { console.log('Found deps and ran ' + name); }
        };
        waitLoop = setInterval(depTry, waitPeriod);
    };
}());
