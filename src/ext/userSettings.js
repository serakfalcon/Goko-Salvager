/*jslint browser: true, devel: true, indent: 4, vars: true, nomen: true, regexp: true, forin: true, white:true */
/*global $, _, angular */

(function () {
    "use strict";
    
    /*
     * GokoSalvager UserSettings Module: displays option menu on login screen
     */
    var loadUserSettings = function (gs) {
    
        window.gokoSalvagerUserSettingsController = function ($scope) {
            // Load settings on initialization
            $scope.us = gs.get_options();
            gs.debug($scope.us);
    
            $scope.add_to_blacklist = function (pname) {
                if (pname) {
                    $scope.us.blacklist.push(pname);
                }
                $scope.temp_bl = null;
                $scope.save($scope.us);
            };
    
            $scope.rem_from_blacklist = function (pname) {
                gs.debug('adding ' + pname + ' to blacklist.');
                if (pname) {
                    $scope.us.blacklist =
                        $scope.us.blacklist.filter(function (p) {
                            return p !== pname;
                        });
                }
                $scope.save($scope.us);
            };
    
            $scope.saveVPReq = function (us) {
                us.vp_refuse = us.vp_refuse && !us.vp_request;
            };
    
            $scope.saveVPRef = function (us) {
                us.vp_request = us.vp_request && !us.vp_refuse;
            };
    
            $scope.save = function (us) {
                gs.debug(angular.copy(us));
                gs.set_options(angular.copy(us));
            };
        };
    
        // Open dialog with the "User Settings" link
        $('.fs-rs-logout-row').append(
            $('<div></div>')
                .addClass('fs-lg-settings-btn')
                .html('User Settings')
                .click(function () {
                    // Initialize if necessary
                    if ($('#usDialog').length === 0) {
                        $('#viewport').append(gs.createSettingsDialog());
                        angular.bootstrap($('#usDialog'));
                    }
                    // Display as JQueryUI popup dialog
                    $('#usDialog').dialog({
                        modal: true,
                        width: 550,
                        closeText: 'Save',
                        draggable: false,
                        resizeable: false,
                        autoOpen: false
                    });
                    $('#usDialog').dialog('open');
                })
        );
    };
    
    window.GokoSalvager.depWait(
        ['GokoSalvager', 'jQuery', 'angular', '.fs-rs-logout-row'],
        100, loadUserSettings, this, 'User Settings'
    );
}());
