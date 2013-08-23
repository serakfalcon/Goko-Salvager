gsAlsoDo = function (prototype, methodname, fnBefore, fnAfter) {

    // Cache old version without overriding previous old versions' names
    var methodname_o = '_' + methodname + '_orig';
    while (typeof prototype[methodname_o] !== 'undefined') {
        methodname_o = methodname_o + 'X';
    }
    prototype[methodname_o] = prototype[methodname];

    // Run old version sandwiched between "before" and "after" functions
    prototype[methodname] = function () {
        if (typeof fnBefore !== 'undefined') {
            fnBefore(arguments);
        }
        var out = prototype[methodname_o].apply(prototype, arguments);
        if (typeof fnAfter !== 'undefined') {
            fnAfter(arguments);
        }
        return out;
    };
};
