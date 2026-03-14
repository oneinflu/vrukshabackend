const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Firebase initialization:
// 1. First tries individual env vars (for server/deployment - recommended)
// 2. Falls back to file path for local development

try {
  let serviceAccount;

  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    // Use individual env vars (for server deployment)
    console.log('Initializing Firebase from environment variables');
    serviceAccount = {
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || '',
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID || '',
      auth_uri: process.env.FIREBASE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
      token_uri: process.env.FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL || '',
      universe_domain: 'googleapis.com'
    };
  } else {
    // Fall back to file path (for local development)
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.join(__dirname, 'firebase-service-account.json');
    console.log(`Attempting to initialize Firebase with service account at: ${serviceAccountPath}`);
    if (fs.existsSync(serviceAccountPath)) {
      serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    } else {
      console.error(`Firebase Service Account file not found at: ${serviceAccountPath}`);
    }
  }

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin Initialized');
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
