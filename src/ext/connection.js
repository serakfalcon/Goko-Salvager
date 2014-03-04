/*jslint browser: true, devel: true, indent: 4, maxlen: 90, es5: true, vars:true, white:true, nomen:true */
/*global $, _, WebSocket, GS */

// Create a single WebSocket connection to gokosalvager.com
//
// Use this connection for all client-server communication, including:
// - automatch
// - Salvager's settings
// - challenges
// - veto mode
// - vp counter toggling
// - in-game chat <?>

(function () {
    "use strict";

    var mod = GS.modules.wsConnection = new GS.Module('WS Connection');
    mod.dependencies = ['GS'];
    mod.load = function () {
        var startPingLoop, handleDisconnect, updateWSIcon, confirmReceipt;

        console.log('Loading WS Connection module');

        // Connection variables
        GS.WS = {};
        GS.WS.domain = 'andrewiannaccone.com';
        GS.WS.port = 8889;
        GS.WS.url = "wss://" + GS.WS.domain + ":" + GS.WS.port + "/gs/wsConn";
        GS.WS.maxFails = 5;
        GS.WS.failCount = 0;
        GS.WS.lastPingTime = new Date();
        GS.WS.callbacks = {};

        // Attempt to connect to the GokoSalvager server
        GS.WS.connectToGS = function () {
            GS.debug('Creating WebSocket connection to ' + GS.WS.domain);
            GS.WS.conn = new WebSocket(GS.WS.url);

            GS.WS.conn.onopen = function () {
                console.log('Connected to ' + GS.WS.domain);
                GS.WS.FailCount = 0;
                updateWSIcon();
                startPingLoop();
            };

            GS.WS.conn.onclose = function () {
                console.log('Automatch server closed websocket.');
                handleDisconnect();
            };

            // Messages from server
            GS.WS.conn.onmessage = function (evt) {
                var msg = JSON.parse(evt.data);
                GS.debug('Got ' + msg.msgtype + ' message from '
                         + GS.WS.domain + ':');
                GS.debug(msg.message);

                switch (msg.msgtype) {
                case 'REQUEST_CLIENT_INFO':
                    var info = {
                        username: 'TESTER',
                        gsversion: 'v2.4.3'
                    };
                    GS.WS.sendMessage('CLIENT_INFO', info, function () {
                        console.log('Received receipt confirmation');
                    });

                    break;
                case 'CONFIRM_RECEIPT':
                    confirmReceipt(msg);
                    break;
                case 'CLIENTLIST':
                    console.log(msg);
                    break;
                default:
                    throw 'Received unknown message type: ' + msg.msgtype +
                          ' from ' + GS.WS.domain;
                }
            };
        };

        // Convenience wrapper for websocket send() method.  Globally accessible.
        GS.WS.sendMessage = function (msgtype, msg, smCallback) {
            var msgid, msgObj, msgStr;

            msgid = 'msg' + Date.now();
            msgObj = {msgtype: msgtype,
                      message: msg,
                      msgid: msgid};
            msgStr = JSON.stringify(msgObj);

            GS.WS.callbacks[msgid] = smCallback;
            GS.WS.conn.send(msgStr);

            try {
                GS.debug('Sent ' + msgtype + ' message to Automatch server:');
                GS.debug(msgObj);
            } catch (e) {
                console.log(e);
            }
        };

        startPingLoop = function () {

            // ping server every 25 sec. Timeout if no responses for 180s.
            GS.WS.lastpingTime = new Date();

            GS.WS.pingLoop = setInterval(function () {
                GS.debug('Running ping loop');
                if (new Date() - GS.WS.lastpingTime > 180000) {
                    GS.debug('Connection to ' + GS.WS.domain + ' timed out.');
                    clearInterval(GS.WS.pingLoop);
                    try {
                        GS.WS.conn.close();
                    } catch (e) {
                        console.log(e);
                    }
                } else {
                    GS.debug('Sending ping');
                    GS.WS.sendMessage('PING', {});
                }
            }, 25000);
        };

        updateWSIcon = function () {
            // TODO: inform the user that he's connected to the GokoSalvager server
            console.log('TODO: Update icon for status: ' + GS.WS.conn.readyState);
        };

        handleDisconnect = function () {
            // Update state
            GS.state = {seek: null, offer: null, game: null};
            GS.WS.FailCount += 1;

            GS.debug('Connection to ' + GS.WS.domain + ' lost: '
                    + GS.WS.FailCount + '/' + GS.WS.MaxFails);

            // Update UI
            updateWSIcon();

            // Stop the ping cycle
            if (typeof GS.WS.pingLoop !== 'undefined') {
                clearInterval(GS.WS.pingLoop);
            }

            // Wait 5 seconds and attempt to reconnect.
            if (!GS.WS.noreconnect) {
                GS.debug('Auto-reconnect to GokoSalvager server disabled.');
            } else if (GS.WS.failCount < GS.WS.maxFails) {
                GS.debug('Max connection failures reached.');
            } else {
                setTimeout(function () {
                    GS.WS.connectToGS();
                }, 5000);
            }
        };

        // Invoke any callback that was registered when the message was sent.
        confirmReceipt = function (msg) {
            GS.debug('Receipt of message confirmed: ' + msg.msgid);
            var crCallback = GS.WS.callbacks[msg.msgid];
            if (typeof crCallback !== 'undefined' && crCallback !== null) {
                GS.debug('Invoking callback for message ' + msg.msgid);
                crCallback();
            }
            updateWSIcon();
        };
    };
}());
