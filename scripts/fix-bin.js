#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create the corrected bin file
const binContent = `#!/usr/bin/env node

/**
 * The Architech CLI - Revolutionary AI-Powered Application Generator
 * 
 * Entry point for the CLI tool that transforms weeks of development work
 * into minutes through intelligent project generation and automation.
 */

// Import the main CLI from the compiled source
import "../index.js";
`;

const binPath = path.join(__dirname, '..', 'dist', 'bin', 'architech.js');
fs.writeFileSync(binPath, binContent);
console.log('✅ Fixed bin file');
