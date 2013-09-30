/*jslint vars:true, nomen:true, forin:true, regexp:true, browser:true, devel:true */
/*globals _, $, GS, Notification */

(function () {
    "use strict";

    console.log('Loading Notifications Module');

    GS.modules.notifications = new GS.Module('Notifications');
    GS.modules.notifications.dependencies = [
        '#desktopnotificationcheckbox'
    ];
    GS.modules.notifications.load = function () {

        GS.requestNotificationPermission = function () {
            Notification.requestPermission(function (status) {
                // This allows to use Notification.permission with Chrome/Safari
                if (Notification.permission !== status) {
                    Notification.permission = status;
                    if (Notification.permission === 'denied') {
                        alert('Your browser settings block desktop '
                            + 'notifications from play.goko.com. You must '
                            + 'remove this block manually before enabling '
                            + 'Salvager desktop notifications.');
                        GS.set_option('desktop_notifications', false);
                        $('#settingsDialog').scope().$digest();
                    }
                }
            });
        };

        $('#desktopnotificationcheckbox').click(function () {
            console.log('clicked');
            if ($(this).is(':checked')) {
                GS.requestNotificationPermission();
            }
        });

        $('<div>').attr('id', 'notificationdialog')
            .append('<div>').text('Your browser is blocking Salvager from '
                                + 'desktop notifications. Unblock?')
            .append('<br>')
            .append($('<button>').attr('id', 'nonotifications')
                                 .text('No'))
            .append($('<button>').attr('id', 'yesnotifications')
                                 .text('Yes'))
            .dialog({
                modal: true,
                width: 500,
                title: 'Desktop notification blocked',
                draggable: false,
                resizeable: false,
                autoOpen: false
            });
        $('#yesnotifications').click(function () {
            GS.requestNotificationPermission();
            $('#notificationdialog').dialog('close');
        });
        $('#nonotifications').click(function () {
            GS.set_option('desktop_notifications', false);
            $('#settingsDialog').scope().$digest();
            $('#notificationdialog').dialog('close');
        });

        var n;
        GS.notifyUser = function (message, sound) {
            if (GS.get_option('audio_notifications')) {
                if (typeof sound !== 'undefined') {
                    sound.play();
                }
            }
            if (GS.get_option('desktop_notifications')) {
                GS.requestNotificationPermission();
                if (typeof Notification.permission !== 'undefined'
                        && Notification.permission === 'granted') {
                    n = new Notification(message);
                } else {
                    $('#notificationdialog').dialog('open');
                }
            }
            if (!GS.get_option('desktop_notifications')
                    && GS.get_option('popup_notifications')) {
                setTimeout(function () {
                    alert(message);
                }, 500);
            }
        };
    };
}());
