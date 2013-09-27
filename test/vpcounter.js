var testTableName;
var shownChat;
var receivedChat;
var sentChat;
var options;

module.exports = {
    setUp: function (callback) {

        EventDispatcher = function () {};
        EventDispatcher.prototype = {
            bind: function(msg, cb, ctx, once) {
                if (this.eventCallbacks === undefined) {
                    this.eventCallbacks = {};
                }
                if (this.eventCallbacks[msg] === undefined) {
                    this.eventCallbacks[msg] = [];
                }
                
                var evtObject = {
                    callback: cb,
                    context: ctx,
                    once: once
                };
                this.eventCallbacks[msg].push(evtObject);
                this.emit('newListener', {
                    dispatcher: this, event: msg, callback: cb, context: ctx, once: once
                });
            },
            once: function(msg, cb, ctx) {
                this.bind(msg, cb, ctx, true);
            },
            unbind: function(msg, cb, ctx) {
                if( this.eventCallbacks === undefined ||
                    this.eventCallbacks[msg] === undefined ) {
                    return ;
                }

                this.eventCallbacks[msg] = this.eventCallbacks[msg].filter(function(e){
                    return (e.callback !== cb) || (e.context !== ctx);
                });
            },
            unbindAll: function(msg) {
                if( this.eventCallbacks === undefined ) {
                    return ;
                }
                delete this.eventCallbacks[msg];
            },
            listeners: function(msg) {
                if( this.eventCallbacks === undefined ) {
                    return [];
                }
                return (this.eventCallbacks[msg] || []).concat();
            },
            emit: function(msg) {
                if (this.eventCallbacks === undefined) {
                    return ;
                }

                var data =  Array.prototype.slice.call(arguments, 1);
                this.listeners(msg).forEach( function(cb) { 
                    cb.callback.apply(cb.context || this,data);
                });

                this.eventCallbacks[msg] = this.listeners(msg).filter(function(cb) {
                    return !cb.once;
                });
            }
        };

        var Model = function () {};
        Model.prototype = {
            attributes: {},
            get: function (attr) {
                return this.attributes[attr];
            },
            set: function (attr, val) {
                this.attributes[attr] = val;
            },
        };
        
        window = {};
        window.localStorage = localStorage = {};
        options = {
            vp_request: false,
            vp_refuse: false,
            debug_mode: true
        };
        localStorage.salvagerOptions = JSON.stringify(options);
            
        _ = require('../src/lib/underscore-min.js')._;
        require('../src/ext/utils.js');

        gs = GokoSalvager;
        gs.mode = 'testing';
        gs.gameClient = new EventDispatcher();
        gs.getGameClient = function () { return this.gameClient; };
        shownChat = [];
        gs.showRoomChat = function (msg) {
            console.log('Show chat: ' + msg);
            shownChat.push(msg);
        };
        sentChat = [];
        gs.sendRoomChat = function (msg) {
            console.log('Send chat: ' + msg);
            sentChat.push(msg);
        };
        mtgRoom = {};
        mtgRoom.getCurrentTable = function () {
            var out = new Model();
            out.set('settings', JSON.stringify({ name: testTableName }));
            return out;
        };
        mtgRoom.localPlayer = new Model();
        mtgRoom.localPlayer.set('playerName', 'My Name');
        mtgRoom.conn = new EventDispatcher();

        require('../src/ext/vpcounter.js');
        gs.vp.updateTable = function () { console.log('Update table called'); };
        gs.vp.loadVPToggle(gs, mtgRoom);

        gameData = {
            playerInfos: [{
                name: 'My Name',
                playerId: '12345',
                playerIndex: 0
            }, {
                name: 'player2',
                playerId: '54321',
                playerIndex: 1
            }]
        };
        testTableName = 'My Table';

        callback();
    },
    tearDown: function (callback) {
        callback();
    },
    test1: function (test) {
        options.vp_request = false;
        options.vp_refuse = false;
        localStorage.salvagerOptions = JSON.stringify(options);

        mtgRoom.conn.emit('gameServerHello');
        gs.gameClient.emit('incomingMessage:gameSetup', gameData, {});
        test.ok(shownChat.length >= 2);
        test.ok(shownChat[shownChat.length-2].match(/is available/i));
        test.ok(shownChat[shownChat.length-1].match(/#vphelp/i));
        test.done();
    },
    test2: function (test) {
        options.vp_request = true;
        options.vp_refuse = false;
        localStorage.salvagerOptions = JSON.stringify(options);

        mtgRoom.conn.emit('gameServerHello');
        gs.gameClient.emit('incomingMessage:gameSetup', gameData, {});
        test.ok(shownChat.length >= 2);
        test.ok(shownChat[shownChat.length-2].match(/is ON/i));
        test.ok(shownChat[shownChat.length-1].match(/#vphelp/i));
        test.done();
    },
    test3: function (test) {
        options.vp_request = true;
        options.vp_refuse = false;
        localStorage.salvagerOptions = JSON.stringify(options);

        mtgRoom.conn.emit('gameServerHello');
        mtgRoom.conn.emit('incomingMessage', 'gameOver');
        test.done();
    }

//        mtgRoom.conn.emit('incomingMessage:addLog', { text: '---- My Name: turn 2 ----' });
//        test.ok(shownChat[shownChat.length-1].match('#vphelp'));
//        //gs.getGameClient().bind('incomingMessage', checkGameOver);
//        //if (msg !== 'gameOver') { return; }
//
//        test.done();
//    }
};


vpToggle = {
    always_request: true,
    always_refuse: false,
    gameTitle: "AI - all cards 5000+ #vpon",
    myName: "Andrew Iannaccone",
    onGameStart: function (pnames) {},
    onChat: function (speaker, text) {},
    onTurn: function (playerName, turnNumber) {},
};
