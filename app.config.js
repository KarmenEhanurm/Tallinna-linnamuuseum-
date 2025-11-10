export default {
    expo: {
        extra: {
            firebase: {
                apiKey: process.env.EXPO_API_KEY,
                authDomain: process.env.EXPO_AUTH_DOMAIN,
                projectId: process.env.EXPO_PROJECT_ID,
                storageBucket: process.env.EXPO_STORAGE_BUCKET,
                messagingSenderId: process.env.EXPO_MESSAGING_SENDER_ID,
                appId: process.env.EXPO_APP_ID,
                measurementId: process.env.EXPO_MEASUREMENT_ID
            }
        }
    }
}