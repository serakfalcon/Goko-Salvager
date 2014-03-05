/*jslint browser: true, devel: true, indent: 4, maxlen: 90, es5: true, vars:true, white:true, nomen:true */
/*global $, _, WebSocket, GS */

// Create a single WebSocket connection to gokosalvager.com
//
// I plan to use this connection for all client-server communication, including:
// - automatch
// - Salvager's settings
// - challenges
// - veto mode
// - vp counter toggling
// - in-game chat (maybe)

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
                console.log('GokoSalvager server closed websocket.');
                handleDisconnect();
            };

            // Messages from server
            GS.WS.conn.onmessage = function (evt) {
                var d = JSON.parse(evt.data);
                var m = d.message;
                //console.log('Got ' + d.msgtype + ' message from ' + GS.WS.domain + ':');
                //console.log(d);

                switch (d.msgtype) {
                case 'REQUEST_CLIENT_INFO':
                    var info = {
                        username: 'TESTER',
                        gsversion: 'v2.4.3'
                    };
                    GS.WS.sendMessage('CLIENT_INFO', info);
                    break;
                case 'RESPONSE':
                    // Server response to client's request for information.
                    // Evaluate the callback the client registered, with the
                    // server's response as its argument.
                    var callback = GS.WS.callbacks[m.queryid];
                    if (typeof callback !== 'undefined') {
                        //console.log('Executing callback for msgid: ' + m.queryid);
                        if (callback !== null) {
                            callback(m);
                        }
                        delete GS.WS.callbacks[m.queryid];
                    //} else {
                    //    console.log('No callback found for msgid: ' + m.queryid);
                    }
                    break;
                default:
                    throw 'Invalid server message type: ' + d.msgtype;
                }
            };
        };

        GS.WS.isConnReady = function () {
            return typeof GS.WS.conn !== 'undefined' && GS.WS.conn.readyState === 1;
        };

        // Convenience wrapper for websocket send() method.  Globally accessible.
        GS.WS.sendMessage = function (msgtype, msg, smCallback) {
            
            var msgid, msgJSON;

            msgid = 'msg' + Date.now();
            msgJSON = JSON.stringify({
                msgtype: msgtype,
                message: msg,
                msgid: msgid
            });

            if (typeof smCallback !== 'undefined' && smCallback !== null) {
                GS.WS.callbacks[msgid] = smCallback;
            }

            try {
                GS.WS.conn.send(msgJSON);
                //if (msgtype !== 'PING') {
                //    console.log('Sent ' + msgtype + ' message to Automatch server:');
                //    console.log(msgJSON);
                //}
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

        GS.WS.connectToGS();
    };
}());
