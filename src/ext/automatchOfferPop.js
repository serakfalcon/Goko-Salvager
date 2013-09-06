/*jslint browser: true, devel: true, indent: 4, maxlen: 100, es5: true, vars:true */
/*global jQuery, $, angular */

(function () {
    "use strict"; // JSList mode

    var gs = window.GokoSalvager;
    gs.AM = gs.AM || {};

    gs.AM.appendOfferPopup = function (viewport) {
        viewport.append([
            '<div id="offerPop" title="Automatch Found"',
            '    ng-app="offerApp" ng-controller=offerController">',
            '  You have been matched with',
            '  <table>',
            '    <tbody>',
            '      <tr ng-repeat="player in players">',
            '        <td>',
            '          {{player.acceptStatus}}',
            '        </td>',
            '        <td>',
            '          <img width=100 url="{{player.icon}}">',
            '        </td>',
            '        <td>',
            '          {{player.pname}}',
            '        </td>',
            '        <td>',
            '          [{{ratingsystem}}: {{player.rating}}]',
            '        </td>',
            '        <td>',
            '          <input type="button" value="Blacklist">',
            '        </td>',
            '      </tr>',
            '    </tbody>',
            '  </table>',
            //'  Expansions: ',
            '  <img ng-repeat="expansion in expansions" url="{{getExpansionIcon(expansion)}}">',
            //'  <br>',
            //'  Rating System: ',
            '  <img url="{{getRatingIcon(ratingSystem)}}"><br>',
            '  ',
            '  <input type="button" id="offeracc" value="Accept" />',
            '  <input type="button" id="offerdec" value="Decline" />',
            '</div>'
        ].join('\n'));

        // Only show info for opponents, not for self
        angular.module('notmeFilter', []).filter('notme', function () {
            return function (players, player) {
                return player;
            };
        });

        // TODO: make this non-global
        window.offerController = ["$scope", function ($scope) {
            $scope.players = [];
            $scope.ratingSystem = null;
            $scope.getRatingIcon = function (ratingSystem) {
                var base = 'http://play.goko.com/Dominion/img-meeting-room/';
                switch (ratingSystem) {
                case 'pro':
                    return base + 'MR_Pro_icon.png';
                case 'casual':
                    return base + 'MR_Casual_icon.png';
                case 'unrated':
                    return base + 'MR_nonranked_icon.png';
                }
            };
            $scope.getExpansionIcon = function (expansionName) {
                var base = 'http://gokologs.drunkensailor.org/static/img/expansion/';
                return base + 'guilds.png';
            };
        }];

        // Enable AngularJS for this popup
        angular.module('offerApp', ['notmeFilter'])
               .config(['$routeProvider', function ($routeProvider) {} ]);


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
