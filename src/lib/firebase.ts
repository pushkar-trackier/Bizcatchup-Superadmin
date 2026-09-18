import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

/**
 * Firebase web config for the "biz-scan" project. This is the same config
 * already shipped publicly inside the Flutter app
 * (biz-scan-flutter/bizcatchup_flutter/lib/firebase_options.dart) — Firebase
 * web API keys identify the project, they are not secrets; access control is
 * enforced by Firebase Auth + the scanner backend's admin email-domain check,
 * not by keeping this key hidden.
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
