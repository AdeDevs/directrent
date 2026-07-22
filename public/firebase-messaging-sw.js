importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyD9KnNb_J0-lmQ6aZLBwmj82jKfB-W8LlU",
  authDomain: "maindirectrent.firebaseapp.com",
  projectId: "maindirectrent",
  storageBucket: "maindirectrent.firebasestorage.app",
  messagingSenderId: "526214594338",
  appId: "1:526214594338:web:799c4c2ed332c33aceef7b"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  // Firebase automatically shows a notification if payload.notification is present.
  // We only need to manually show one if it's a data-only message and we want to display it.
  if (!payload.notification && payload.data && payload.data.title) {
    const notificationTitle = payload.data.title || 'New Notification';
    const notificationOptions = {
      body: payload.data.body,
      icon: '/vite.svg',
      data: payload.data,
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
  }
});
