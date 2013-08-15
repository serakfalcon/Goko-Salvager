/*jslint browser: true, devel: true, indent: 4, vars: true, nomen: true, regexp: true, forin: true */
/*global $, _, */

var loadTableSavingModule, loadConfigurationModule;
(function () {
    "use strict";

    window.GokoSalvager = window.GokoSalvager || {};

    var exists = function (obj) {
        return (typeof obj !== 'undefined' && obj !== null);
    };

    var waitLoop = setInterval(function () {
        var gs, etv, detv;
    
        try {
            gs = window.GokoSalvager;
            etv = window.FS.EditTableView;
            detv = window.FS.DominionEditTableView;
        } catch (e) {}

        if ([gs, etv, detv].every(exists)) {
            loadTableSavingModule(gs, etv, detv);
            clearInterval(waitLoop);
        }
    }, 100);
}());

/*
 * Saving table name and settings module
 */
loadTableSavingModule = function (gs, etv, detv) {
    "use strict";

    etv.prototype.old_modifyDOM = etv.prototype.modifyDOM;
    etv.prototype.modifyDOM = function () {
        var create = !_.isNumber(this.tableIndex);
        var lasttablename = this.$tableName.val() || gs.options.lasttablename;
        gs.options.lasttablename = lasttablename;
        gs.options_save();
        etv.prototype.old_modifyDOM.call(this);
        if (create && lasttablename) {
            this.$tableName.val(lasttablename);
        }
    };

    var firstCreateTable = true;
    detv.prototype.old_modifyDOM = detv.prototype.modifyDOM;
    detv.prototype.modifyDOM = function () {
        var create = !_.isNumber(this.tableIndex);
        if (create && firstCreateTable) {
            if (gs.options.cacheSettings) {
                this.cacheSettings = gs.options.cacheSettings;
            }
            firstCreateTable = false;
        }
        detv.prototype.old_modifyDOM.call(this);
    };

    detv.prototype.old_retriveDOM = detv.prototype.retriveDOM;
    detv.prototype.retriveDOM = function () {
        var ret = detv.prototype.old_retriveDOM.call(this);
        if (ret) {
            gs.options.cacheSettings = this.cacheSettings;
            gs.options_save();
        }
        return ret;
    };
};
