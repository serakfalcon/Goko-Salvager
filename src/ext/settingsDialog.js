/*jslint browser:true, devel:true, white:true, es5:true, nomen:true */
/*globals $, angular, GS, FS, mtgRoom */

//if launchscreenloader namespace doesn't exist, create it
//any functions that alter the launchscreen should be saved in this namespace and called in launchScreenLoader.js
if (typeof GS.LSLoader === 'undefined') { GS.LSLoader = {}; }
(function () {
    "use strict";
    console.log('Loading Settings Dialog');
    GS.modules.settingsDialog = new GS.Module('User Settings Dialog');
    GS.modules.settingsDialog.dependencies = [
        '$',
        'angular',
        '#viewport',
        '.fs-rs-logout-row',
        'mtgRoom',
        'FS',
        'FS.LaunchScreen.View.Container'
    ];
    GS.modules.settingsDialog.load = function () {

        // Create dialog
        $('#viewport')
            .append($('<div>').attr('id', 'settingsDialog')
                              .attr('title', 'Extension Settings')
                              .attr('ng-app', 'settingsApp')
                              .attr('ng-controller', 'settingsController')

                .append($('<div>').text('Autokick:'))
                .append($('<input>').attr('type', 'checkbox')
                                    .attr('ng-model', 'so.autokick_by_rating')
                                    .addClass('indented'))
                .append('By rating range<br>')
                .append($('<input>').attr('type', 'checkbox')
                                    .attr('ng-model', 'so.autokick_by_forname')
                                    .addClass('indented'))
                .append('By player name<br>')
                .append('Animation Speed:<br>')
                .append($('<input>').attr('type', 'checkbox')
                                    .attr('ng-model', 'so.speed_tweak_uniform')
                                    .attr('ng-change', 'updateSpeeds()')
                                    .addClass('indented'))
                .append('More consistent speeds<br>')
                .append($('<input>').attr('type', 'checkbox')
                                    .attr('ng-model', 'so.speed_tweak_faster')
                                    .attr('ng-change', 'updateSpeeds()')
                                    .attr('ng-disabled', '!so.speed_tweak_uniform')
                                    .addClass('indented'))
                .append('Speed up "normal" and "fast" modes<br>')

                .append($('<div>').text('Quick game:'))
                .append('&nbsp;&nbsp;&nbsp;&nbsp;Name:')
                .append($('<input>').attr('type', 'name')
                                    .attr('ng-model', 'so.quick_game_name')
                                    .addClass('indented'))
                .append('<br>')
                .append('&nbsp;&nbsp;&nbsp;&nbsp;Type (pro/casual/unrated):')
		//TODO Name and # of players to <select>
		//.append($('<select>').attr('ng-model', 'so.quick_game_type')
		//.attr('ng-options', 't.name for t in quick_game_types')
		//.addClass('indented')
		//)
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
                .append('Use Automatch<br>')

                .append($('<div>').text('Notifications:'))
                .append($('<input>').attr('type', 'checkbox')
                                    .attr('ng-model', 'so.audio_notifications')
                                    .addClass('indented'))
                .append('Sounds<br>')
                .append($('<input>').attr('id', 'desktopnotificationcheckbox')
                                    .attr('type', 'checkbox')
                                    .attr('ng-model', 'so.desktop_notifications')
                                    .addClass('indented'))
                .append('HTML5 "Desktop" Notifications (recommended)<br>')
                .append($('<input>').attr('type', 'checkbox')
                                    .attr('ng-model', 'so.popup_notifications')
                                    .addClass('indented'))
                .append('Traditional popups<br>')

                .append($('<div>').text('Lobby Ratings:'))
                .append($('<input>').attr('type', 'checkbox')
                                    .attr('ng-model', 'so.sortrating')
                                    .addClass('indented'))
                .append('Sort players by rating<br>')
                .append($('<input>').attr('type', 'checkbox')
                                    .attr('ng-model', 'so.proranks')
                                    .addClass('indented'))
                .append('Display pro ratings<br>')

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
                                    .attr('ng-model', 'so.generator'))
                .append('Kingdom Generator<br>')

                .append($('<input>').attr('type', 'checkbox')
                                    .attr('ng-model', 'so.always_stack'))
                .append('Stack duplicate cards<br>')

                .append($('<input>').attr('type', 'checkbox')
                                    .attr('ng-model', 'so.debug_mode'))
                .append('Extra logging (for error reports)<br>')

                .append('Blacklist (noplay + censor):<br>')
                .append($('<table>').addClass('indented')
                    .append($('<tbody>')
                        .append($('<tr>').attr('ng-repeat', 'pname in so.blacklist')
                            .append($('<td>').css('color', 'red')
                                             .attr('ng-click', 'blRemove(pname)')
                                             .text('X'))
                            .append($('<td>').text('{{pname}}')))))
                .append($('<form>').attr('ng-submit', 'blAdd()')
                                   .addClass('indented')
                    .append('Add:')
                    .append($('<input>').attr('type', 'text')
                                        .attr('ng-model', 'newBlacklistee')))

                .append('Automatch Blacklist (no-automatch):<br>')
                .append($('<table>').addClass('indented')
                    .append($('<tbody>')
                        .append($('<tr>').attr('ng-repeat', 'pname in so.automatch_blacklist')
                            .append($('<td>').css('color', 'red')
                                             .attr('ng-click', 'amblRemove(pname)')
                                             .text('X'))
                            .append($('<td>').text('{{pname}}')))))
                .append($('<form>').attr('ng-submit', 'amblAdd()')
                                   .addClass('indented')
                    .append('Add:')
                    .append($('<input>').attr('type', 'text')
                                        .attr('ng-model', 'newAMBlacklistee'))));

        // Make dialog into a JQueryUI popup
        $('#settingsDialog').dialog({
            modal: true,
            width: 550,
	    maxHeight: $( window ).height(),
            closeText: 'Save',
            draggable: false,
            resizeable: false,
            autoOpen: false
        });

        GS.LSLoader.addSettingsLink = function () {
            // Add link to open dialog if necessary
            if ($('#userSettingsLink').length === 0) {
                $('.fs-rs-logout-row').append(
                    $('<div>').addClass('fs-lg-settings-btn')
                              .attr('id', 'userSettingsLink')
                              .text('User Settings')
                              .click(function () {
                                  $('#settingsDialog').dialog('open');
                              }));
            }
        };
			

        window.settingsController = function ($scope) {
	    $scope.quick_game_types = [
	        {name:'pro'},
		{name:'casual'},
		{name:'unrated'},
	    ];
            $scope.so = GS.get_options();
            $scope.blAdd = function () {
                if ($scope.newBlacklistee) {
                    $scope.so.blacklist.push($scope.newBlacklistee);
                    $scope.newBlacklistee = '';
                }
            };
            $scope.blRemove = function (pname) {
                $scope.so.blacklist = $scope.so.blacklist.filter(function (pn) {
                    return pn !== pname;
                });
            };
            $scope.amblAdd = function () {
                if ($scope.newAMBlacklistee) {
                    $scope.so.automatch_blacklist.push($scope.newAMBlacklistee);
                    $scope.newAMBlacklistee = '';
                }
            };
            $scope.amblRemove = function (pname) {
                $scope.so.automatch_blacklist =
                    $scope.so.automatch_blacklist.filter(function (pn) {
                        return pn !== pname;
                    });
            };

            // Speed tweak settings
            $scope.updateSpeeds = function () {
                console.log('tweaking animation speeds');
                GS.tweakAnimationSpeeds();
            };
            $scope.$watch('so.speed_tweak_uniform', function () {
                $scope.so.speed_tweak_faster =
                    $scope.so.speed_tweak_faster && $scope.so.speed_tweak_uniform;
            });

            $scope.$watch('so.vp_refuse', function () {
                $scope.so.vp_request = $scope.so.vp_request && !$scope.so.vp_refuse;
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
