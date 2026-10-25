// Extends app.json. EXPO_BASE_URL lets the web build live under a sub-path,
// e.g. https://<user>.github.io/nibble/ → EXPO_BASE_URL=/nibble
// It's empty for local development and the Android/iOS builds.
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    baseUrl: process.env.EXPO_BASE_URL ?? '',
  },
});
