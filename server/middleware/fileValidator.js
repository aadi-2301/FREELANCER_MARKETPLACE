import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { CONFIG } from '../config/config.js';
import { logSecurityEvent } from './auditLogger.js';

// Use memory storage for pre-inspection before persisting to disk
const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: CONFIG.MAX_FILE_SIZE, // 15MB limit
    files: 1
  }
});

// Known malicious YARA-like text signatures for simulation
const MALICIOUS_PATTERNS = [
  /<\?php/i,
  /<script[\s>]/i,
  /eval\s*\(/i,
  /base64_decode/i,
  /system\s*\(/i,
  /passthru\s*\(/i,
  /shell_exec\s*\(/i,
  /powershell\.exe/i,
  /cmd\.exe/i
];

/**
 * Validates magic bytes, checks for extension spoofing, computes SHA-256 hash,
 * and saves to deliverables or quarantine.
 */
export const inspectAndSaveFile = async (file, userId, req) => {
  if (!file) {
    throw new Error('No file provided.');
  }

  const originalExt = path.extname(file.originalname).toLowerCase();
  const fileBuffer = file.buffer;
  const sha256Hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

  // 1. Extension Whitelist Check
  if (!CONFIG.ALLOWED_EXTENSIONS.includes(originalExt)) {
    await logSecurityEvent({
      event_type: 'FILE_REJECTED_DISALLOWED_EXTENSION',
      severity: 'HIGH',
      user_id: userId,
      ip_address: req.ip || '127.0.0.1',
      user_agent: req.headers['user-agent'] || 'Unknown',
      details: `File upload blocked: '${file.originalname}' has disallowed extension '${originalExt}'. SHA256: ${sha256Hash}`
    });
    return {
      status: 'rejected',
      reason: `File extension '${originalExt}' is not permitted for security reasons.`
    };
  }

  // 2. Magic Bytes Inspection
  const headerHex = fileBuffer.slice(0, 4).toString('hex').toLowerCase();
  let detectedType = 'unknown';

  if (headerHex === '25504446') detectedType = 'application/pdf';
  else if (headerHex.startsWith('504b0304')) detectedType = 'application/zip';
  else if (headerHex.startsWith('89504e47')) detectedType = 'image/png';
  else if (headerHex.startsWith('ffd8ff')) detectedType = 'image/jpeg';
  else if (['.txt', '.csv', '.json', '.md'].includes(originalExt)) {
    // Check for null bytes in text files (binary disguised as text)
    const hasNullBytes = fileBuffer.includes(0x00);
    if (!hasNullBytes) detectedType = 'text/plain';
  }

  // 3. Extension Spoofing Check (e.g. executable disguised as pdf/png)
  let scanStatus = 'clean';
  let scanDetails = 'Magic bytes matched. Extension validated.';

  if (['.png', '.jpg', '.jpeg', '.pdf', '.zip'].includes(originalExt)) {
    if (detectedType === 'unknown') {
      scanStatus = 'quarantined';
      scanDetails = `Extension spoofing detected! File claimed to be ${originalExt} but magic bytes (${headerHex}) do not match signature.`;
    }
  }

  // 4. Content Signature & Malware String Scanning
  if (scanStatus === 'clean') {
    const textPreview = fileBuffer.slice(0, 4096).toString('utf8');
    for (const pattern of MALICIOUS_PATTERNS) {
      if (pattern.test(textPreview)) {
        scanStatus = 'quarantined';
        scanDetails = `Heuristic signature match: file contains potentially weaponized code sequence: ${pattern.toString()}`;
        break;
      }
    }
  }

  // Generate safe random filename to prevent Path Traversal attacks
  const safeFilename = `${crypto.randomUUID()}${originalExt}`;
  const targetDir = scanStatus === 'clean' ? CONFIG.DELIVERABLES_DIR : CONFIG.QUARANTINE_DIR;
  const filePath = path.join(targetDir, safeFilename);

  fs.writeFileSync(filePath, fileBuffer);

  // Log to cryptographic audit log
  await logSecurityEvent({
    event_type: scanStatus === 'clean' ? 'FILE_DELIVERABLE_UPLOADED' : 'MALICIOUS_FILE_QUARANTINED',
    severity: scanStatus === 'clean' ? 'INFO' : 'CRITICAL',
    user_id: userId,
    ip_address: req.ip || '127.0.0.1',
    user_agent: req.headers['user-agent'] || 'Unknown',
    details: `Deliverable '${file.originalname}' (${file.size} bytes) processed. Status: ${scanStatus}. Details: ${scanDetails}. SHA256: ${sha256Hash}`
  });

  return {
    status: scanStatus,
    filename: safeFilename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    sizeBytes: file.size,
    sha256Hash,
    scanDetails,
    filePath
  };
};
