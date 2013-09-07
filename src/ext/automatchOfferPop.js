/*jslint browser: true, devel: true, indent: 4, maxlen: 100, es5: true, vars:true, nomen:true */
/*global jQuery, $, _, angular */

(function () {
    "use strict"; // JSList mode

    var gs = window.GokoSalvager;
    gs.AM = gs.AM || {};

    gs.AM.appendOfferPopup = function () {

        // Note: This would be a lot easier to read if it were formatted as HTML.
        //       Unfortunately, I can't find a way to import HTML that works in
        //       Chrome, Firefox, and Safari extensions and that Mozilla doesn't
        //       complain about for security reasons.
        $('#viewport')
            .append($('<div>').attr('id', 'offerPop')
                              .attr('title', 'Match Found')
                              .attr('ng-app', '')
                              .attr('ng-controller', 'offerController')
                .append($('<table>')
                    .append($('<tbody>')
                        .append($('<tr>').attr('ng-repeat', 'player in players')
                            .append($('<td>').append($('<img>')
                                             .attr('width', 38)
                                             .attr('src', '{{player.icon}}')))
                            .append($('<td>')
                                .append($('<span>').attr('ng-model', 'player.pname')))
                            .append($('<td>')
                                .append($('<span>').text('['))
                                .append($('<img>').attr('src', '{{rsys.icon}}'))
                                .append($('<span>').text('{{player.rating[rsys.name]}}'))
                                .append($('<span>').text(']')))
                            .append($('<td>')
                                .append($('<button>').text('Blacklist')
                                                     .attr('ng-hide', 'isMe(player)')
                                                     .attr('ng-click', 'blacklist(player)'))))))
                .append($('<div>')
                    .append($('<span>').attr('ng-model', 'expCountString')))
                .append($('<div>')
                    .append($('<button>').text('Accept')
                                         .attr('ng-click', 'accept'))
                    // TODO: add optional decline reason
                    .append($('<button>').text('Decline')
                                         .attr('ng-click', 'decline'))));

        // Enable AngularJS for this popup
        //angular.module('offerApp', [])
        //    .controller('offerController', ['$scope', function ($scope) {
        window.offerController = function ($scope) {
            //$scope.players = [{
            //  pname: 'Whoever',
            //  rating: {
            //    pro: 0,
            //    casual: 0,
            //    unrated: 0
            //  }
            //}];
            //$scope.rsys = {
            //    name: 'pro',
            //    icon: 'wherever.png'
            //};
            //$scope.expCountString = '10 of 15 Goko Sets';
            
            // TODO: Use $watch on AM.state.offer
            
            var rsysBase = 'http://play.goko.com/Dominion/img-meeting-room/';
            $scope.icons = {
                pro: rsysBase + 'MR_Pro_icon.png',
                casual: rsysBase + 'MR_Casual_icon.png',
                unrated: rsysBase + 'MR_nonranked_icon.png',
            };

            //$scope.setExpansions = function (expansionNames) {
            //    $scope.expansions = [];
            //    var base = 'http://gokologs.drunkensailor.org/static/img/expansions/';
            //    var expNames = expansionNames.map(function (en) {
            //        return en.replace(/(\s|\d)/g, '').toLowerCase();
            //    }).sort().map(function (en) {
            //        var icon = base + name + '.png';
            //        $scope.expansions.push({
            //            icon: icon,
            //            count: 2
            //        });
            //    });
            //};

            $scope.isMe = function (player) {
                return player.pname === window.GokoSalvager.AM.player.pname;
            };

            //$scope.getExpCountString = function () {
            //    switch ($scope.expansions.length) {
            //    case 1:
            //        return 'Base Only';
            //    case 15:
            //        return 'All Cards';
            //    default:
            //        return $scope.expansions.length + " of 15 Goko sets";
            //    }
            //};

            $scope.blacklist = function (player) {
                var blacklist = gs.get_option('automatch_blackist');
                blacklist.push(player.pname);
                gs.set_option('automatch_blackist', blacklist);
                // TODO: decline dialog
            };
        };
                       
        // Invoke the angularjs compiler manually b/c the DomLoaded event that
        // normally triggers it happened long ago.
        angular.bootstrap($('#offerPop'));

        // Show expansions once each and in order of publication
        //var orderedExpansions = ['base', 'intrigue', 'seaside', 'alchemy',
        //    'prosperity', 'cornucopia', 'hinterlands', 'darkages', 'guilds'];
        //angular.module('offerApp.filters', [])
        //    .filter('expansion', function () {
        //        return function (arr, expression, comparator) {
        //            var exps = arr.map(function (expname) {
        //                return expname.replace(/(\s|\d)/g, '').toLowerCase();
        //            });
        //            return orderedExpansions.filter(function (expName) {
        //                return exps.indexOf(expName) !== -1;
        //            });
        //        };
        //    });

        $('#offerPop').dialog({
            modal: false,
            width: 500,
            draggable: true,
            resizeable: true,
            autoOpen: false
        });

        // TODO: Move into Controller
        $('#offeracc').click(function (evt) {
            gs.AM.state.offer.accepted = true;

            // TODO: Implement with directives in view
            $('#offeracc').prop('disabled', true);
            $('#offerrej').prop('disabled', true);

            // TODO: Implement in view
            $('#offerwaitinfo').text('Accepted. Waiting for confirmation.');

            // Notify server
            gs.AM.acceptOffer(function () {
                $('#offerwaitinfo').text('Accepted offer. Waiting for opp(s).');

                // TODO: Implement with directives in view
                $('#offeracc').prop('disabled', true);
                $('#offerrej').prop('disabled', false);
            });
        });

        // TODO: Move into Controller
        $('#offerdec').click(function (evt) {
            // TODO: Implement in view
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

        //if (gs.AM.state.offer !== null) {
        //    // List players
        //    $('#plist').empty();
        //    gs.AM.state.offer.seeks.filter(function (s) {
        //        return s.player.pname !== gs.AM.state.offer.hostname;
        //    }).map(function (s) {
        //        // TODO: use casual rating if it's a casual game
        //        var p = s.player.pname
        //                + ' [Pro Rating: ' + s.player.rating.goko_pro_rating + ']';
        //        $('#plist').append('<li>' + p + '</li>');
        //    });

        //    // List or count card sets
        //    var host = gs.AM.state.offer.seeks.map(function (seek) {
        //        return seek.player;
        //    }).filter(function (player) {
        //        return player.pname === gs.AM.state.offer.hostname;
        //    })[0];
        //    var hostsets = host.sets_owned;

        //    switch (hostsets.length) {
        //    case 15:
        //        $('#offersets').text('All Cards');
        //        break;
        //    case 1:
        //        $('#offersets').text('Base Only');
        //        break;
        //    case 2:
        //    case 3:
        //        $('#offersets').text(hostsets.join(', '));
        //        break;
        //    default:
        //        $('#offersets').text(hostsets.length + ' sets');
        //    }

        //    $('#offerrating').text(gs.AM.state.offer.rating_system);

        //    $('#offerhost').text(gs.AM.state.offer.hostname
        //                + ' [Pro Rating: ' + host.rating.goko_pro_rating + ']');

        //    $('#offerroom').text(gs.AM.state.offer.roomname);
        //    $('#offerwaitinfo').text('If you accept, Automatch will take you '
        //            + 'and your opponent(s) to ' + gs.AM.state.offer.roomname
        //            + ' and create a new game there.');
        //    $('#offeracc').prop('disabled', false);
        //    $('#offerrej').prop('disabled', false);
        //}
        $('#offerPop').dialog(visible ? 'open' : 'close');
    };
}());
