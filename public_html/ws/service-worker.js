/* global self, Promise, fetch */

var pushNotification;   //our current push-notification

// URL mit der wir uns registrieren
// returns: String
function getNotifInfoURL(notifId) {
    return "./notification/" + notifId.toString();
}

// ask server for information regarding this notification
// returns: Promise: ein NotifInfoObj für diese Id
function getNotifInfo(notifId) {
    var askObj = {
        notifid: notifId
    };

    var url = getNotifInfoURL(notifId);

    if (!url) {  //we already know, this id does not make sense
        return Promise.reject(new Error("notifId invalid"));
    }

    return fetch(url, {
        method: 'get',
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify(askObj)
    }).then(function (response) {
        if (!response.ok) {  //fetch failed (404 etc)
            throw new Error("notifInfo-URL invalid?");    //no notifInfoObject
        }
        return response.json();
    }).then(function (notifInfoObj) {
        if (!notifInfoObj || !notifInfoObj.notifid || notifInfoObj.notifid !== notifId) {    //wrong notifId
            throw new Error("notifInfoObj invalid");    //no notifInfoObject
        }
        return notifInfoObj;
    });
}

// eventually display a fitting notification
// notifInfoObj = returned by getNotifInfo
// returns: Promise<NotificationEvent
function useNotifInfo(notifInfoObj) {
    if (!notifInfoObj) { //no usable notifInfoObj
        return Promise.reject(new Error("notifInfoObj invalid")); //do nothing
    }

    var title = 'QED-Chat';
    var message = 'test text';
    var icon = '';
    var tag = 'qed-pusher';
    var options = {
        body: message,
        icon: icon,
        tag: tag
    };


    return self.registration.getNotifications({tag: tag})   //get old notifications
            .then(function (notificationList) {// Close old notification(s)
                notificationList.forEach(function (n) {
                    n.close();
                });
            })
            .catch(function (err) { //if any error occured: restore chain for useNotifInfo only
                console.log("push-event: ", err);
            })
            .then(function () {   //then: show new notification
                return self.registration.showNotification(title, options);
            });
}

// Register event listener for the 'push' event.
self.addEventListener('push', function (event) {
    // can't display notifications anyway
    if (!(self.Notification && self.Notification.permission === 'granted')) {
        return;
    }

    // the payload
    var notifObj = {
        notifId: -1
    };
    if (event.data) {
        notifObj = event.data.json();
    }

    // payload-members
    var notifId = notifObj.notifid;

    // Keep the service worker alive until the notification has been handled
    event.waitUntil(
            getNotifInfo(notifId) //fetch data from server
            .then(useNotifInfo) //then use fetched data
            .catch(function (err) { // if any uncaught error occured during getNotifInfo or useNotifInfo
                console.log("push-event: ", err);
            })
            );
});
