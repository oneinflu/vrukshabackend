const admin = require('firebase-admin');
const path = require('path');

// NOTE: You must place your firebase-service-account.json in the config folder
// and set the path in your .env file as FIREBASE_SERVICE_ACCOUNT_PATH
const fs = require('fs');

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.join(__dirname, 'firebase-service-account.json');

console.log(`Attempting to initialize Firebase with service account at: ${serviceAccountPath}`);

try {
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin Initialized');
  } else {
    console.error(`Firebase Service Account file not found at: ${serviceAccountPath}`);
  }
} catch (error) {
  console.error('Firebase Admin Initialization Error:', error.message);
}

const sendNotification = async (token, title, body, data = {}) => {
  if (!token) return;

  const message = {
    notification: {
      title,
      body
    },
    data,
    token
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
    return response;
  } catch (error) {
    console.error('Error sending message:', error.message);
    // If token is invalid, we might want to remove it from the user record
    if (error.code === 'messaging/registration-token-not-registered') {
      // Handle token cleanup logic where this function is called if needed
    }
  }
};

const sendToTopic = async (topic, title, body, data = {}) => {
  const message = {
    notification: {
      title,
      body
    },
    data,
    topic
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent message to topic:', response);
    return response;
  } catch (error) {
    console.error('Error sending message to topic:', error.message);
  }
};

module.exports = { admin, sendNotification, sendToTopic };
