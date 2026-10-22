# FreelanceShield: A Zero-Trust, Cyber-Resilient Freelancer Marketplace with Smart Escrow & SOC Auditability

**Department of Computer Science & Engineering (Cyber Security)**  
**Thakur College of Engineering & Technology (TCET), Mumbai**  
*Under Autonomy - CBCGS-HME 2023 | University of Mumbai*  
**Course:** Third Year Industrial Practices (IP) Project  
**System Topic:** Freelance Marketplace (Fiverr Clone Fortified with OWASP Defenses & Escrow)

---

## 🛡️ Executive Summary & Cybersecurity Problem Statement

Modern gig-economy platforms (like Fiverr, Upwork, and Freelancer) suffer from acute cybersecurity and trust challenges:
1. **Broken Object Level Authorization (BOLA/IDOR)**: Attackers enumerate order IDs and milestone deliverables belonging to rival corporations or private clients.
2. **Trojanized & Malicious Deliverable Exploitation**: Attackers upload weaponized deliverables disguised as `.zip` or `.pdf` (polyglots, web-shells, macros) to compromise client workstations.
3. **Escrow & Payment Fraud**: Lack of transparent, tamper-evident milestone validation leads to chargeback scams and double-spending.
4. **Off-Platform Circumvention & Social Engineering**: Attackers inject phishing links, telegram handles, and credential harvesters into unmonitored chat threads.
5. **Log Tampering & Inadequate Forensics**: Conventional database logs lack non-repudiation and can be altered post-compromise.

**FreelanceShield** solves these vulnerabilities by engineering a zero-trust freelance marketplace with:
- **Object-Level RBAC Enforcement**: Strict contextual authorization matrix preventing BOLA/IDOR attacks across orders, chats, and deliverables.
- **Zero-Trust Deliverable Sandbox**: In-memory inspection pipeline enforcing MIME magic-byte verification (defeating extension spoofing), heuristic signature scanning, SHA-256 integrity stamping, and quarantine containment.
- **Cryptographic Smart Escrow Vault**: State-machine governed financial vault holding funds until client acceptance and automated sandbox verification.
- **Data Loss Prevention (DLP) Chat Shield**: Real-time regex and token analyzer redacting payment cards, credentials, and off-platform contact vectors.
- **Tamper-Evident HMAC-SHA256 Chained Audit Ledger**: Merkle-style sequential hash chaining ensuring non-repudiation and instantaneous detection of database alteration.
- **Live SOC Telemetry & Defense Testing Harness**: Interactive testing suite enabling examiners to execute live penetration tests against the running application.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+ or v20+ or v24+)
- Web Browser (Chrome, Edge, Firefox)

### 1-Click Launch (Windows)
Double-click `start.bat` in the project root, or execute:
```bash
npm start
```
The application will launch on **`http://localhost:5000`** and automatically open in your default browser.

### Development Mode (Optional)
If you wish to run backend and frontend independently:
```bash
# Terminal 1: Backend API
npm run dev:server

# Terminal 2: React Frontend with Vite HMR
npm run dev:client
```

---

## 👥 Pre-Configured Demo Personas

For rapid examiner evaluation during Viva Voce, click the **Role Switcher** in the top navigation bar to switch between personas with 1 click:

| Role | Username | Password | Purpose in Demo |
| :--- | :--- | :--- | :--- |
| **Client** | `alex_client` | `Client@12345` | Place orders, deposit funds into Escrow Vault, approve deliverables, release payouts |
| **Freelancer** | `sarah_pentest` | `Freelancer@123` | Publish cybersecurity gigs, upload signed deliverables into sandbox, receive escrow |
| **Freelancer** | `vikram_dev` | `Freelancer@123` | Senior full-stack developer with active orders and completed deliveries |
| **SOC Administrator** | `admin_security` | `Admin@123456` | Access SOC Telemetry, review SIEM logs, mediate disputes, verify cryptographic ledger |

*Demo 2FA Code (when enabled):* `123456`

