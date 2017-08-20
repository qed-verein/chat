//benötigt um dem Server mitzuteilen, wie er uns erreichen kann,
//da wir auf Notifications warten wollen, auch ohne im Vordergrund zu sein
var endpoint;
var key;
var authSecret;

var VAPID_LUKAS = require('./vapids.json').lukas;


// URL mit der wir uns registrieren
function getRegistrationURL() {
    return "./register";
}

//registriere uns beim Server
function register() {
    // Object mit dem wir uns registrieren
    var regObj = {
        endpoint: endpoint,
        key: key,
        authSecret: authSecret
    };

    fetch(getRegistrationURL(), {
        method: 'post',
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify(regObj)
    });
}

//Registriere und starte einen Service Worker (Hintergrund-Javascript)
navigator.serviceWorker.register('service-worker.js')
        .then(function (registration) {
            // teile dem PushManager mit, dass wir Notifications empfangen wollen
            return registration.pushManager.getSubscription()
                    .then(function (subscription) {
                        // If a subscription was found, return it.
                        if (subscription) {
                            return subscription;
                        }

                        // Otherwise, subscribe the user (userVisibleOnly allows to specify that we don't plan to
                        // send notifications that don't have a visible effect for the user).
                        // also mention the VAPID we want to listen to
                        return registration.pushManager.subscribe({userVisibleOnly: true, applicationServerKey: VAPID_LUKAS});
                    });
        }).then(function (subscription) {
    //wir haben uns registriert beim pushManager

    // Retrieve the user's public key.
    var rawKey = subscription.getKey ? subscription.getKey('p256dh') : '';
    key = rawKey ?
            btoa(String.fromCharCode.apply(null, new Uint8Array(rawKey))) :
            '';
    var rawAuthSecret = subscription.getKey ? subscription.getKey('auth') : '';
    authSecret = rawAuthSecret ?
            btoa(String.fromCharCode.apply(null, new Uint8Array(rawAuthSecret))) :
            '';

    endpoint = subscription.endpoint;

    // Sende dem Server unsere Subscription-Informationen
    register();
});