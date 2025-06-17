import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

console.log("[Firebase.js] Script start. Attempting to initialize Firebase...");

const firebaseConfig = {
  apiKey: "AIzaSyB8E9MdCQWiw-R8-67zc2CQRZMHa8gRLb8", 
  authDomain: "sciolytics-38022.firebaseapp.com", 
  projectId: "sciolytics-38022", 
  storageBucket: "sciolytics-38022.firebasestorage.app", 
  messagingSenderId: "1:114611845198:web:221fa7321b5d0765676b1f", 
  appId: "1:664588170188:web:031267962d99b2015e6369" 
};

console.log("[Firebase.js] USING firebaseConfig:", JSON.stringify(firebaseConfig, (key, value) => {
  if (key === 'apiKey') return 'REDACTED_FOR_LOG'; 
  return value;
}, 2));

let app;
let authInstance = null;
let dbInstance = null;

try {
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
    
    if (document.body) {
        document.body.prepend(errorDiv);
    } else {
        window.addEventListener('DOMContentLoaded', () => {
            if(document.body) document.body.prepend(errorDiv);
        });
    }
  }
}

export const auth = authInstance;
export const db = dbInstance;