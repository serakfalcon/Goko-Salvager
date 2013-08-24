/*jslint browser:true, devel:true, nomen:true, forin:true, vars:true, regexp:true */
/*globals $, _, gsAlsoDo */

var x = function (gs, dc, cdbc, mroom) {
    "use strict";
    var handleChat, handleLog, announceLock, isMyT1, sendChat, getScores, formatForChat,
        deckVPValue, cardVPValue, pname, cardTypes, sum;
 
    var salvagerURL = ''; // TODO
    // TODO: UI displays VP counter if (s === true) or ((s === null) && (any(p)))
    // TODO: synchronize
    
    // TODO
    sendChat = function (message) {};
    // TODO
    getScores = function () {};
    // TODO
    formatForChat = function (scores) {};

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
            return cardTypes.filter(function (c) {
                return c.name[0] === card;
            })[0].vp;
        }
    };

    deckVPValue = function (deck) {
        return deck.map(function (card) {
            return cardVPValue(card, deck);
        }).reduce(sum);
    };

    // TODO: do with angular instead (?)
    // TODO: sort on update
    // TODO: add this to the display
    $('<div id="vpdiv"/>').css('position', 'absolute')
                          .css('padding', '2px')
                          .css('background-color', 'gray');
    $('<table id="vptable"/>').appendTo($('vpdiv'));
    for (pname in gs.vp.pnames) {
        var pindex = 0; // TODO
        var row = $('<tr/>').attr('id', pname + 'VPRow')
                            .addClass('p' + pindex);
        $('<td/>').text(pname).appendTo(row);
        $('<td/>').attr('id', pname + 'VP').appendTo(row);
        $('#vptable').append(row);
    }

    // Listen to log and chat messages
    gsAlsoDo(dc, 'onIncomingMessage', function (messageName, messageData, message) {
        if (messageName === 'addLog') {
            handleLog(messageData.text);
        } else if (messageName === 'RoomChat') {
            var speaker = mroom.playerList.findByAddress(
                messageData.playerAddress
            ).get('playerName');
            handleChat(speaker, messageData.text);
        }
    });

    isMyT1 = function (logText) {
        var m = logText.match(/(.*): turn 1/);
        return m !== null
            && m[1] === mroom.localPlayer.get('playerName')
            && !gs.vp.locked;
    };

    handleLog = function (text) {

        if (text.match(/^-+ Game Setup -+$/)) {
            // Initialize
            gs.vp.humancount = 0;
            gs.vp.pnamesVPON = [];
            gs.vp.pnames = [];
            gs.vp.vpon = false;
            gs.vp.lock = false;

            // Handle table name #vpon/#vpoff commands
            var tableName = JSON.parse(dc.table.get('settings')).name;
            if (tableName.match(/#vpon/i)) {
                gs.vp.vpon = true;
                gs.vp.lock = true;
                announceLock(true);
            } else if (tableName.match(/#vpoff/i)) {
                gs.vp.vpon = false;
                gs.vp.lock = true;
                announceLock(true);
            }

        } else if (text.match(/(.*) - starting cards/)) {
            // Collect the player names
            if (!text.match(/(Bottington.*| Bot|Bot [VI]+) - starting cards/)) {
                gs.vp.humanCount += 1;
            }

        } else if (isMyT1(text) && !gs.vp.locked) {
            if (gs.getOption('vp_request')) {
                sendChat('#vpon');
            }

        } else if (text.match(/: turn 5/)) {
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
        if (text.match(/#vpon/i)) {

            if (gs.vp.locked) {
                // Do nothing if already locked
                sendChat('Sorry, my VP counter is locked.');

            } else if (gs.vp.pnamesVPON.indexOf(speaker) === -1) {
                // Lock ON if all human players have requested #vpon
                gs.vp.pnamesVPON.push(speaker);
                gs.vp.vpon = true;
                if (gs.vp.pnamesVPON.length === gs.vp.humanCount) {
                    gs.vp.locked = true;
                    announceLock(false);
                }

            } else if (gs.getOption('vp_disallow')) {
                // Automatically refuse if using vp_disallow option
                sendChat('#vpoff');

            } else {
                // Otherwise enable
                gs.vp.vpon = true;
                // If it's my own #vpon chat, explain it
                if (speaker === mroom.localPlayer.get('playerName')) {
                    sendChat('I would like to use a VP Counter (' + salvagerURL + '). '
                           + 'Say "#vpoff" before turn 5 to disallow it or '
                           + '"#vp?" any time to see the score in chat.');
                }
            }
         
        } else if (text.match(/#vpoff/i)) {
            gs.vp.vpon = false;
            gs.vp.lock = true;
            sendChat('My VP counter is now disabled.');

        } else if (text.match(/#vp?/i)) {
            if (gs.vp.vpon) {
                sendChat(formatForChat(getScores()));
            } else {
                sendChat('Sorry, my VP counter is disabled.');
            }
        }
    };

    announceLock = function (includeURL) {
        var msg = 'My VP counter is now ' + (gs.vp.vpon ? 'on' : 'disabled') + ' and locked.';
        if (includeURL) { msg += ' See ' + salvagerURL; }
        sendChat(msg);
    };
};
