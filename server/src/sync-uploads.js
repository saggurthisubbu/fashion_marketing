import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sDir = path.join(__dirname, '../uploads');
const cDir = path.join(__dirname, '../../client/public/uploads');

if (!fs.existsSync(sDir)) fs.mkdirSync(sDir, { recursive: true });
if (!fs.existsSync(cDir)) fs.mkdirSync(cDir, { recursive: true });

const sFiles = fs.readdirSync(sDir);
const cFiles = fs.readdirSync(cDir);

let copiedToC = 0;
for (const f of sFiles) {
  const sPath = path.join(sDir, f);
  const cPath = path.join(cDir, f);
  if (fs.statSync(sPath).isFile() && !fs.existsSync(cPath)) {
    fs.copyFileSync(sPath, cPath);
    copiedToC++;
  }
}

let copiedToS = 0;
for (const f of cFiles) {
  const sPath = path.join(sDir, f);
  const cPath = path.join(cDir, f);
  if (fs.statSync(cPath).isFile() && !fs.existsSync(sPath)) {
    fs.copyFileSync(cPath, sPath);
    copiedToS++;
  }
}

console.log(`Copied ${copiedToC} files to client/public/uploads`);
console.log(`Copied ${copiedToS} files to server/uploads`);
console.log('Total files in server/uploads:', fs.readdirSync(sDir).length);
console.log('Total files in client/public/uploads:', fs.readdirSync(cDir).length);
