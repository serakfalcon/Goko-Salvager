/*jslint browser:true, devel:true, nomen:true, forin:true, vars:true, regexp:true, white:true */
/*globals $, _, angular, GS, FS, DominionClient, mtgRoom */

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

    GS.modules.vpcounterui = new GS.Module('VP Counter');
    GS.modules.vpcounterui.dependencies = ['$', '#sidebar', 'angular'];

    GS.modules.vptoggle = new GS.Module('VP Toggle');
    GS.modules.vptoggle.dependencies = ['DominionClient', 'mtgRoom'];

    GS.modules.vpcalculator = new GS.Module('VP Calculator');
    GS.modules.vpcalculator.dependencies = ['FS.Dominion.CardBuilder.Data.cards'];

    GS.modules.vpcounterui.load = function () {
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
        window.vpController = function ($scope) {
            $scope.vp = GS.vp;
            $scope.playerList = _.values(GS.vp.players);
            $scope.debug = GS.debugMode;
            $scope.$watch(function () {
                return GS.vp.players;
            }, function () {
                $scope.playerList = _.values(GS.vp.players);
            }, true);
        };
        angular.bootstrap($('#vptable'));

        // Update each player's VP total and tell angular to redraw
        GS.vp.updateTable = function () {
            _.values(GS.vp.players).map(function (p) {
                p.vps = GS.vp.getVPTotal(p.pname);
            });
            $('#vptable').scope().$digest();
        };
    };

    // Calculate VPs from info provided by decktracker.js
    GS.modules.vpcalculator.load = function () {

        var gokoCardData = function (englishCardName) {
            return FS.Dominion.CardBuilder.Data.cards.filter(function (c) {
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
        GS.vp.getVPTotal = function (pname) {
            var deck = GS.cardCounts[pname];
            if (typeof deck === 'undefined') { return 0; }
            return _.keys(deck).map(function (card) {
                return cardVPValue(card, deck) * deck[card];
            }).reduce(sum) + GS.vptokens[pname];
        };
    };

    GS.modules.vptoggle.load = function () {

        // Event handlers
        var onGameSetup, onRoomChat, onAddLog, onTurnStart, handleMyChat, handleOppChat,
            handleMyVPON, handleMyVPOFF, handleOppVPON, handleOppVPOFF, checkGameOver;

        // Helper functions
        var formatScores, isMultiplayer, allWantOn, allWantChange, reqcount;

        onGameSetup = function (gameData, domClient) {
            // Initialize player info
            GS.vp.players = {};
            gameData.playerInfos.map(function (pinfo) {
                GS.vp.players[pinfo.name] = {
                    pname: pinfo.name,
                    vps: null,
                    request: null,
                    wantsChange: false,
                    isBot: pinfo.hasOwnProperty('bot') && pinfo.bot,
                    pclass: 'p' + pinfo.playerIndex
                };
            });
            GS.vp.alreadyResponded = false;

            // Initialize toggle state and explain commands
            if (!isMultiplayer()) {
                // Always enabled and never locked in bot games
                GS.vp.vpon = true;
                GS.vp.locked = false;
                GS.vp.whyLocked = null;
                GS.showRoomChat('The VP Counter is ON because all the other '
                              + 'players are bots.');
                GS.showRoomChat('Say "#vphelp" for more info.');

            } else if (GS.getTableName().match(/#vpoff/i)) {
                // #vpoff in table name disables and locks
                GS.vp.vpon = false;
                GS.vp.locked = true;
                GS.vp.whyLocked = 'the table name cointained "#vpoff"';
                GS.showRoomChat('The VP Counter is OFF and LOCKED because ' + GS.vp.whyLocked);
                GS.showRoomChat('Say "#vphelp" for more info.');

            } else if (GS.getTableName().match(/#vpon/i)) {
                GS.vp.vpon = true;
                GS.vp.locked = true;
                GS.vp.whyLocked = 'the table name cointained "#vpon"';
                GS.showRoomChat('The VP Counter is ON and LOCKED because ' + GS.vp.whyLocked);
                GS.showRoomChat('Say "#vphelp" for more info.');

            } else if (GS.get_option('vp_request')) {
                GS.vp.vpon = true;
                GS.vp.locked = false;
                GS.vp.whyLocked = null;
                GS.showRoomChat('The VP Counter is ON because your "VP Counter:'
                              + 'Always Request" option is enabled.');
                GS.showRoomChat('Say "#vphelp" for more info.');

            } else if (GS.get_option('vp_refuse')) {
                GS.vp.vpon = false;
                GS.vp.locked = false;
                GS.vp.whyLocked = null;
                GS.showRoomChat('The VP Counter is OFF because your "VP Counter:'
                              + 'Always Refuse" option is enabled.');
                GS.showRoomChat('Say "#vphelp" for more info.');

            } else {
                GS.vp.vpon = false;
                GS.vp.locked = false;
                GS.vp.whyLocked = null;
                GS.showRoomChat('The VP Counter is available. Say "#vpon" to '
                              + 'enable it.');
                GS.showRoomChat('Say "#vphelp" for more info.');
            }
        };

        onAddLog = function (data) {
            if (typeof data.text === 'undefined') { return; }

            var m = data.text.match(/^-+ (.*): turn ([0-9]*)/);
            if (m === null) { return; }
            var pname = m[1];
            var turnNumber = parseInt(m[2], 10);

            // Announce VP counter at the start of our Turn 2.
            if (turnNumber === 2 && pname === GS.getMyName()
                    && isMultiplayer() && reqcount() === 0) {
                if (GS.get_option('vp_request') && !GS.vp.locked) {
                    GS.sendRoomChat('#vpon');
                } else if (GS.vp.vpon && GS.vp.locked) {
                    GS.sendRoomChat('I am using a VP counter (gokosalvager.com). '
                                  + 'Say #vp? to see the score in chat or '
                                  + '#vphelp for more info.');
                    GS.sendRoomChat('#vpon');
                }
            }

            // Lock on Turn 5
            if (turnNumber === 5) {
                GS.vp.locked = true;
                GS.vp.whyLocked = 'it is after Turn 5';
                GS.showRoomChat('The VP counter is now LOCKED. You can still '
                              + 'change it if all players agree by saying "#vpx"');
            }

            GS.vp.updateTable();
        };

        onRoomChat = function (data) {
            var speaker = mtgRoom.playerList
                                 .findByAddress(data.data.playerAddress)
                                 .get('playerName');
            if (speaker === GS.getMyName()) {
                handleMyChat(data.data.text);
            } else {
                handleOppChat(speaker, data.data.text.toLowerCase());
            }
            GS.vp.updateTable();
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
                if (GS.vp.vpon) {
                    GS.showRoomChat(formatScores());
                } else {
                    GS.showRoomChat('Cannot show scores. Your VP counter is off.');
                }
                break;
            case '#vpx':
                if (!GS.vp.locked) {
                    GS.showRoomChat('Your VP counter is not locked. Say #vpon '
                                  + 'or #vpoff instead. Say #vphelp for more info.');
                } else {
                    GS.vp.players[GS.getMyName()].wantsChange = true;
                    if (allWantChange()) {
                        GS.vp.vpon = !GS.vp.vpon;
                        _.values(GS.vp.players).map(function (p) {
                            p.wantsChange = false;
                        });
                        GS.sendRoomChat('My VP counter is now '
                                     + (GS.vp.vpon ? 'on' : 'off'));
                        GS.vp.whyLock = 'all players changed it to '
                                      + (GS.vp.vpon ? 'on' : 'off')
                                      + ' using #vpx';
                    } else {
                        GS.sendRoomChat('My VP counter is locked to '
                                     + (GS.vp.vpon ? 'on' : 'off')
                                     + ', but I\'d like to turn it '
                                     + (GS.vp.vpon ? 'off' : 'on')
                                     + '. To allow, please say "#vpx"');
                    }
                }
                break;
            case '#vphelp':
                vpinfo.map(GS.showRoomChat);
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
                if (GS.vp.vpon) {
                    GS.sendRoomChat(formatScores());
                } else {
                    GS.sendRoomChat('Cannot show scores. My VP counter is off.');
                }
                break;
            case '#vpx':
                GS.vp.players[speaker].wantsChange = true;
                if (allWantChange()) {
                    GS.vp.vpon = !GS.vp.vpon;
                    _.values(GS.vp.players).map(function (p) {
                        p.wantsChange = false;
                    });
                    GS.sendRoomChat('My VP counter is now '
                                 + (GS.vp.vpon ? 'on' : 'off'));
                }
                break;
            case '#vphelp':
                vpinfo.map(GS.sendRoomChat);
                break;
            }
        };

        handleMyVPON = function () {
            GS.vp.players[GS.getMyName()].request = true;
            if (!isMultiplayer()) {
                GS.vp.vpon = true;
            } else if (GS.vp.locked && !GS.vp.vpon) {
                GS.showRoomChat('Your VP counter is locked to OFF because '
                              + GS.vp.whyLocked + '. Say "#vpx" to'
                              + ' ask your opponent to let you change it.');
            } else if (allWantOn()) {
                GS.vp.vpon = true;
                GS.vp.locked = true;
                GS.vp.whyLocked = 'all players requested #vpon';
            } else { 
                GS.vp.vpon = true;
                // Wait for auto-responses before sending explanation
                setTimeout(function () {
                    if (reqcount() === 1) {
                        GS.sendRoomChat('I\'d like to use a VP counter '
                               + '(See gokosalvager.com). '
                               + 'You can say "#vpoff" before Turn 5 to disallow '
                               + 'it, or say "#vp?" to see the score in chat.');
                    }
                }, 2000);
            }
        };

        handleMyVPOFF = function () {
            GS.vp.players[GS.getMyName()].request = false;
            if (!isMultiplayer()) {
                GS.vp.vpon = true;
            } else if (GS.vp.locked && GS.vp.vpon) {
                GS.showRoomChat('Your VP counter is locked to ON because '
                              + GS.vp.whyLocked + '. Say "#vpx" to'
                              + ' ask your opponent to let you change it.');
            } else {
                GS.vp.vpon = false;
                GS.vp.locked = true;
                GS.vp.whyLocked = GS.getMyName() + ' said #vpoff';
            }
        };

        handleOppVPON = function (speaker) {
            GS.vp.players[speaker].request = true;
            if (GS.vp.locked && !GS.vp.vpon) {
                GS.sendRoomChat('Sorry. My VP counter is locked to OFF '
                              + 'because ' + GS.vp.whyLocked + '. ');
            } else if (GS.vp.players[GS.getMyName()].request === null
                    && !GS.vp.alreadyResponded) {
                // Only respond if we have something new to say
                if (GS.get_option('always_request') || (GS.vp.vpon && GS.vp.locked)) {
                    GS.vp.vpon = true;
                    GS.sendRoomChat('#vpon');
                    GS.vp.alreadyResponded = true;
                } else if (GS.get_option('always_refuse')) {
                    GS.sendRoomChat('#vpoff');
                    GS.vp.alreadyResponded = true;
                }
            }
        };

        handleOppVPOFF = function (speaker) {
            GS.vp.players[speaker].request = false;
            if (GS.vp.locked && GS.vp.vpon) {
                GS.sendRoomChat('Sorry. My VP counter is locked to ON '
                              + 'because ' + GS.vp.whyLocked + '. ');
            } else if (GS.vp.vpon) {
                GS.vp.vpon = false;
                GS.vp.locked = true;
                GS.vp.whyLocked = speaker + ' said #vpoff';
                GS.vp.sendRoomChat('Ok, my VP counter is off.');
            }
        };

        // Are there at least two human players?
        isMultiplayer = function () {
            return _.pluck(GS.vp.players, 'isBot').filter(function (x) {
                return !x;
            }).length > 1;
        };

        // Have all human players said "#vpon"?
        allWantOn = function () {
            return _.values(GS.vp.players).every(function (p) {
                return p.isBot || (p.request === true);
            });
        };

        // Have all human players said "#vpx"?
        allWantChange = function () {
            return _.values(GS.vp.players).every(function (p) {
                return p.isBot || (p.wantsChange === true);
            });
        };

        // How many players have said either "#vpon" or "#vpoff"?
        reqcount = function () {
            return _.values(GS.vp.players).map(function (p) {
                return (p.request !== null) ? 1 : 0;
            }).reduce(sum);
        };

        // Format scores for display in chat
        formatScores = function () {
            return _.values(GS.vp.players).map(function (p) {
                return p.pname + ': ' + p.vps;
            }).join('\n');
        };

        // Listen to VP toggle events in room chat and when the game starts
        mtgRoom.conn.bind('roomChat', onRoomChat);
        mtgRoom.conn.bind('gameServerHello', function (msg) {
            GS.getGameClient().bind('incomingMessage:gameSetup', onGameSetup);
            GS.getGameClient().bind('incomingMessage:addLog', onAddLog);
            GS.getGameClient().bind('incomingMessage', checkGameOver);
        });

        // Stop listening at the end of the game
        checkGameOver = function (msg) {
            if (msg !== 'gameOver') { return; }
            GS.getGameClient().unbind('incomingMessage:gameSetup', onGameSetup);
            GS.getGameClient().unbind('incomingMessage:addLog', onAddLog);
            GS.getGameClient().unbind('incomingMessage', checkGameOver);
            GS.players = {};
            $('#vptable').scope().$digest();

            // Also clean up goko's leftovers
            GS.getGameClient().unbindAll('incomingMessage');
        };
    };

    // Initialize
    GS.vp = {
        players: {},
        vpon: false,
        locked: false
    };
}());
