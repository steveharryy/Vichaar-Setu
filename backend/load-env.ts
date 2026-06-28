import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables manually to ensure backend/.env overrides ../.env
const rootEnvPath = path.join(__dirname, '../.env');
if (fs.existsSync(rootEnvPath)) {
  const rootEnv = config({ path: rootEnvPath }).parsed;
  if (rootEnv) Object.assign(process.env, rootEnv);
}

const localEnvPath = path.join(__dirname, '.env');
if (fs.existsSync(localEnvPath)) {
  const localEnv = config({ path: localEnvPath }).parsed;
  if (localEnv) Object.assign(process.env, localEnv);
}
