/**
 * TypeScript to JavaScript Conversion Script
 * 
 * IMPORTANT: This script has already been used to convert all files to JavaScript.
 * DO NOT run this script again as it will destructively overwrite existing JS files.
 * 
 * This script was used during the TypeScript to JavaScript conversion process
 * to automatically strip type annotations from .jsx and .js files using Babel.
 * 
 * It is kept here for documentation purposes only.
 * 
 * Original purpose: Strip TypeScript syntax from renamed .tsx -> .jsx files
 * Status: COMPLETED - All files have been converted
 * Date: November 19, 2025
 */

import { transformFileSync } from '@babel/core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

console.log('⚠️  WARNING: This script has already been used and should not be run again.');
console.log('⚠️  Running it will destructively overwrite existing JavaScript files.');
console.log('⚠️  All TypeScript to JavaScript conversion has been completed.');
process.exit(1);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

const clientSrcDir = path.resolve(__dirname, '..', 'client', 'src');
const allFiles = getAllFiles(clientSrcDir);

console.log(`Found ${allFiles.length} JavaScript files to process...`);

let processedCount = 0;
let errorCount = 0;

allFiles.forEach((filePath) => {
  try {
    const result = transformFileSync(filePath, {
      plugins: [
        ['@babel/plugin-transform-typescript', {
          isTSX: true,
          allowDeclareFields: true
        }]
      ],
      filename: filePath,
    });

    if (result && result.code) {
      fs.writeFileSync(filePath, result.code);
      processedCount++;
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    errorCount++;
  }
});

console.log(`\nProcessed ${processedCount} files successfully`);
if (errorCount > 0) {
  console.log(`Failed to process ${errorCount} files`);
}
