import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const CONFIG = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || 'freelanceshield-cyber-secure-jwt-secret-key-2026',
  JWT_EXPIRES_IN: '24h',
  HMAC_AUDIT_SECRET: process.env.HMAC_AUDIT_SECRET || 'crypto-audit-chain-hmac-sha256-key-tcet',
  DB_PATH: path.join(__dirname, '../database/marketplace.sqlite'),
  UPLOADS_DIR: path.join(__dirname, '../../uploads'),
  QUARANTINE_DIR: path.join(__dirname, '../../uploads/quarantine'),
  DELIVERABLES_DIR: path.join(__dirname, '../../uploads/deliverables'),
  MAX_FILE_SIZE: 15 * 1024 * 1024, // 15MB
  ALLOWED_EXTENSIONS: ['.pdf', '.zip', '.txt', '.png', '.jpg', '.jpeg', '.docx', '.json', '.csv', '.md'],
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'text/plain',
    'image/png',
    'image/jpeg',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/json',
    'text/csv',
    'text/markdown'
  ],
  MAGIC_BYTES: {
    '25504446': 'application/pdf', // %PDF
    '504b0304': 'application/zip', // PK..
    '89504e47': 'image/png',        // .PNG
    'ffd8ffe0': 'image/jpeg',       // JFIF
    'ffd8ffe1': 'image/jpeg',       // EXIF
    'ffd8ffe2': 'image/jpeg'        // Canon
  }
};
