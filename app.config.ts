import "dotenv/config";

export default {
  expo: {
    name: "AAS",
    slug: "AAS",
    owner: "aas_mobile",
    version: "1.0.6",
    orientation: "default",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      statusBar: {
        backgroundColor: "#ffffff",
        barStyle: "dark-content",
      },
      useNextNotificationsApi: true,
      package: "com.aas_mobile.AAS",
      googleServicesFile: "./google-services.json",
    },
    web: {
      favicon: "./assets/adaptive-icon.png",
    },

    notification: {
      icon: "./assets/notification.png",
      android: {
        googleSenderId: "399526131634",
      },
    },

    plugins: [
      "expo-asset",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#ffffff",
          image: "./assets/aas_splash_icon.png",
          imageWidth: 200,
          resizeMode: "contain",
        },
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/notification.png",
          color: "#ffffff",
        },
      ],
    ],
    extra: {
      apiBaseUrl: process.env.API_BASE_URL,
      docBaseUrl: process.env.DOC_BASE_URL,
      appEnv: process.env.APP_ENV,
      eas: {
        projectId: "38b9d62a-8670-4859-bc98-c801d5b2194a",
      },
    },
  },
};
