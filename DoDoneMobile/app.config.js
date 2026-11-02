const IS_DEV = process.env.EAS_BUILD_PROFILE === "development" || process.env.EAS_BUILD_PROFILE === "preview";

module.exports = {
  ...require('./app.json'),
  expo: {
    ...require('./app.json').expo,
    name: IS_DEV ? "DoDone Dev" : "DoDone",
    ios: {
      ...require('./app.json').expo.ios,
      bundleIdentifier: IS_DEV ? "com.larisarozin.dodone.dev" : "com.larisarozin.dodone",
    },
    android: {
      ...require('./app.json').expo.android,
      package: IS_DEV ? "com.larisarozin.dodone.dev" : "com.larisarozin.dodone"
    }
  }
};
