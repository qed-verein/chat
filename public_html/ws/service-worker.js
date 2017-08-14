/* global self */

// Register event listener for the 'push' event.
self.addEventListener('push', function (event) {
    // Retrieve the textual payload from event.data (a PushMessageData object).
    // Other formats are supported (ArrayBuffer, Blob, JSON), check out the documentation
    // on https://developer.mozilla.org/en-US/docs/Web/API/PushMessageData.
    var payload = event.data ? event.data.text() : 'no payload';

    // Keep the service worker alive until the notification is created.
    event.waitUntil(
            //Zeige eine Notification mit Titel 'QED-Chat'
            //
            self.registration.showNotification('QED-Chat', {
                body: payload
            })
            );
});
