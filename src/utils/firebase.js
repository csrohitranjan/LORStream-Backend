import dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import fs from 'fs';

dotenv.config();

// Firebase configuration
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Function to upload a file to Firebase Storage and return download URL
async function uploadOnFirebase(filePath, fileName) {
    try {
        // Get a reference to the Firebase Storage service
        const storage = getStorage(app);

        // Create a reference to the file
        const fileRef = ref(storage, fileName);

        // Upload file to Firebase Storage
        await uploadBytes(fileRef, fs.readFileSync(filePath));

        // Get download URL for the uploaded file
        const downloadURL = await getDownloadURL(fileRef);
        console.log("Download URL:", downloadURL);

        // Return the download URL
        return downloadURL;
    } catch (error) {
        console.error("Error uploading file:", error);
        throw error;
    } finally {
        // Delete File From Local
        fs.unlinkSync(filePath);
    }
}




export { uploadOnFirebase };