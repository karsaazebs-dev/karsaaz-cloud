/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const fs = require("fs");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

// Avoid watching the drive root directory directly, which contains the entire filesystem.
const isDriveRoot = /^[a-zA-Z]:\\?$/.test(workspaceRoot);

const watchFolders = [projectRoot];
const nodeModulesPaths = [path.resolve(projectRoot, "node_modules")];

// Map @karsaaz/cloud-api dynamically depending on where it exists.
let cloudApiDir = path.resolve(workspaceRoot, "packages/cloud-api");
if (!fs.existsSync(cloudApiDir)) {
  cloudApiDir = path.resolve(projectRoot, "node_modules/@karsaaz/cloud-api/cloud-api");
  if (!fs.existsSync(cloudApiDir)) {
    cloudApiDir = path.resolve(projectRoot, "node_modules/@karsaaz/cloud-api");
  }
}

if (fs.existsSync(cloudApiDir)) {
  watchFolders.push(cloudApiDir);
}

if (!isDriveRoot) {
  watchFolders.push(workspaceRoot);
  nodeModulesPaths.push(path.resolve(workspaceRoot, "node_modules"));
}

config.watchFolders = watchFolders;
config.resolver.nodeModulesPaths = nodeModulesPaths;
config.resolver.extraNodeModules = {
  "@karsaaz/cloud-api": cloudApiDir,
};

module.exports = config;
