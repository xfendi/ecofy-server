// firebaseConfig.js
const admin = require('firebase-admin');
const serviceAccount = require('./firebasetoken.json'); // Ścieżka do klucza serwisowego Firebase

// Inicjalizacja Firebase Admin SDK z użyciem klucza serwisowego
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount), // Certyfikat autoryzacji
});

const db = admin.firestore(); // Inicjalizacja Firestore
const auth = admin.auth(); // Jeśli chcesz używać Firebase Auth w funkcjach serwera

module.exports = { db, auth }; // Eksportowanie db i auth do użycia w innych częściach aplikacji
