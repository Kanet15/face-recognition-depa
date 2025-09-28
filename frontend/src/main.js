import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import router from "/router";
import { initializeApp } from "firebase/app";
import { getFirestore , collection, getDocs, addDoc, updateDoc, deleteDoc, doc  } from "firebase/firestore";
import { getDatabase } from 'firebase/database';
// Import the FontAwesome core
import { library } from '@fortawesome/fontawesome-svg-core';

// Import specific icons
import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';

// Import the FontAwesome component
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

// Add icons to the library
library.add(faBars, faTimes, faSun, faMoon);

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_API_AUTH_DOMAIN,
  databaseURL:import.meta.env.VITE_API_DATABASE_URL,
  projectId: import.meta.env.VITE_API_PROJECT_ID,
  storageBucket: import.meta.env.VITE_API_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_API_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_API_APP_ID,
  measurementId: import.meta.env.VITE_API_MEASUREMENT_ID,
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);

// Initialize Firestore
const firestore = getFirestore(firebaseApp);

//Initialize Realtime Database
const realtime=getDatabase(firebaseApp );
// Create Vue app instance
const app = createApp(App);

// Register the FontAwesome component globally
app.component('font-awesome-icon', FontAwesomeIcon);

app.use(router);

app.mount("#app");

export { firestore,realtime,collection, getDocs, addDoc, updateDoc, deleteDoc, doc };