#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Required directories
const requiredDirs = [
  'assets',
  'assets/images',
];

// Required files with placeholder content
const requiredFiles = [
  {
    path: 'assets/images/icon.png',
    createCommand: 'npx expo-asset icon --input-text="C"'
  },
  {
    path: 'assets/images/adaptive-icon.png',
    createCommand: 'npx expo-asset icon --input-text="C"'
  },
  {
    path: 'assets/images/splash-icon.png',
    createCommand: 'npx expo-asset icon --input-text="C"'
  },
  {
    path: 'assets/images/favicon.png',
    createCommand: 'npx expo-asset icon --input-text="C" --width=64 --height=64'
  }
];

console.log('Checking for required assets...');

// Create required directories
requiredDirs.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(dirPath)) {
    console.log(`Creating directory: ${dir}`);
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Create required files
requiredFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file.path);
  if (!fs.existsSync(filePath)) {
    console.log(`Creating file: ${file.path}`);
    try {
      // Try to create the file using the command if provided
      if (file.createCommand) {
        const outputDir = path.dirname(filePath);
        const outputFile = path.basename(filePath);
        execSync(`${file.createCommand} --output-dir="${outputDir}" --output-file="${outputFile}"`, { stdio: 'inherit' });
      } 
      // If no command or command fails, create an empty file
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, '');
      }
    } catch (err) {
      console.error(`Error creating ${file.path}:`, err.message);
      // Create an empty file as fallback
      fs.writeFileSync(filePath, '');
    }
  }
});

console.log('Asset check completed.');

