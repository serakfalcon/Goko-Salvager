/*jslint browser: true, devel: true, indent: 4, maxlen: 90, es5: true, vars:true, white:true, nomen:true */
/*global $, _, WebSocket, Audio, FS, GS, mtgRoom */

(function () {
    "use strict";

    var mod = GS.modules.quickGame = new GS.Module('QuickGame');
    mod.dependencies = ['FS.EventDispatcher'];
    mod.load = function () {
        var loadQuickGameModule = function () {
            var initQuickGame, createQuickGameTable;
        
            // Configuration
            GS.QG = GS.QG || {};
        
            // Runs at end of script
            initQuickGame = function () {
                GS.debug('Initializing quick game button');
        
                // Replace the "Play Now" button with an Automatch button
                $('.room-section-header-buttons').append(
                    $('<button id="quickGameButton">Quick Game</button>')
                        .addClass('fs-mtrm-text-border')
                        .addClass('fs-mtrm-dominion-btn')
                        .click(GS.QG.createQuickGameTable)
                );
        
        
            };

	    GS.QG.createTable = function (tableName, seatsState, kingdomCards, platinumColony, useShelters, ratingType) {
                    var tSettings = {name: tableName,
                                 seatsState: seatsState,
                                 gameData: {uid: ""},
                                 //kingdomCards: d.get('cardNameIds'),
                                 //platinumColony: d.get('isColonyAndPlatinum'),
                                 //useShelters: d.get('useShelters'),
                                 kingdomCards: kingdomCards,
                                 platinumColony: platinumColony,
                                 useShelters: useShelters,
                                 ratingType: ratingType};
                    var tOpts = {settings: JSON.stringify(tSettings),
                             isLock: false,
                             isRequestJoin: false,
                             isRequestSit: false,
                             tableIndex: null};
		    var zch = mtgRoom.getHelper('ZoneClassicHelper');
                    zch.createTable(tOpts);
	    }
        
            GS.QG.createQuickGameTable = function () {
	        var tableName = GS.get_option('quick_game_name');
		if (!tableName) {
			tableName = 'My Table';
		}
	        var ratingType = GS.get_option('quick_game_type');
		if (ratingType != 'pro' && ratingType != 'casual' && ratingType != 'unrated' ) {
			ratingType = 'pro' ;
		}
	        var tablePlayers = GS.get_option('quick_game_players');
		if (tablePlayers < 2 || tablePlayers > 6) {
			tablePlayers = 2;
		}
                var seatsState = [1, 2, 3, 4, 5, 6].map(function (i) {
                    return (i <= tablePlayers);
                });
        
        	if (ratingType == 'pro') {
			GS.QG.createTable(
				tableName,
				seatsState, 
				['Moat','Moat','Moat','Moat','Moat','Moat','Moat','Moat','Moat', 'Moat'], // kingdom cards are in pro ignored
                                 false, // use shelters is in pro ignored
                                 false, // use platinum is in pro ignored
                                 ratingType
			);
		} else {
			var deck = new window.FS.Dominion.DeckBuilder.Model.CardDeck();
			deck = deck.doEmpty();
			deck.set({ name: 'Automatch Random deck' });
			mtgRoom.deckBuilder.persistent.getRandomDeck({
				app: mtgRoom.deckBuilder,
				deck: deck,
				useEternalGenerateMethod: true  // (Goko typo)
			}, function (d) {
				GS.QG.createTable(
					tableName,
					seatsState, 
					d.get('cardNameIds'),
					d.get('isColonyAndPlatinum'),
					d.get('useShelters'),
					ratingType
				);
                	});
		}
            };
        
        
            GS.debug('Quick game script loaded.');
            GS.debug('Initializing quick game.');
            initQuickGame();
        };
        
        // Don't loop-wait for dependencies. Listen for room join events instead.
        var alreadyLoaded = false;
        GS.alsoDo(FS.EventDispatcher, 'trigger', null, function (msg, evt) {
            if (msg === 'gatewayConnect' && !alreadyLoaded) {
                try { 
                    var mtgRoom = window.mtgRoom;
                    var conn = mtgRoom.conn;
                    var zch = mtgRoom.helpers.ZoneClassicHelper;
                    if (typeof conn !== 'undefined' && typeof zch !== 'undefined') {
                        loadQuickGameModule();
                        alreadyLoaded = true;
                    }
                } catch (e) {}
            }
        });
    };
}());
