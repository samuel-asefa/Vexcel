// src/Firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

console.log("[Firebase.js] Script start. Attempting to initialize Firebase...");

// =================================================================================
// CRITICAL STEP: REPLACE THE VALUES BELOW WITH YOUR *ACTUAL*
// FIREBASE PROJECT CONFIGURATION VALUES.
// Find them in your Firebase Console:
// Project Settings > General > Your apps > Web app > SDK setup and configuration > Config
// =================================================================================
const firebaseConfig = {
  apiKey: "AIzaSyDziIoedENZQ2xuKl2h66nzZmjdqmQkSU8", // <--- REPLACE THIS
  authDomain: "vexcel-ad5a9.firebaseapp.com", // <--- REPLACE THIS (e.g., your-project-id.firebaseapp.com)
  projectId: "vexcel-ad5a9", // <--- REPLACE THIS
  storageBucket: "vexcel-ad5a9.firebasestorage.app", // <--- REPLACE THIS (e.g., your-project-id.appspot.com)
  messagingSenderId: "664588170188", // <--- REPLACE THIS
  appId: "1:664588170188:web:031267962d99b2015e6369" // <--- REPLACE THIS (e.g., 1:your-sender-id:web:your-app-code)
  // measurementId: "YOUR_MEASUREMENT_ID" // This is optional
};

console.log("[Firebase.js] USING firebaseConfig:", JSON.stringify(firebaseConfig, (key, value) => {
  if (key === 'apiKey') return 'REDACTED_FOR_LOG'; // Avoid logging sensitive keys directly
  return value;
}, 2));


let app;
let authInstance = null;
let dbInstance = null;

try {
  // Basic check to see if critical values still look like placeholders
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith("YOUR_") || firebaseConfig.apiKey.startsWith("AIzaSy") && firebaseConfig.apiKey.length < 20) {
    console.error("[Firebase.js] FATAL: apiKey in firebaseConfig looks like a placeholder or is incomplete!");
    throw new Error("Firebase apiKey is a placeholder or incomplete. Please replace it with your actual apiKey in Firebase.js.");
  }
  if (!firebaseConfig.projectId || firebaseConfig.projectId.startsWith("YOUR_")) {
      console.error("[Firebase.js] FATAL: projectId in firebaseConfig looks like a placeholder or is missing!");
      throw new Error("Firebase projectId is a placeholder or missing. Please replace it with your actual projectId in Firebase.js.");
  }
  if (!firebaseConfig.authDomain || firebaseConfig.authDomain.startsWith("YOUR_")) {
      console.error("[Firebase.js] FATAL: authDomain in firebaseConfig looks like a placeholder or is missing!");
      throw new Error("Firebase authDomain is a placeholder or missing. Please replace it with your actual authDomain in Firebase.js.");
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
  console.error("[Firebase.js] Ensure your `firebaseConfig` in `src/Firebase.js` is correct and that your Firebase project has Firestore and Authentication (with Google provider) enabled.");
  
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
    errorDiv.innerHTML = `<b>Firebase Initialization Failed in Firebase.js:</b> ${error.message}. <br/>Check the developer console (F12) for details and meticulously verify your <strong>firebaseConfig values in src/Firebase.js</strong>. The app will not work correctly until this is fixed.`;
    
    // Attempt to prepend to body, though React might overwrite. Console logs are key.
    if (document.body) {
        document.body.prepend(errorDiv);
    } else {
        // Fallback if body isn't ready
        window.addEventListener('DOMContentLoaded', () => {
            if(document.body) document.body.prepend(errorDiv);
        });
    }
  }
}

export const auth = authInstance;
export const db = dbInstance;