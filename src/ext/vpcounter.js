/*jslint browser:true, devel:true, nomen:true, forin:true, vars:true, regexp:true, white:true */
/*globals $, _, angular, FS */

(function () {
    "use strict";

    var vpinfo = [];
    vpinfo.push('The Goko Dominion Salvager extension includes a '
           + 'Victory Point counter (gokosalvager.com). It displays the '
           + 'current scores in chat whenever any player says "#vp?"');
    vpinfo.push('The counter may only be used if all players allow it. Say '
           + '#vpon to request it or #vpoff to disallow it. ');
    vpinfo.push('Salvager has options to send these commands automatically. '
           + 'The "Always Request" option (which is enabled by default), '
           + 'will automatically say #vpon at the start of your Turn 2.');
    vpinfo.push('The counter can be enabled or disabled any time before '
           + 'Turn 5, at which point it will become locked. Once locked, the '
           + 'counter can only be toggled if all players agree by saying '
           + '#vpx.');
    vpinfo.push('The counter will also be immediately locked if any player '
           + 'says #vpoff, or if all players have said #vpon, or if the host '
           + 'has announced it in advance by putting #vpon or #vpoff in the '
           + 'game title.');

    // Helper functions for Array.reduce()
    var sum = function (a, b) { return a + b; };
    var or = function (a, b) { return a || b; };
    var and = function (a, b) { return a && b; };

    var buildUI = function (gs) {

        // Build UI using jQuery
        $('#vptable').attr('ng-app', 'vpApp')
                     .attr('ng-controller', 'vpController')
                     .attr('id', 'vptable')
                     .addClass('vptable')
                     .attr('ng-show', 'vp.vpon')
            .append($('<tbody>')
                .append($('<tr>').attr('ng-repeat',
                                       'player in playerList | orderBy:"vps":true')
                    .addClass('{{player.pclass}}')
                    .append($('<td>').text('{{player.pname}}'))
                    .append($('<td>').attr('ng-show', 'debugMode')
                                     .text('{{player.request}}'))
                    .append($('<td>').attr('ng-show', 'debugMode')
                                     .text('{{player.wantsChange}}'))
                    .append($('<td>').text('{{player.vps}}')))
                .append($('<tr>').attr('ng-show', 'debugMode')
                    .append($('<td>').text('{{vp.locked}}'))));

        // Bind UI to model using AngularJS
        vpController = function ($scope) {
            $scope.vp = gs.vp;
            $scope.playerList = _.values(gs.vp.players);
            $scope.debug = gs.debugMode;
            $scope.$watch(function () {
                return gs.vp.players;
            }, function () {
                $scope.playerList = _.values(gs.vp.players);
            }, true);
        };
        angular.bootstrap($('#vptable'));

        // Update each player's VP total and tell angular to redraw
        gs.vp.updateTable = function () {
            _.values(gs.vp.players).map(function (p) {
                p.vps = gs.vp.getVPTotal(p.pname);
            });
            $('#vptable').scope().$digest();
        };
    };

    // Calculate VPs from info provided by decktracker.js
    var loadVPCalculator = function (gs, cdbc) {

        var gokoCardData = function (englishCardName) {
            return cdbc.filter(function (c) {
                return c.name[0] === englishCardName;
            })[0];
        };

        // A single card's VP, given the final deck
        var cardVPValue = function (card, deck) {
            var cname;
            switch (card) {
            case 'Duke':
                return deck.Duchy || 0;
            case 'Fairgrounds':
                return 2 * Math.floor(_.size(deck) / 5);
            case 'Feodum':
                return Math.floor((deck.Silver || 0) / 3);
            case 'Gardens':
                return Math.floor(_.values(deck).reduce(sum) / 10);
            case 'Silk Road':
                var vpCardCount = 0;
                for (cname in deck) {
                    if (gokoCardData(cname).type.match(/victory/)) {
                        vpCardCount += deck[cname];
                    }
                }
                return Math.floor(vpCardCount / 4);
            case 'Vineyard':
                var actionCardCount = 0;
                for (cname in deck) {
                    if (gokoCardData(cname).type.match(/(^|[^e])action/)) {
                        actionCardCount += deck[cname];
                    }
                }
                return Math.floor(actionCardCount / 3);
            case 'Farmland':
            case 'Tunnel':
            case 'Nobles':
            case 'Dame Josephine':
                return 2;
            default:
                // Use goko's data except for Farmland, Tunnel, and Dame J.,
                // which they have wrong in Dominion.CardDuilder.Data.cards
                return gokoCardData(card).vp;
            }
        };

        // Sum of card VP values and vp tokens
        gs.vp.getVPTotal = function (pname) {
            var deck = gs.cardCounts[pname];
            if (typeof deck === 'undefined') { return 0; }
            return _.keys(deck).map(function (card) {
                return cardVPValue(card, deck) * deck[card];
            }).reduce(sum) + gs.vptokens[pname];
        };
    };

    var loadVPToggle = function (gs, mr) {

        // Event handlers
        var onGameSetup, onRoomChat, onAddLog, onTurnStart, handleMyChat, handleOppChat,
            handleMyVPON, handleMyVPOFF, handleOppVPON, handleOppVPOFF, checkGameOver;

        // Helper functions
        var formatScores, isMultiplayer, allWantOn, allWantChange, reqcount;

        onGameSetup = function (gameData, domClient) {
            // Initialize player info
            gs.vp.players = {};
            gameData.playerInfos.map(function (pinfo) {
                gs.vp.players[pinfo.name] = {
                    pname: pinfo.name,
                    vps: null,
                    request: null,
                    wantsChange: false,
                    isBot: pinfo.hasOwnProperty('bot') && pinfo.bot,
                    pclass: 'p' + pinfo.playerIndex
                };
            });
            gs.vp.alreadyResponded = false;

            // Initialize toggle state and explain commands
            if (!isMultiplayer()) {
                // Always enabled and never locked in bot games
                gs.vp.vpon = true;
                gs.vp.locked = false;
                gs.vp.whyLocked = null;
                gs.showRoomChat('The VP Counter is ON because all the other '
                              + 'players are bots.');
                gs.showRoomChat('Say "#vphelp" for more info.');

            } else if (gs.getTableName().match(/#vpoff/i)) {
                // #vpoff in table name disables and locks
                gs.vp.vpon = false;
                gs.vp.locked = true;
                gs.vp.whyLocked = 'the table name cointained "#vpoff"';
                gs.showRoomChat('The VP Counter is OFF and LOCKED because ' + gs.vp.whyLocked);
                gs.showRoomChat('Say "#vphelp" for more info.');

            } else if (gs.getTableName().match(/#vpon/i)) {
                gs.vp.vpon = true;
                gs.vp.locked = true;
                gs.vp.whyLocked = 'the table name cointained "#vpon"';
                gs.showRoomChat('The VP Counter is ON and LOCKED because ' + gs.vp.whyLocked);
                gs.showRoomChat('Say "#vphelp" for more info.');

            } else if (gs.get_option('vp_request')) {
                gs.vp.vpon = true;
                gs.vp.locked = false;
                gs.vp.whyLocked = null;
                gs.showRoomChat('The VP Counter is ON because your "VP Counter:'
                              + 'Always Request" option is enabled.');
                gs.showRoomChat('Say "#vphelp" for more info.');

            } else if (gs.get_option('vp_refuse')) {
                gs.vp.vpon = false;
                gs.vp.locked = false;
                gs.vp.whyLocked = null;
                gs.showRoomChat('The VP Counter is OFF because your "VP Counter:'
                              + 'Always Refuse" option is enabled.');
                gs.showRoomChat('Say "#vphelp" for more info.');

            } else {
                gs.vp.vpon = false;
                gs.vp.locked = false;
                gs.vp.whyLocked = null;
                gs.showRoomChat('The VP Counter is available. Say "#vpon" to '
                              + 'enable it.');
                gs.showRoomChat('Say "#vphelp" for more info.');
            }
        };

        onAddLog = function (data) {
            if (typeof data.text === 'undefined') { return; }

            var m = data.text.match(/^-+ (.*): turn ([0-9]*)/);
            if (m === null) { return; }
            var pname = m[1];
            var turnNumber = parseInt(m[2], 10);

            // Announce VP counter at the start of our Turn 2.
            if (turnNumber === 2 && pname === gs.getMyName()
                    && isMultiplayer() && reqcount() === 0) {
                if (gs.get_option('vp_request') && !gs.vp.locked) {
                    gs.sendRoomChat('#vpon');
                } else if (gs.vp.vpon && gs.vp.locked) {
                    gs.sendRoomChat('I am using a VP counter (gokosalvager.com). '
                                  + 'Say #vp? to see the score in chat or '
                                  + '#vphelp for more info.');
                    gs.sendRoomChat('#vpon');
                }
            }

            // Lock on Turn 5
            if (turnNumber === 5) {
                gs.vp.locked = true;
                gs.vp.whyLocked = 'it is after Turn 5';
                gs.showRoomChat('The VP counter is now LOCKED. You can still '
                              + 'change it if all players agree by saying "#vpx"');
            }

            gs.vp.updateTable();
        };

        onRoomChat = function (data) {
            var speaker = mr.playerList
                                 .findByAddress(data.data.playerAddress)
                                 .get('playerName');
            if (speaker === gs.getMyName()) {
                handleMyChat(data.data.text);
            } else {
                handleOppChat(speaker, data.data.text.toLowerCase());
            }
            gs.vp.updateTable();
        };

        handleMyChat = function (text) {
            switch(text) {
            case '#vpon':
                handleMyVPON();
                break;
            case '#vpoff':
                handleMyVPOFF(false);
                break;
            case '#vp?':
                if (gs.vp.vpon) {
                    gs.showRoomChat(formatScores());
                } else {
                    gs.showRoomChat('Cannot show scores. Your VP counter is off.');
                }
                break;
            case '#vpx':
                if (!gs.vp.locked) {
                    gs.showRoomChat('Your VP counter is not locked. Say #vpon '
                                  + 'or #vpoff instead. Say #vphelp for more info.');
                } else {
                    gs.vp.players[gs.getMyName()].wantsChange = true;
                    if (allWantChange()) {
                        gs.vp.vpon = !gs.vp.vpon;
                        _.values(gs.vp.players).map(function (p) {
                            p.wantsChange = false;
                        });
                        gs.sendRoomChat('My VP counter is now '
                                     + (gs.vp.vpon ? 'on' : 'off'));
                        gs.vp.whyLock = 'all players changed it to '
                                      + (gs.vp.vpon ? 'on' : 'off')
                                      + ' using #vpx';

                    } else {
                        gs.sendRoomChat('My VP counter is locked to '
                                     + (gs.vp.vpon ? 'on' : 'off')
                                     + ', but I\'d like to turn it '
                                     + (gs.vp.vpon ? 'off' : 'on')
                                     + '. To allow, please say "#vpx"');
                    }
                }
                break;
            case '#vphelp':
                vpinfo.map(gs.showRoomChat);
                break;
            }
        };

        handleOppChat = function (speaker, text) {
            switch(text) {
            case '#vpon':
                handleOppVPON(speaker);
                break;
            case '#vpoff':
                handleOppVPOFF(speaker);
                break;
            case '#vp?':
                if (gs.vp.vpon) {
                    gs.sendRoomChat(formatScores());
                } else {
                    gs.sendRoomChat('Cannot show scores. My VP counter is off.');
                }
                break;
            case '#vpx':
                gs.vp.players[speaker].wantsChange = true;
                if (allWantChange()) {
                    gs.vp.vpon = !gs.vp.vpon;
                    _.values(gs.vp.players).map(function (p) {
                        p.wantsChange = false;
                    });
                    gs.sendRoomChat('My VP counter is now '
                                 + (gs.vp.vpon ? 'on' : 'off'));
                }
                break;
            case '#vphelp':
                vpinfo.map(gs.sendRoomChat);
                break;
            }
        };

        handleMyVPON = function () {
            gs.vp.players[gs.getMyName()].request = true;
            if (!isMultiplayer()) {
                gs.vp.vpon = true;
            } else if (gs.vp.locked && !gs.vp.vpon) {
                gs.showRoomChat('Your VP counter is locked to OFF because '
                              + gs.vp.whyLocked + '. Say "#vpx" to'
                              + ' ask your opponent to let you change it.');
            } else if (allWantOn()) {
                gs.vp.vpon = true;
                gs.vp.locked = true;
                gs.vp.whyLocked = 'all players requested #vpon';
            } else { 
                gs.vp.vpon = true;
                // Wait for auto-responses before sending explanation
                setTimeout(function () {
                    if (reqcount() === 1) {
                        gs.sendRoomChat('I\'d like to use a VP counter '
                               + '(See gokosalvager.com). '
                               + 'You can say "#vpoff" before Turn 5 to disallow '
                               + 'it, or say "#vp?" to see the score in chat.');
                    }
                }, 2000);
            }
        };

        handleMyVPOFF = function () {
            gs.vp.players[gs.getMyName()].request = false;
            if (!isMultiplayer()) {
                gs.vp.vpon = true;
            } else if (gs.vp.locked && gs.vp.vpon) {
                gs.showRoomChat('Your VP counter is locked to ON because '
                              + gs.vp.whyLocked + '. Say "#vpx" to'
                              + ' ask your opponent to let you change it.');
            } else {
                gs.vp.vpon = false;
                gs.vp.locked = true;
                gs.vp.whyLocked = gs.getMyName() + ' said #vpoff';
            }
        };

        handleOppVPON = function (speaker) {
            gs.vp.players[speaker].request = true;
            if (gs.vp.locked && !gs.vp.vpon) {
                gs.sendRoomChat('Sorry. My VP counter is locked to OFF '
                              + 'because ' + gs.vp.whyLocked + '. ');
            } else if (gs.vp.players[gs.getMyName()].request === null
                    && !gs.vp.alreadyResponded) {
                // Only respond if we have something new to say
                if (gs.get_option('always_request') || (gs.vp.vpon && gs.vp.locked)) {
                    gs.vp.vpon = true;
                    gs.sendRoomChat('#vpon');
                    gs.vp.alreadyResponded = true;
                } else if (gs.get_option('always_refuse')) {
                    gs.sendRoomChat('#vpoff');
                    gs.vp.alreadyResponded = true;
                }
            }
        };

        handleOppVPOFF = function (speaker) {
            gs.vp.players[speaker].request = false;
            if (gs.vp.locked && gs.vp.vpon) {
                gs.sendRoomChat('Sorry. My VP counter is locked to ON '
                              + 'because ' + gs.vp.whyLocked + '. ');
            } else if (gs.vp.vpon) {
                gs.vp.vpon = false;
                gs.vp.locked = true;
                gs.vp.whyLocked = speaker + ' said #vpoff';
                gs.vp.sendRoomChat('Ok, my VP counter is off.');
            }
        };

        // Are there at least two human players?
        isMultiplayer = function () {
            return _.pluck(gs.vp.players, 'isBot').filter(function (x) {
                return !x;
            }).length > 1;
        };

        // Have all human players said "#vpon"?
        allWantOn = function () {
            return _.values(gs.vp.players).every(function (p) {
                return p.isBot || (p.request === true);
            });
        };

        // Have all human players said "#vpx"?
        allWantChange = function () {
            return _.values(gs.vp.players).every(function (p) {
                return p.isBot || (p.wantsChange === true);
            });
        };

        // How many players have said either "#vpon" or "#vpoff"?
        reqcount = function () {
            return _.values(gs.vp.players).map(function (p) {
                return (p.request !== null) ? 1 : 0;
            }).reduce(sum);
        };

        // Format scores for display in chat
        formatScores = function () {
            return _.values(gs.vp.players).map(function (p) {
                return p.pname + ': ' + p.vps;
            }).join('\n');
        };

        // Listen to VP toggle events in room chat and when the game starts
        mr.conn.bind('roomChat', onRoomChat);
        mr.conn.bind('gameServerHello', function (msg) {
            gs.getGameClient().bind('incomingMessage:gameSetup', onGameSetup);
            gs.getGameClient().bind('incomingMessage:addLog', onAddLog);
            gs.getGameClient().bind('incomingMessage', checkGameOver);
        });

        // Stop listening at the end of the game
        checkGameOver = function (msg) {
            if (msg !== 'gameOver') { return; }
            gs.getGameClient().unbind('incomingMessage:gameSetup', onGameSetup);
            gs.getGameClient().unbind('incomingMessage:addLog', onAddLog);
            gs.getGameClient().unbind('incomingMessage', checkGameOver);
            gs.players = {};
            $('#vptable').scope().$digest();

            // Also clean up goko's leftovers
            gs.getGameClient().unbindAll('incomingMessage');
        };
    };

    // Initialize
    GokoSalvager.vp = {
        players: {},
        vpon: false,
        locked: false
    };

    GokoSalvager.depWait(
        ['GokoSalvager', 'jQuery', '#sidebar', 'angular', 'GokoSalvager.vp'],
        100, buildUI, this, 'VP Table'
    );
    GokoSalvager.depWait(
        ['GokoSalvager', 'mtgRoom.conn'],
        ['GokoSalvager', 'Dom.LogManager', 'DominionClient',
         'FS.MeetingRoomEvents', 'mtgRoom', 'GokoSalvager.vp',
         'mtgRoom.conn'],
        100, loadVPToggle, this, 'VP Toggle'
    );
    GokoSalvager.depWait(
        ['GokoSalvager', 'FS.Dominion.CardBuilder.Data.cards', 'GokoSalvager.vp'],
        100, loadVPCalculator, this, 'VP Calculator'
    );
}());
