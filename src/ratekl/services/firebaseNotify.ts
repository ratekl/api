import admin, { ServiceAccount } from "firebase-admin";
import { Message } from "firebase-admin/lib/messaging/messaging-api";

const serviceAccount = JSON.parse(process.env.FIREBASE_ACCOUNT_IOS ?? '');
const serviceAccountAndroid = JSON.parse(process.env.FIREBASE_ACCOUNT_ANDROID ?? '');
console.log(serviceAccount);
const adminIos = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount)
}, 'adminIos');

const adminAndroid = admin.initializeApp({
  credential: admin.credential.cert(serviceAccountAndroid as ServiceAccount)
}, 'adminAndroid');

export const sendPushNotification = async (message: Message, type: 'ios' | 'android') => {
  const admin = type === 'ios' ? adminIos : adminAndroid;

  try {
     await admin.messaging().send(message);
  } catch (e) {
    console.log('error sending push notification', e.message);
  }
};