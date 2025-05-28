import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

console.log("[Firebase.js] Script start. Attempting to initialize Firebase...");

// =================================================================================
// CRITICAL STEP: ENSURE THESE VALUES ARE YOUR *ACTUAL*
// FIREBASE PROJECT CONFIGURATION VALUES FROM THE FIREBASE CONSOLE.
// THEY MUST BE EXACT. CHECK EVERY CHARACTER.
// (Project Settings -> Your apps -> Web app -> SDK setup and configuration -> Config)
// =================================================================================
const firebaseConfig = {
  apiKey: "AIzaSyDziIoedENZQ2xuKl2h66nzZmjdqmQkSU8", // Replace with your actual API key
  authDomain: "vexcel-ad5a9.firebaseapp.com", // Replace with your actual authDomain
  projectId: "vexcel-ad5a9", // Replace with your actual projectId
  storageBucket: "vexcel-ad5a9.firebasestorage.app", // Replace with your actual storageBucket
  messagingSenderId: "664588170188", // Replace with your actual messagingSenderId
  appId: "1:664588170188:web:031267962d99b2015e6369" // Replace with your actual appId
  // measurementId: "YOUR_MEASUREMENT_ID" // Optional
};

console.log("[Firebase.js] USING firebaseConfig:", JSON.stringify(firebaseConfig, null, 2));

let app;
let authInstance = null;
let dbInstance = null;

try {
  if (firebaseConfig.apiKey && (firebaseConfig.apiKey.includes("YOUR_") || firebaseConfig.apiKey.includes("PASTE_") || firebaseConfig.apiKey === "AIzaSy*************************************")) {
    console.error("[Firebase.js] FATAL: apiKey in firebaseConfig looks like a placeholder or is a common example key!");
    throw new Error("Firebase apiKey is a placeholder or example. Please replace it with your actual apiKey.");
  }
  if (!firebaseConfig.projectId || firebaseConfig.projectId.includes("YOUR_") || firebaseConfig.projectId.includes("PASTE_")) {
      console.error("[Firebase.js] FATAL: projectId in firebaseConfig looks like a placeholder or is missing!");
      throw new Error("Firebase projectId is a placeholder or missing. Please replace it with your actual projectId.");
  }

  console.log("[Firebase.js] Calling initializeApp()...");
  app = initializeApp(firebaseConfig);
  console.log("[Firebase.js] initializeApp() successful.");

  console.log("[Firebase.js] Calling getAuth()...");
  authInstance = getAuth(app);
  console.log("[Firebase.js] getAuth() successful.");

  console.log("[Firebase.js] Calling getFirestore()...");
  dbInstance = getFirestore(app);
  console.log("[Firebase.js] getFirestore() successful.");

  console.log("[Firebase.js] Firebase initialization process completed successfully.");

} catch (error) {
  console.error("[Firebase.js] !!! --- CRITICAL FIREBASE INITIALIZATION ERROR --- !!!");
  console.error("[Firebase.js] Error object:", error);
  const errorDivId = 'firebase-init-error-div';
  if (!document.getElementById(errorDivId)) {
    const errorDiv = document.createElement('div');
    errorDiv.id = errorDivId;
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '0';
    errorDiv.style.left = '0';
    errorDiv.style.width = '100%';
    errorDiv.style.padding = '20px';
    errorDiv.style.backgroundColor = 'red';
    errorDiv.style.color = 'white';
    errorDiv.style.zIndex = '99999';
    errorDiv.style.fontSize = '18px';
    errorDiv.style.textAlign = 'center';
    errorDiv.innerHTML = `<b>Firebase Initialization Failed in Firebase.js:</b> ${error.message}. <br/>Check the console for details and verify your firebaseConfig. The app will not work.`;
    // Prepend to body, but React might overwrite. Console is key.
    if (document.body) {
        document.body.prepend(errorDiv);
    } else {
        // Fallback if body isn't ready, though less likely to be seen.
        window.addEventListener('DOMContentLoaded', () => {
            document.body.prepend(errorDiv);
        });
    }
  }
}

export const auth = authInstance;
export const db = dbInstance;
