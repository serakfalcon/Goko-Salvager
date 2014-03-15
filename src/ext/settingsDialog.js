/*jslint browser:true, devel:true, es5:true, nomen:true, forin:true, vars:true */
/*globals $, _, angular, GS, FS, mtgRoom */

(function () {
    "use strict";
    console.log('Loading Settings Dialog');
    GS.modules.settingsDialog = new GS.Module('User Settings Dialog');
    GS.modules.settingsDialog.dependencies = [
        '$',
        'angular',
        '#viewport',
        '.fs-rs-logout-row',
        'FS',
        'GS.WS',
        'FS.LaunchScreen.View.Container',
        'mtgRoom.conn.connInfo',
        'GS.submitBlacklist',
        'GS.reconcileBlacklist',
        'GS.cachedCommonBlacklist'
    ];
    GS.modules.settingsDialog.load = function () {

        // Create dialog
        $('#viewport')
            .append($('<div>').attr('id', 'settingsDialog')
                              .attr('title', 'Extension Settings')
                              .attr('ng-app', 'settingsApp')
                              .attr('ng-controller', 'settingsController')
                .append($('<div id="settingsTabs">')
                    .append($('<ul>')
                        .append($('<li><a href="#settingsTabs-lobby">Lobby</a></li>'))
                        .append($('<li><a href="#settingsTabs-game">Game</a></li>'))
                        .append($('<li><a href="#settingsTabs-black">Blacklist</a></li>'))
                        .append($('<li><a href="#settingsTabs-misc">Misc</a></li>')))
                    .append($('<div id="settingsTabs-game">'))
                    .append($('<div id="settingsTabs-black">'))
                    .append($('<div id="settingsTabs-lobby">'))
                    .append($('<div id="settingsTabs-misc">'))));

        // Display dialog sections using tabbed sheets
        $('#settingsTabs').tabs();

        // Define the dialog sections: in-game settings
        $('#settingsTabs-game')
            .append($('<div>').text('In-game sidebar'))
            .append($('<input>').attr('type', 'checkbox')
                                .attr('ng-model', 'so.sidebar')
                                .addClass('indented'))
            .append('Show sidebar (VPs, log, chat)<br>')
            .append($('<input>').attr('type', 'checkbox')
                                .attr('ng-model', 'so.sidebar_chat')
                                .addClass('indented'))
            .append('Replace Goko chat window<br>')
            .append($('<div>').text('VP Counter'))
            .append($('<input>').attr('type', 'checkbox')
                                .attr('ng-model', 'so.vp_request')
                                .addClass('indented'))
            .append('Always request (#vpon)<br>')
            .append($('<input>').attr('type', 'checkbox')
                                .attr('ng-model', 'so.vp_refuse')
                                .addClass('indented'))
            .append('Always refuse (#vpoff)<br>')
            .append($('<input>').attr('type', 'checkbox')
                                .attr('ng-model', 'so.always_stack'))
            .append('Stack duplicate cards<br>')
            .append('Greeting Message')
            .append($('<input>').attr('type', 'text')
                                .attr('ng-model', 'so.greeting'));

        // Define the dialog sections: blacklist settings
        $('#settingsTabs-black')
            .append('<br>')
            .append($('<form name="blnewForm" novalidate>')
                .append($('<table style="table-layout:fixed">').addClass('indented')
                    .append($('<tbody>')
                        .append($('<tr>')
                            .append($('<td width="50%"><b>Player</b></td>'))
                            .append($('<td width="15%"><b>Kick</b></td>'))
                            .append($('<td width="15%"><b>NoAM</b></td>'))
                            .append($('<td width="15%"><b>Censor</b></td>'))
                            .append($('<td width="5%">')))
                        .append($('<tr ng-repeat="(pname, o) in so.blacklist2">')
                            .append($('<td>{{pname}}</td>'))
                            .append($('<td><input type="checkbox" ng-model="o.noplay"></td>'))
                            .append($('<td><input type="checkbox" ng-model="o.nomatch"></td>'))
                            .append($('<td><input type="checkbox" ng-model="o.censor"></td>'))
                            .append($('<td><button ng-click="bldel(pname)">Del</button></td>')))
                        .append($('<tr>')
                            .append($('<td>')
                                .append($('<input type="text" ng-model="blnewpname" '
                                        + 'id="blnewpnameField" required>')))
                            .append($('<td>')
                                .append($('<input>').attr('type', 'checkbox')
                                                    .attr('ng-model', 'blnew.noplay')
                                                    .attr('ng-disabled', 'blnewForm.$invalid')))
                            .append($('<td>')
                                .append($('<input>').attr('type', 'checkbox')
                                                    .attr('ng-model', 'blnew.nomatch')
                                                    .attr('ng-disabled', 'blnewForm.$invalid')))
                            .append($('<td>')
                                .append($('<input>').attr('type', 'checkbox')
                                                    .attr('ng-model', 'blnew.censor')
                                                    .attr('ng-disabled', 'blnewForm.$invalid')))
                            .append($('<td>')
                                .append($('<button>').attr('ng-click', 'bladd()')
                                                     .attr('ng-disabled', 'blnewForm.$invalid')
                                                     .attr('id', 'blAddButton')
                                    .append('Add')))))))
            .append($('<br>'))
            .append($('<div>')
                .append('Common Blacklist:<br>')
                .append($('<div>').addClass('indented')
                    .append('Also blacklist the ')
                    .append($('<select>').attr('ng-model', 'so.blacklist_common')
                                        .attr('ng-options', 's for s in blacklist_strengths')
                                        .attr('ng-change', 'cacheCommonBlacklist'))
                    .append('% most-commonly blacklisted players')));

        // Pressing enter adds the new blacklist entry
        $('#blnewpnameField').keypress(function (e) {
            if (e.which === 13) {
                e.preventDefault();
                $(this).blur();
                $('#blAddButton').focus().click();
                $('#blnewpnameField').focus();
                return false;
            }
        });

        // Define the dialog sections: lobby settings
        $('#settingsTabs-lobby')
                .append($('<div>').text('Notifications:'))
                .append($('<input>').attr('type', 'checkbox')
                                    .attr('ng-model', 'so.audio_notifications')
                                    .addClass('indented'))
                .append('Sounds<br>')
                .append($('<input>').attr('type', 'checkbox')
                                    .attr('ng-model', 'so.popup_notifications')
                                    .addClass('indented'))
                .append('Traditional popups<br>')
                .append($('<input>').attr('id', 'desktopnotificationcheckbox')
                                    .attr('type', 'checkbox')
                                    .attr('ng-model', 'so.desktop_notifications')
                                    .addClass('indented'))
                .append('HTML5 Notifications (recommended)<br>')

                .append($('<div>').text('Lobby Ratings:'))
                .append($('<input>').attr('type', 'checkbox')
                                    .attr('ng-model', 'so.sortrating')
                                    .addClass('indented'))
                .append('Sort players by rating<br>')
                .append($('<input>').attr('type', 'checkbox')
                                    .attr('ng-model', 'so.proranks')
                                    .addClass('indented'))
                .append('Display pro ratings<br>')

                .append($('<div>').text('Autokick:'))
                .append($('<input>').attr('type', 'checkbox')
                                    .attr('ng-model', 'so.autokick_by_rating')
                                    .addClass('indented'))
                .append('By rating range<br>')
                .append($('<input>').attr('type', 'checkbox')
                                    .attr('ng-model', 'so.autokick_by_forname')
                                    .addClass('indented'))
                .append('By player name<br>')

                .append($('<div>').text('Quick game:'))
                .append('&nbsp;&nbsp;&nbsp;&nbsp;Name:')
                .append($('<input>').attr('type', 'name')
                                    .attr('ng-model', 'so.quick_game_name')
                                    .addClass('indented'))
                .append('<br>')
                .append('&nbsp;&nbsp;&nbsp;&nbsp;Type (pro/casual/unrated):')
                .append($('<input>').attr('type', 'name')
                                    .attr('ng-model', 'so.quick_game_type')
                                    .addClass('indented'))
                .append('<br>')
                .append('&nbsp;&nbsp;&nbsp;&nbsp;# of players (2/3/4/5/6):')
                .append($('<input>').attr('type', 'name')
                                    .attr('ng-model', 'so.quick_game_players')
                                    .addClass('indented'))
                .append('<br>')
                .append($('<input>').attr('type', 'checkbox')
                                    .attr('ng-model', 'so.quick_game_automatch')
                                    .addClass('indented'))
                .append('Use Automatch<br>');

        // Define the dialog sections: miscellaneous settings
        $('#settingsTabs-misc')
            .append($('<input>').attr('type', 'checkbox')
                                .attr('ng-model', 'so.generator'))
            .append('Kingdom Generator<br>')
            .append($('<input>').attr('type', 'checkbox')
                                .attr('ng-model', 'so.debug_mode'))
            .append('Extra logging (for error reports)<br>');

        // Verify blacklist when opening Blacklist tab.  Save on close.
        $('#settingsTabs').on("tabsactivate", function (event, ui) {
            if (ui.newTab[0].innerText === 'Blacklist') {
                // Compare local and server lists when opening Blacklist tab
                GS.reconcileBlacklist(function () {
                    $('#settingsTabs').scope().$digest();
                });
            } else if (ui.oldTab[0].innerText === 'Blacklist') {
                // Save local lists when closing Blacklist tab
                GS.submitBlacklist();
            }
        });
        // Also save blacklist when settings dialog is closed.
        $('#settingsDialog').on("dialogclose", function (event, ui) {
            GS.submitBlacklist();
        });

        // Override goko's select-hiding CSS nonsense
        $('#settingsTabs select').css('visibility', 'inherit');
        $('#settingsTabs select').css('top', 'auto');

        // Make dialog into a JQueryUI popup
        $('#settingsDialog').dialog({
            modal: true,
            width: 700,
            maxHeight: $(window).height(),
            closeText: 'Save',
            draggable: true,
            resizeable: false,
            position: { my: "center", at: "center", of: window },
            autoOpen: false
        });

        window.settingsController = function ($scope) {
            $scope.quick_game_types = [
                {name: 'pro'},
                {name: 'casual'},
                {name: 'unrated'},
            ];
            $scope.blnewpname = '';
            $scope.blnew = {
                noplay: true,
                nomatch: true,
                censor: true
            };
            $scope.blacklist_strengths = [
                0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100
            ];
            $scope.so = GS.get_options();

            $scope.parseLocalStorage = function () {
                $scope.so = GS.get_options();
                $scope.$digest();
            };

            $scope.bldel = function (pname) {
                delete $scope.so.blacklist2[pname];
            };
            $scope.bladdDisable = function () {
                return $scope.blnewpname === '';
            };
            $scope.bladd = function () {
                if ($scope.blnewpname !== '') {
                    $scope.so.blacklist2[$scope.blnewpname] = {
                        noplay: $scope.blnew.noplay,
                        nomatch: $scope.blnew.nomatch,
                        censor: $scope.blnew.censor
                    };
                    $scope.blnew = {
                        noplay: true,
                        nomatch: true,
                        censor: true
                    };
                }
                $scope.blnewpname = '';
            };
            $scope.cacheCommonBlacklist = function () {
                GS.cacheCommonBlacklist($scope.so.blacklist_common, function () {});
            };

            $scope.$watch('so.vp_refuse', function () {
                $scope.so.vp_request = $scope.so.vp_request && !$scope.so.vp_refuse;
            });
            $scope.$watch('so.sidebar', function () {
                $scope.so.sidebar_chat = $scope.so.sidebar_chat && $scope.so.sidebar;
            });
            $scope.$watch('so.sidebar_chat', function () {
                $scope.so.sidebar = $scope.so.sidebar_chat || $scope.so.sidebar;
            });
            $scope.$watch('so.vp_request', function () {
                $scope.so.vp_refuse = $scope.so.vp_refuse && !$scope.so.vp_request;
            });
            $scope.$watch('so.desktop_notifications', function () {
                $scope.so.popup_notifications =
                    $scope.so.popup_notifications && !$scope.so.desktop_notifications;
            });
            $scope.$watch('so.popup_notifications', function () {
                $scope.so.desktop_notifications =
                    $scope.so.desktop_notifications && !$scope.so.popup_notifications;
            });

            $scope.$watch('so', function () {
                GS.set_options($scope.so);
            }, true);
            $scope.$watch(GS.get_options, function () {
                $scope.so = GS.get_options();
            }, true);
        };
        angular.bootstrap($('#settingsDialog'));
    };
}());
