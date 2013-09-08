/*jslint browser:true, devel:true, nomen:true, forin:true, vars:true, regexp:true, white:true */
/*globals $, _, angular */

var loadVPCounterModule = function (gs, dc, cdbc, mroom) {
    "use strict";

    // Namespace for VP Counter
    gs.vp = {};
    gs.vp.pnames = [];

    // TODO: put somewhere more sensible
    gs.salvagerURL = 'github.com/aiannacc/Goko-Salvager';

    var tablename, handleChat, handleLog, announceLock, isMyT2, sendChat, getScore,
        formatForChat, deckVPValue, cardVPValue, cardTypes, sum, createVPCounter,
        vpToggle;
 
    // Fix Goko's incorrct VP value for Farmland, Tunnel, and Dame Josephine
    ['Dame Josephine', 'Farmland', 'Tunnel'].map(function (cardname) {
        cdbc.filter(function (card) {
            return card.name[0] === cardname;
        })[0].vp = 2;
    });

    getScore = function (pname) {
        var deck = gs.cardCounts[pname];
        if (typeof deck === 'undefined') { return 0; }
        return _.keys(deck).map(function (card) {
            return cardVPValue(card, deck) * deck[card];
        }).reduce(sum) + gs.vptokens[pname];
    };

    formatForChat = function () {
        return _.keys(gs.cardCounts).map(function (pname) {
            return pname + ': ' + getScore(pname);
        }).join(', ');
    };

    cardTypes = {};
    cdbc.map(function (card) {
        cardTypes[card.name[0]] = card.type;
    });

    sum = function (a, b) { return a + b; };
    cardVPValue = function (card, cardCounts) {
        var c, d = cardCounts;
        switch (card) {
        case 'Dame Josephine':
            return 2; // Not in CardBuilder (Goko bug)
        case 'Duke':
            return d.Duchy || 0;
        case 'Fairgrounds':
            return 2 * Math.floor(_.size(d) / 5);
        case 'Feodum':
            return Math.floor((d.Silver || 0) / 3);
        case 'Gardens':
            return Math.floor(_.values(d).reduce(sum) / 10);
        case 'Silk Road':
            var vpCardCount = 0;
            for (c in d) {
                if (cardTypes[c].match(/victory/)) {
                    vpCardCount += d[c];
                }
            }
            return Math.floor(vpCardCount / 4);
        case 'Vineyard':
            var actionCardCount = 0;
            for (c in d) {
                if (cardTypes[c].match(/action/)) {
                    actionCardCount += d[c];
                }
            }
            return Math.floor(actionCardCount / 3);
        default:
            // Get VP from Goko's CardBuilder data.
            return cdbc.filter(function (c) {
                return c.name[0] === card;
            })[0].vp;
        }
    };

    window.vpController = function ($scope) {
        // Sync scope to underlying model of players and their VPs
        var sync = function () {
            var i = 0;
            if (gs.vp.vpon) {
                $scope.players = gs.vp.pnames.map(function (pname) {
                    i += 1;
                    return {
                        pname: pname,
                        pclass: 'p' + i,
                        vps: getScore(pname)
                    };
                });
            } else {
                $scope.players = [];
            }
        };
        sync();

        // Update when:
        // - VP counter toggled
        // - players added
        // - decks changed
        // - VP tokens gained
        var state = function () {
            return [gs.vp.vpon, gs.vp.pnames, gs.cardCounts, gs.vptokens];
        };
        $scope.$watch(state, sync, true);
    };

    angular.bootstrap($('#vptable'));

    // Listen to log and chat messages
    gs.alsoDo(dc, 'onIncomingMessage', null, function (messageName, messageData, message) {
        // TODO: cache this somewhere more sensible
        gs.clientConnection = gs.clientConnection || this.clientConnection;

        // TODO: figure out which messages actually contain the table name,
        //       rather than just being overcautious like this
        var tsettings = this.table.get("settings");
        if (typeof tsettings !== 'undefined' && tsettings !== null && tsettings !== '') {
            var tname = JSON.parse(tsettings).name;
            tablename = tname || tablename;
        }

        if (messageName === 'addLog') {
            if (messageData.hasOwnProperty('text')) {
                handleLog(messageData.text);
            }
        } else if (messageName === 'RoomChat') {
            var speaker = mroom.playerList.findByAddress(
                messageData.playerAddress
            ).get('playerName');
            handleChat(speaker, messageData.text);
        }
        
        // Tell AngularJS that the vptable's model may have changed
        $('#vptable').scope().$digest();
    });

    isMyT2 = function (logText) {
        var m = logText.match(/^-+ (.*): turn 2 -+$/);
        return (m !== null) && (m[1] === mroom.localPlayer.get('playerName'));
    };

    // Try to enable/disable, lock, and explain the VP counter
    vpToggle = function (vpon, lock, announce, lockReason) {

        if (!gs.vp.lock && gs.humanCount > 1) {
            // Respect lock setting in multiplayer games
            sendChat('Sorry, my VP counter is already locked to '
                    + gs.vp.vpon ? 'ON' : 'OFF');
            sendChat('It was locked because ' + lockReason);

        } else if (gs.vp.humanCount === 1) {
            // Never lock or announce in bot/adventure games
            gs.vp.vpon = vpon;

        } else {
            // Multiplayer game; counter not already locked
            gs.vp.vpon = vpon;
            gs.vp.lock = lock;

            if (lock) {
                sendChat('My VP counter is now ' + (vpon ? 'ON' : 'OFF')
                       + ' and locked because ' + lockReason);
            } else if (vpon && announce && !gs.vp.announced) {
                // Explain and request the VP counter
                sendChat('I would like to use a VP Counter (' + gs.salvagerURL + '). '
                       + 'Say "#vpon" to allow it, "#vpoff" to disallow it, or '
                       + '"#vp?" any time to see the score in chat.');
                sendChat('#vpon');
            }
        }
    };

    handleLog = function (text) {

        // TODO: handle this on gatway connect instead?
        if (text.match(/^-+ Game Setup -+$/)) {

            // Initialize
            gs.vp = {
                pnames: [],
                pnamesVPON: [],
                vpon: false,
                lock: false,
                announced: false,
                guest: mroom.localPlayer.get('playerName')
                                        .match(/^guest/i) !== null
            };

            // Collect player info
            mroom.playerList.models.map(function (player) {
                gs.vp.pnames.push(player.get('playerName'));
                gs.vp.multiplayer = gs.vp.multiplayer || !player.get('isBot');
            });

            // Always enable VP counter in bot/adventure games
            if (!gs.vp.multiplayer) {
                vpToggle(true, false, false);
            }

            // Default #vpon option applies immediately and silently, but
            // does not lock and is not allowed for guests.
            if (gs.get_option('vp_request') && !gs.vp.guest) { 
                vpToggle(true, false, false);
            }

            // #vpon/#vpoff in table name applies and locks immediately.
            if (typeof tablename !== 'undefined') {
                if (tablename.match(/#vpon/i)) {
                    vpToggle(true, true, true);
                } else if (tablename.match(/#vpoff/i)) {
                    vpToggle(false, true, true);
                }
            }

        
        } else if (isMyT2(text) && gs.vp.vpon &&  && !gs.vp.announced && gs.vp.multiplayer) {
            sendChat('#vpon');

        } else if (text.match(/^-+ (.*): turn 5 -+$/) && gs.vp.humanCount > 1) {
            // Lock counter on the first player's T5
            gs.vp.vpon = gs.vp.vpon || false;
            if (!gs.vp.lock && gs.vp.announced) {
                announceLock(false);
            }
            gs.vp.lock = true;
        }
    };

    handleChat = function (speaker, text) {
        console.log('Chat from ' + speaker + ': ' + text);
        if (text.match(/^#vpon$/i)) {

            if (gs.vp.lock && gs.vp.humanCount > 1) {
                // Do nothing if already locked
                if (!gs.vp.vpon) {
                    sendChat('Sorry, my VP counter is already locked to OFF.');
                }

            } else if (gs.get_option('vp_disallow')
                    && gs.vp.hasOwnProperty('humanCount')
                    && gs.vp.humanCount > 1) {
                // Automatically refuse if using vp_disallow option
                sendChat('#vpoff');

            } else {
                // Otherwise enable without locking
                gs.vp.vpon = true;

                // If it's my own #vpon chat, explain it
                if (speaker === mroom.localPlayer.get('playerName')
                        && gs.vp.humanCount > 1) {
                    sendChat('I would like to use a VP Counter (' + gs.salvagerURL + '). '
                           + 'Say "#vpoff" before turn 5 to disallow it or '
                           + '"#vp?" any time to see the score in chat.');
                    gs.vp.announced = true;
                }

                // Lock ON if all human players have requested #vpon
                if (gs.vp.pnamesVPON.indexOf(speaker) === -1) {
                    gs.vp.pnamesVPON.push(speaker);
                    gs.vp.vpon = true;
                    if (gs.vp.pnamesVPON.length === gs.vp.humanCount) {
                        gs.vp.lock = true;
                        announceLock(false);
                    }
                }
            }

        } else if (text.match(/^#vpoff$/i)) {
            if (gs.vp.lock && gs.vp.humanCount > 1) {
                // Do nothing if already locked
                if (!gs.vp.vpoff) {
                    sendChat('Sorry, my VP counter is already locked to ON.');
                }
            } else {
                gs.vp.vpon = false;
                if (gs.vp.humanCount > 1) {
                    gs.vp.lock = true;
                    announceLock(false);
                }
            }

        } else if (text.match(/^#vp\?$/i)) {
            if (gs.vp.vpon) {
                sendChat(formatForChat());
            } else {
                sendChat('Sorry, my VP counter is off.');
            }
        }
    };

    announceLock = function (includeURL) {
        var msg = 'My VP counter is now ' + (gs.vp.vpon ? 'on' : 'disabled') + ' and locked.';
        if (includeURL) { msg += ' See ' + gs.salvagerURL; }
        sendChat(msg);
    };

    sendChat = function (message) {
        gs.clientConnection.send('sendChat', {text: message});
    };
};

window.GokoSalvager.depWait(
    ['GokoSalvager', 'DominionClient', 'FS.Dominion.CardBuilder.Data.cards', 'mtgRoom'],
    100, loadVPCounterModule, this, 'VP Counter Module'
);
