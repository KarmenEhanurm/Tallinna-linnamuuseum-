import { FirebaseOptions, initializeApp } from 'firebase/app';
import Constants from 'expo-constants';
//import Config from 'react-native-config';

// Configuration values are taken from the root .env file
export const firebaseConfig: FirebaseOptions = {
    apiKey: Constants.expoConfig?.extra?.firebase.apiKey,
    authDomain: Constants.expoConfig?.extra?.firebase.authDomain,
    projectId: Constants.expoConfig?.extra?.firebase.projectId,
    storageBucket: Constants.expoConfig?.extra?.firebase.storageBucket,
    messagingSenderId: Constants.expoConfig?.extra?.firebase.messagingSenderId,
    appId: Constants.expoConfig?.extra?.firebase.appId,
    measurementId: Constants.expoConfig?.extra?.firebase.measurementId
};

export const app = initializeApp(firebaseConfig);