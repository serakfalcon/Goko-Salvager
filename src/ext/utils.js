gsAlsoDo = function (object, methodname, fnBefore, fnAfter) {

    // Cache old version without overriding previous old versions' names
    var methodname_o = '_' + methodname + '_orig';
    while (typeof object[methodname_o] !== 'undefined') {
        methodname_o = methodname_o + 'X';
    }
    object[methodname_o] = object[methodname];

    // Run old version sandwiched between "before" and "after" functions
    object[methodname] = function () {
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
