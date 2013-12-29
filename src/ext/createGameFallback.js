(function () {
    "use strict";
    console.log('Loading Create Game Fallback');
    GS.modules.createGameFallback = new GS.Module('Create Game Fallback');
    GS.modules.createGameFallback.dependencies = ['FS','FS.MeetingRoomSetting','mtgRoom'];
    GS.modules.createGameFallback.load = function() {
    
        GS.createMyTable = function (tableName) {
            var seatsState, tKingdom, tSettings, tOpts;
            seatsState = [1, 2, 3, 4, 5, 6].map(function (i) {
                return (i <= 2);
            });
            // Otherwise generate new ones
            var deck = new window.FS.Dominion.DeckBuilder.Model.CardDeck();
            deck = deck.doEmpty();
            deck.set({ name: 'Automatch Random deck' });
            mtgRoom.deckBuilder.persistent.getRandomDeck({
                app: mtgRoom.deckBuilder,
                deck: deck,
                useEternalGenerateMethod: true  // (Goko typo)
            }, function (d) {
                tSettings = {name: tableName,
                             seatsState: seatsState,
                             gameData: {uid: ""},
                             kingdomCards: d.get('cardNameIds'),
                             platinumColony: d.get('isColonyAndPlatinum'),
                             useShelters: d.get('useShelters'),
                             ratingType: 'pro'};
                tOpts = {settings: JSON.stringify(tSettings),
                         isLock: false,
                         isRequestJoin: false,
                         isRequestSit: false,
                         tableIndex: null};
                var zch = mtgRoom.getHelper('ZoneClassicHelper');
                zch.createTable(tOpts);
                
            });
        };
    };
     
}());