---

## 🧪 Interactive Examiner Testing Harness

Navigate to the **"Examiner Live Demo"** tab in the UI to demonstrate active security mechanisms:

1. **BOLA / IDOR Defense**: Click *"Execute Unauthorized IDOR Probe"* to observe how fine-grained contextual authorization blocks access to unowned contracts (HTTP 403) and logs a high-severity alert.
2. **XSS Injection Neutralizer**: Input weaponized script tags to observe automatic entity encoding and Content-Security-Policy (CSP) headers.
3. **Malicious File Quarantine**: In the *Deliverables Sandbox*, click *"Load Spoofed Backdoor (PHP disguised as .png)"* to demonstrate how magic-byte inspection detects spoofing and diverts the file into quarantine.
4. **Brute-Force Rate Limiting**: Click *"Simulate 6 Rapid Password Attacks"* to trigger the 429 lockout window.
5. **Cryptographic Ledger Verification**: Click *"Tamper With Record"* to intentionally modify a historical database row, then click *"Verify Chain Integrity"* to watch the HMAC-SHA256 engine pinpoint the exact compromised record! Click *"Restore Original"* to heal the ledger.

---

## 📂 Architecture & Directory Structure

```text
├── client/                     # Modern React + Tailwind Frontend SPA
│   ├── src/
│   │   ├── components/         # Modular UI Components
│   │   │   ├── Navbar.jsx          # Academic Header, Role Switcher & MFA
│   │   │   ├── MarketplaceView.jsx # Service Catalog & Verified Gigs
│   │   │   ├── GigDetailModal.jsx  # Tier Pricing & Escrow Deposit
│   │   │   ├── OrdersView.jsx      # Escrow State Machine & Releases
│   │   │   ├── DeliverablesView.jsx# Zero-Trust Sandbox & SHA-256 Hashing
│   │   │   ├── ChatView.jsx        # E2EE Simulation & DLP Shield
│   │   │   ├── ExaminerDemoView.jsx# Interactive Live Penetration Harness
│   │   │   ├── SocDashboardView.jsx# Real-Time Telemetry & Audit Stream
│   │   │   └── CreateGigModal.jsx  # Freelancer Gig Publishing
│   │   ├── context/AuthContext.jsx # JWT State & Role Switcher
│   │   ├── App.jsx             # Root Routing & Layout
│   │   └── index.css           # Tailwind v4 Styles & Cyber Tokens
│   └── dist/                   # Production Static Build
│
├── server/                     # Hardened Express & SQLite Backend
│   ├── config/config.js        # Security Constants & Mime Signatures
│   ├── database/
│   │   ├── db.js               # Promisified SQLite DB Layer
│   │   ├── schema.sql          # Relational Database DDL
│   │   ├── seed.js             # Realistic Cyber Gigs & Chained Logs
│   │   └── marketplace.sqlite  # Embedded Database File
│   ├── middleware/
│   │   ├── auth.js             # JWT Verification & RBAC Guards
│   │   ├── security.js         # Helmet, CSP, Rate-Limiters & XSS
│   │   ├── auditLogger.js      # Cryptographic HMAC-SHA256 Hash Chaining
│   │   └── fileValidator.js    # Magic-Byte Sniffer & Quarantine Sandbox
│   ├── controllers/            # Business Logic & Security Handlers
│   ├── routes/                 # Express REST Endpoints
│   └── index.js                # Server Entrypoint (Serves API + Client)
│
├── uploads/                    # Physical File Storage Vaults
│   ├── deliverables/           # Clean, Sandbox-Verified Packages
│   └── quarantine/             # Isolated Malicious Deliverables
│
├── start.bat                   # 1-Click Launch Script
├── package.json                # Project Manifest & NPM Scripts
├── PROJECT_REPORT_TCET.md      # Comprehensive Academic Project Report
└── VIVA_EXAMINER_GUIDE.md      # Examiner Q&A Defense Strategy
```
