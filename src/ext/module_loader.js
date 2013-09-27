GS.depWait = function (argNames, waitPeriod, callback, context, name) {
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
                GS.debug('Checking deps for ' + name);
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
                GS.debug('Error while looking for deps for ' + name);
            }
            return;
        }

        if (x.every(exists)) {
            if (name) { GS.debug('Found deps for ' + name); }
            clearInterval(waitLoop);
            callback.apply(null, x);
            if (name) { GS.debug('Found deps and ran ' + name); }
        } else if (name) {
            var i;
            for (i = 0; i < x.length; i += 1) {
                if (!exists(x[i])) {
                    GS.debug(name + ' is missing dependency: ' + argNames[i]);
                }
            }
        }

    };
    waitLoop = setInterval(depTry, waitPeriod);
};
