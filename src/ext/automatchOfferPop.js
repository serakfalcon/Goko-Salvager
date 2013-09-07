/*jslint browser: true, devel: true, indent: 4, maxlen: 90, es5: true, vars:true, nomen:true */
/*global jQuery, $, _, angular */

(function () {
    "use strict"; // JSList mode

    var gs = window.GokoSalvager;
    gs.AM = gs.AM || {};

    gs.AM.appendOfferPopup = function (viewport) {

        // Enable AngularJS for this popup
        angular.module('offerApp', ['offerApp.filters', 'offerApp.controllers'])
               .config(['$routeProvider', function ($routeProvider) { } ]);

        // Show expansions once each and in order of publication
        var orderedExpansions = ['base', 'intrigue', 'seaside', 'alchemy',
            'prosperity', 'cornucopia', 'hinterlands', 'darkages', 'guilds'];
        angular.module('offerApp.filters', [])
            .filter('expansion', function () {
                return function (arr, expression, comparator) {
                    var exps = arr.map(function (expname) {
                        return expname.replace(/(\s|\d)/g, '').toLowerCase();
                    });
                    return orderedExpansions.filter(function (expName) {
                        return exps.indexOf(expName) !== -1;
                    });
                };
            });

        angular.module('offerApp.controllers', [])
            .controller('offerController', function ($scope) {
                $scope.players = [];
                $scope.expansions = ["base"];
                $scope.getRatingIcon = function (ratingSystem) {
                    var base = 'http://play.goko.com/Dominion/img-meeting-room/';
                    return {
                        pro: base + 'MR_Pro_icon.png',
                        casual: 'MR_Casual_icon.png',
                        unrated: 'MR_nonranked_icon.png'
                    }[ratingSystem];
                };
                $scope.getExpansionIcon = function (expansionName) {
                    var base, name;
                    base = 'http://gokologs.drunkensailor.org/static/img/expansions/';
                    name = expansionName.replace(/(\s|\d)/g, '').toLowerCase();
                    return base + name + '.png';
                };
                $scope.isMe = function (player) {
                    return player.pname === window.gs.AM.player.pname;
                };
                $scope.getExpCountString = function () {
                    if ($scope.expansions.length === 15) {
                        return 'All Cards';
                    }
                    return $scope.expansions.length + " of 15 Goko sets";
                };
                $scope.blacklist = function (player) {
                    var blacklist = gs.get_option('automatch_blackist');
                    blacklist.push(player.pname);
                    gs.set_option('automatch_blackist', blacklist);
                };
    
                // TODO: use real data instead of this test data
                $scope.ratingSystem = 'pro';
                $scope.players.push({
                    pname: 'ADK',
                    icon: 'http://dom.retrobox.eu/avatars/5101a6c4e4b02b7235c3860f.png',
                    rating: 1024
                });
                $scope.players.push({
                    pname: 'Stef 2',
                    icon: 'http://dom.retrobox.eu/avatars/5101a6c4e4b02b7235c3860f.png',
                    rating: 1024
                });
                $scope.expansions = ["Dark Ages 1", "Seaside 1", "Alchemy", "Guilds",
                    "Intrigue 2", "Prosperity 1", "Base", "Intrigue 1", "Intrigue 2",
                    "Dark Ages 3", "Hinterlands 1", "Seaside 2", "Cornucopia",
                    "Prosperity 2", "Hinterlands 2"];
                //$scope.expansions = ["Base", "Dark Ages 1", "Seaside 1", "Alchemy",
                //    "Hinterlands 2"];
            });

        viewport.append([
            '<div id="offerPop" title="Automatch Found"',
            '    ng-app="offerApp" ng-controller="offerController">',
            '  <table>',
            '    <tbody>',
            '      <tr ng-repeat="player in players">',
            '        <td>',
            '          <img width=38 src="{{player.icon}}">',
            '        </td>',
            '        <td>',
            '          {{player.pname}}',
            '        </td>',
            '        <td style="font-size:medium">',
            '          [<img style="vertical-align:bottom" height=20 ',
            '              src="{{getRatingIcon(ratingSystem)}}">{{player.rating}}]',
            '        </td>',
            '        <td>',
            '          <input type="button" value="Blacklist" ',
            '            ng-hide="isMe(player)" ng-click="blacklist(player)"/>',
            '        </td>',
            '      </tr>',
            '      <tr>',
            '        <td colspan=4>',
            '          {{getExpCountString()}}: ',
            '          <img style="vertical-align:bottom; margin-left:5px;" ',
            '            ng-repeat="expansion in expansions | expansion" height=20',
            '             src="{{getExpansionIcon(expansion)}}">',
            '        </td>',
            '      </tr>',
            '      <tr>',
            '        <td colspan=4 align="right">',
            '          <input type="button" id="offeracc" value=" Accept " />',
            '          <input type="button" id="offerdec" value=" Decline" />',
            '        </td>',
            '      <tr>',
            '    </tbody>',
            '  </table>',
            '  ',
            '  </div>',
            '</div>'
        ].join('\n'));

        angular.bootstrap(window.document);

        $('#offerPop').dialog({
            modal: false,
            width: 500,
            draggable: true,
            resizeable: false,
            autoOpen: false
        });

        $('#offeracc').click(function (evt) {
            gs.AM.state.offer.accepted = true;

            // Disable UI while waiting for server response.
            $('#offeracc').prop('disabled', true);
            $('#offerrej').prop('disabled', true);
            $('#offerwaitinfo').text('Accepted. Waiting for confirmation.');

            // Notify server
            gs.AM.acceptOffer(function () {
                $('#offerwaitinfo').text('Accepted offer. Waiting for opp(s).');
                $('#offeracc').prop('disabled', true);
                $('#offerrej').prop('disabled', false);
            });
        });

        $('#offerdec').click(function (evt) {
            gs.AM.showOfferPop(false);

            if (gs.AM.state.offer.accepted !== null && gs.AM.state.offer.accepted) {
                gs.AM.unacceptOffer();
            } else {
                gs.AM.declineOffer();
            }
        });
    };

    // Update and show/hide the dialog
    gs.AM.showOfferPop = function (visible) {
        if (typeof visible === "undefined") {
            visible = true;
        }

        if (gs.AM.state.offer !== null) {
            // List players
            $('#plist').empty();
            gs.AM.state.offer.seeks.filter(function (s) {
                return s.player.pname !== gs.AM.state.offer.hostname;
            }).map(function (s) {
                // TODO: use casual rating if it's a casual game
                var p = s.player.pname
                        + ' [Pro Rating: ' + s.player.rating.goko_pro_rating + ']';
                $('#plist').append('<li>' + p + '</li>');
            });

            // List or count card sets
            var host = gs.AM.state.offer.seeks.map(function (seek) {
                return seek.player;
            }).filter(function (player) {
                return player.pname === gs.AM.state.offer.hostname;
            })[0];
            var hostsets = host.sets_owned;

            switch (hostsets.length) {
            case 15:
                $('#offersets').text('All Cards');
                break;
            case 1:
                $('#offersets').text('Base Only');
                break;
            case 2:
            case 3:
                $('#offersets').text(hostsets.join(', '));
                break;
            default:
                $('#offersets').text(hostsets.length + ' sets');
            }

            $('#offerrating').text(gs.AM.state.offer.rating_system);

            $('#offerhost').text(gs.AM.state.offer.hostname
                        + ' [Pro Rating: ' + host.rating.goko_pro_rating + ']');

            $('#offerroom').text(gs.AM.state.offer.roomname);
            $('#offerwaitinfo').text('If you accept, Automatch will take you '
                    + 'and your opponent(s) to ' + gs.AM.state.offer.roomname
                    + ' and create a new game there.');
            $('#offeracc').prop('disabled', false);
            $('#offerrej').prop('disabled', false);
        }
        $('#offerPop').dialog(visible ? 'open' : 'close');
    };
}());
