import "dotenv/config";

export default {
  expo: {
    name: "AAS",
    slug: "AAS",
    owner: "aas_mobile",
    version: "1.0.3",
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
      package: "com.aas_mobile.AAS",
    },
    web: {
      favicon: "./assets/adaptive-icon.png",
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
