import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check server/.env first, then root .env
const candidatePaths = [
  path.resolve(__dirname, '../../.env'), // if in server/src/config -> server/.env
  path.resolve(__dirname, '../../../.env'), // if in server/src/config -> root .env
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'server/.env')
];

for (const envPath of candidatePaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}
