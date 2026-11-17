const { getDefaultConfig } = require('expo/metro-config');
const fs = require('fs');

const config = getDefaultConfig(__dirname);

// Filter out non-existent watchFolders (prevents Metro ENOENT crash when root node_modules does not exist)
config.watchFolders = config.watchFolders.filter((folder) => fs.existsSync(folder));

module.exports = config;
