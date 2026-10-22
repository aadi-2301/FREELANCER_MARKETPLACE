import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { initSchema, queryRun, queryGet, queryExec } from './db.js';
import { computeEntryHash } from '../middleware/auditLogger.js';

export const seedDatabase = async () => {
  console.log('[*] Initializing Database Schema...');
  await initSchema();

  // Check if users already seeded
  const userCount = await queryGet('SELECT COUNT(*) as count FROM users');
  if (userCount.count > 0) {
    console.log('[!] Database already contains data. Skipping re-seed.');
    return;
  }

  console.log('[*] Seeding Cyber-Resilient Marketplace Data...');

  const salt = await bcrypt.genSalt(10);
  const hashAdmin = await bcrypt.hash('Admin@123456', salt);
  const hashSarah = await bcrypt.hash('Freelancer@123', salt);
  const hashVikram = await bcrypt.hash('Freelancer@123', salt);
  const hashAlex = await bcrypt.hash('Client@12345', salt);
  const hashPriya = await bcrypt.hash('Auditor@123', salt);

  // 1. Seed Users
  await queryRun(`
    INSERT INTO users (username, email, password_hash, role, full_name, avatar, bio, skills, rating, reviews_count, wallet_balance, mfa_enabled, mfa_secret)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    'admin_security',
    'soc.admin@tcet.ac.in',
    hashAdmin,
    'admin',
    'TCET SOC Security Administrator',
    'https://api.dicebear.com/7.x/bottts/svg?seed=admin_security',
    'Chief Security Officer & SOC Overseer for FreelanceShield Marketplace.',
    JSON.stringify(['SIEM', 'Threat Hunting', 'Incident Response', 'OWASP']),
    5.0, 12, 10000.00, 1, '123456'
  ]);

  await queryRun(`
    INSERT INTO users (username, email, password_hash, role, full_name, avatar, bio, skills, rating, reviews_count, wallet_balance, mfa_enabled, mfa_secret)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    'sarah_pentest',
    'sarah.hacker@freelance.io',
    hashSarah,
    'freelancer',
    'Sarah Chen (OSCP, CEH)',
    'https://api.dicebear.com/7.x/bottts/svg?seed=sarah_pentest',
    'Red Team specialist with 6+ years auditing fintech web apps, APIs, and microservices.',
    JSON.stringify(['Web Pentesting', 'Burp Suite', 'API Security', 'Threat Modeling']),
    4.9, 48, 2850.00, 0, null
  ]);

  await queryRun(`
    INSERT INTO users (username, email, password_hash, role, full_name, avatar, bio, skills, rating, reviews_count, wallet_balance, mfa_enabled, mfa_secret)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    'vikram_dev',
    'vikram.dev@freelance.io',
    hashVikram,
    'freelancer',
    'Vikram Sharma',
    'https://api.dicebear.com/7.x/bottts/svg?seed=vikram_dev',
    'Senior Full-Stack Engineer specializing in Zero-Trust architectures and React/Node security.',
    JSON.stringify(['React', 'Node.js', 'PostgreSQL', 'Secure Coding', 'Docker']),
    4.8, 32, 1920.00, 0, null
  ]);

  await queryRun(`
    INSERT INTO users (username, email, password_hash, role, full_name, avatar, bio, skills, rating, reviews_count, wallet_balance, mfa_enabled, mfa_secret)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    'alex_client',
    'alex.buyer@company.com',
    hashAlex,
    'client',
    'Alex Rivera (Fintech Founder)',
    'https://api.dicebear.com/7.x/bottts/svg?seed=alex_client',
    'Building modern decentralized banking applications. Passionate about ironclad application security.',
    JSON.stringify(['Product Management', 'Fintech', 'Compliance']),
    5.0, 8, 3500.00, 0, null
  ]);

  await queryRun(`
    INSERT INTO users (username, email, password_hash, role, full_name, avatar, bio, skills, rating, reviews_count, wallet_balance, mfa_enabled, mfa_secret)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    'priya_auditor',
    'priya.audit@cert.org',
    hashPriya,
    'auditor',
    'Priya Nair (Lead IS Auditor)',
    'https://api.dicebear.com/7.x/bottts/svg?seed=priya_auditor',
    'Accredited ISO 27001 Lead Auditor verifying smart contracts and SOC compliance.',
    JSON.stringify(['SOC 2', 'ISO 27001', 'Smart Contract Auditing']),
    5.0, 19, 5000.00, 1, '123456'
  ]);

  // 2. Seed Gigs
  const sarahUser = await queryGet("SELECT id FROM users WHERE username = 'sarah_pentest'");
  const vikramUser = await queryGet("SELECT id FROM users WHERE username = 'vikram_dev'");

  await queryRun(`
    INSERT INTO gigs (
      freelancer_id, title, slug, category, description, cover_image,
      tier_basic_title, tier_basic_price, tier_basic_days, tier_basic_features,
      tier_standard_title, tier_standard_price, tier_standard_days, tier_standard_features,
      tier_premium_title, tier_premium_price, tier_premium_days, tier_premium_features,
      security_rating, is_verified
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    sarahUser.id,
    'Comprehensive Web App Penetration Testing & OWASP Top 10 Audit',
    'web-app-pentest-owasp-top-10',
    'Cyber Security',
    'I will execute thorough black-box and grey-box security assessments on your web application or REST API. Covers SQLi, XSS, CSRF, BOLA/IDOR, session flaws, and business logic bugs with an executive remediation report.',
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80',
    'Essential Vulnerability Scan', 250, 3,
    JSON.stringify(['Automated & Manual Scan', 'OWASP Top 10 Scope', 'PDF Summary Report']),
    'Full Scope Pentest', 450, 5,
    JSON.stringify(['Deep Business Logic Analysis', 'Exploit Proof-of-Concepts', 'Step-by-Step Fixes', '1 Re-Test']),
    'Enterprise Red Team Assessment', 850, 7,
    JSON.stringify(['Full API & Web Audit', 'Threat Model Diagram', 'Executive + Dev Reports', 'Unlimited Retests (30 days)']),
    'A+', 1
  ]);

  await queryRun(`
    INSERT INTO gigs (
      freelancer_id, title, slug, category, description, cover_image,
      tier_basic_title, tier_basic_price, tier_basic_days, tier_basic_features,
      tier_standard_title, tier_standard_price, tier_standard_days, tier_standard_features,
      tier_premium_title, tier_premium_price, tier_premium_days, tier_premium_features,
      security_rating, is_verified
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    vikramUser.id,
    'Hardened Full-Stack React & Node.js Web Application Development',
    'hardened-full-stack-react-nodejs',
    'Web Development',
    'Production-grade full stack development fortified against injection, clickjacking, and privilege escalation. Includes RBAC, JWT cookie sessions, input sanitization, and automated test coverage.',
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
    'Landing Page & Secure API', 200, 3,
    JSON.stringify(['Responsive React UI', 'Secure Express API', 'Helmet & CORS Hardening']),
    'Full Web App with RBAC', 350, 6,
    JSON.stringify(['Full Authentication System', 'Database Integration', 'Audit Logging', 'Docker Container']),
    'Turnkey SaaS Architecture', 700, 10,
    JSON.stringify(['Multi-tenant Architecture', 'Stripe/Escrow Ready', 'CI/CD Pipeline', 'Full Security Audit']),
    'A', 1
  ]);

  await queryRun(`
    INSERT INTO gigs (
      freelancer_id, title, slug, category, description, cover_image,
      tier_basic_title, tier_basic_price, tier_basic_days, tier_basic_features,
      tier_standard_title, tier_standard_price, tier_standard_days, tier_standard_features,
      tier_premium_title, tier_premium_price, tier_premium_days, tier_premium_features,
      security_rating, is_verified
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    sarahUser.id,
    'Smart Contract Security Audit & Formal Verification',
    'smart-contract-security-audit',
    'Blockchain Security',
    'Static and dynamic security analysis of EVM Solidity contracts. Detection of reentrancy, integer overflows, front-running, and unauthorized delegate calls with formal Slither/Mythril verification.',
    'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=800&q=80',
    'Standard Contract Scan', 300, 2,
    JSON.stringify(['Automated Tool Suite Run', 'Static Analysis Report', 'Gas Optimization Tips']),
    'Comprehensive Audit', 600, 4,
    JSON.stringify(['Manual Line-by-Line Review', 'Formal Verification', 'PoC Exploits', 'Fix Verification']),
    'Protocol-Level Security Audit', 1200, 7,
    JSON.stringify(['Multi-contract Ecosystem', 'Economic Exploit Modeling', 'Signed Security Certificate', 'Post-launch Support']),
    'A+', 1
  ]);

  await queryRun(`
    INSERT INTO gigs (
      freelancer_id, title, slug, category, description, cover_image,
      tier_basic_title, tier_basic_price, tier_basic_days, tier_basic_features,
      tier_standard_title, tier_standard_price, tier_standard_days, tier_standard_features,
      tier_premium_title, tier_premium_price, tier_premium_days, tier_premium_features,
      security_rating, is_verified
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    vikramUser.id,
    'Cloud Security Assessment & AWS/GCP Zero-Trust Hardening',
    'cloud-security-hardening-aws-gcp',
    'Cloud Security',
    'Benchmark your cloud infrastructure against CIS guidelines. Tighten IAM policies, configure VPC security groups, enable GuardDuty/Security Command Center, and close leaky S3/Cloud Storage buckets.',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    'Cloud Posture Assessment', 180, 2,
    JSON.stringify(['CIS Benchmark Review', 'Public Exposure Check', 'Finding Prioritization']),
    'Infrastructure Remediation', 400, 4,
    JSON.stringify(['IAM Least Privilege Overhaul', 'KMS Key Policy Hardening', 'VPC Flow Log Activation']),
    'Full Zero-Trust Architecture', 800, 8,
    JSON.stringify(['Terraform / IaC Hardening', 'Secrets Rotation Setup', 'Incident Alerting Webhooks', 'SOC Readiness']),
    'A', 1
  ]);

  // 3. Seed Orders & Escrow Vault Entries
  const alexUser = await queryGet("SELECT id FROM users WHERE username = 'alex_client'");
  const pentestGig = await queryGet("SELECT id FROM gigs WHERE slug = 'web-app-pentest-owasp-top-10'");
  const devGig = await queryGet("SELECT id FROM gigs WHERE slug = 'hardened-full-stack-react-nodejs'");

  const tx1 = crypto.createHash('sha256').update(`ORD-2026-SEC01|${alexUser.id}|${sarahUser.id}|450`).digest('hex');
  const order1 = await queryRun(`
    INSERT INTO orders (order_number, gig_id, client_id, freelancer_id, package_tier, amount, status, escrow_tx_hash, requirements)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    'ORD-2026-SEC01',
    pentestGig.id,
    alexUser.id,
    sarahUser.id,
    'standard',
    450.00,
    'in_progress',
    tx1,
    'Target domain is staging.fintechbank.local. Focus on BOLA in loan disbursement endpoints and JWT token leakage.'
  ]);

  const tx2 = crypto.createHash('sha256').update(`ORD-2026-SEC02|${alexUser.id}|${vikramUser.id}|350`).digest('hex');
  const order2 = await queryRun(`
    INSERT INTO orders (order_number, gig_id, client_id, freelancer_id, package_tier, amount, status, escrow_tx_hash, requirements)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    'ORD-2026-SEC02',
    devGig.id,
    alexUser.id,
    vikramUser.id,
    'standard',
    350.00,
    'delivered',
    tx2,
    'Build customer dashboard with role-based auth, secure file download portal, and tamper-resistant audit trail.'
  ]);

  // 4. Seed Deliverable for Order 2
  const dummyFileHash = crypto.createHash('sha256').update('SECURE_PROJECT_DELIVERABLE_SOURCE_BUNDLE_TCET_2026').digest('hex');
  await queryRun(`
    INSERT INTO deliverables (order_id, freelancer_id, filename, original_name, mime_type, size_bytes, sha256_hash, scan_status, scan_details, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    order2.lastID,
    vikramUser.id,
    'production-build-release-v1.zip',
    'dashboard-source-v1.0.zip',
    'application/zip',
    241580,
    dummyFileHash,
    'clean',
    'Zero threats detected. Magic bytes verified (PK..). SHA-256 integrity stamped.',
    'Here is the completed, security-hardened React/Node codebase with full unit tests and setup guide.'
  ]);

  // 5. Seed Messages with DLP simulation
  await queryRun(`
    INSERT INTO messages (order_id, sender_id, receiver_id, message, dlp_flagged, dlp_warning)
    VALUES (?, ?, ?, ?, 0, null)
  `, [
    order1.lastID,
    alexUser.id,
    sarahUser.id,
    'Hi Sarah, our staging environment is ready with VPN access credentials. Looking forward to the assessment.'
  ]);

  await queryRun(`
    INSERT INTO messages (order_id, sender_id, receiver_id, message, dlp_flagged, dlp_warning)
    VALUES (?, ?, ?, ?, 0, null)
  `, [
    order1.lastID,
    sarahUser.id,
    alexUser.id,
    'Acknowledged Alex! Our testing suite is configured. I will perform authenticated scans first, followed by manual logic testing.'
  ]);

  // DLP trigger demo message
  await queryRun(`
    INSERT INTO messages (order_id, sender_id, receiver_id, message, dlp_flagged, dlp_warning)
    VALUES (?, ?, ?, ?, 1, ?)
  `, [
    order1.lastID,
    alexUser.id,
    sarahUser.id,
    'Can you email me at [REDACTED BY DLP POLICY] or ping my telegram @fintechceo?',
    'Security Alert: Potential sensitive data policy violation detected (Direct Email Contact). Off-platform exchange is restricted to prevent escrow fraud.'
  ]);

  // 6. Seed Reviews
  await queryRun(`
    INSERT INTO reviews (order_id, gig_id, client_id, rating, comment)
    VALUES (?, ?, ?, 5, ?)
  `, [
    order1.lastID,
    pentestGig.id,
    alexUser.id,
    'Exceptional security reporting! Sarah discovered a critical IDOR flaw before our production release that saved us thousands in potential losses.'
  ]);

  // 7. Seed Tamper-Evident Chained Audit Logs
  const genesisHash = '0000000000000000000000000000000000000000000000000000000000000000';
  const initialLogs = [
    {
      type: 'SYSTEM_BOOT',
      severity: 'INFO',
      user_id: 1,
      ip: '127.0.0.1',
      details: 'FreelanceShield Security Core initialized with SHA-256 Tamper-Proof Chaining.'
    },
    {
      type: 'USER_REGISTERED',
      severity: 'INFO',
      user_id: 2,
      ip: '192.168.1.105',
      details: 'Registered user: sarah_pentest [Role: freelancer, Verified: Yes]'
    },
    {
      type: 'ESCROW_FUNDS_LOCKED',
      severity: 'INFO',
      user_id: 4,
      ip: '192.168.1.120',
      details: 'Escrow vault locked $450.00 for Order #ORD-2026-SEC01. Smart state: PENDING_COMPLETION'
    },
    {
      type: 'BOLA_IDOR_ATTEMPT_BLOCKED',
      severity: 'HIGH',
      user_id: null,
      ip: '203.0.113.45',
      details: 'Unauthorized probe on /api/orders/ORD-2026-SEC01 blocked by fine-grained ownership matrix.'
    },
    {
      type: 'DLP_POLICY_VIOLATION',
      severity: 'WARN',
      user_id: 4,
      ip: '192.168.1.120',
      details: 'DLP Filter triggered in Order #ORD-2026-SEC01: Off-platform contact redaction applied.'
    },
    {
      type: 'FILE_DELIVERABLE_UPLOADED',
      severity: 'INFO',
      user_id: 3,
      ip: '192.168.1.114',
      details: `Deliverable 'dashboard-source-v1.0.zip' inspected. Magic bytes verified. Hash: ${dummyFileHash.substring(0, 16)}...`
    }
  ];

  let prevHash = genesisHash;
  for (const log of initialLogs) {
    const timestamp = new Date(Date.now() - Math.floor(Math.random() * 3600000)).toISOString();
    const currHash = computeEntryHash(
      prevHash,
      timestamp,
      log.type,
      log.severity,
      log.user_id,
      log.ip,
      log.details
    );

    await queryRun(`
      INSERT INTO audit_logs (timestamp, event_type, severity, user_id, ip_address, user_agent, details, previous_hash, current_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [timestamp, log.type, log.severity, log.user_id, log.ip, 'TCET-Seed-Agent/1.0', log.details, prevHash, currHash]);

    prevHash = currHash;
  }

  console.log('[+] Seed data populated successfully with verified cryptographic chain!');
};

// Execute if run directly
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
