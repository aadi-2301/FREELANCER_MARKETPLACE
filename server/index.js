import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { CONFIG } from './config/config.js';
import { configureSecurityHeaders, corsMiddleware, apiLimiter, sanitizeInput } from './middleware/security.js';
import { seedDatabase } from './database/seed.js';

import authRoutes from './routes/authRoutes.js';
import gigRoutes from './routes/gigRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import deliverableRoutes from './routes/deliverableRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import securityRoutes from './routes/securityRoutes.js';
import socRoutes from './routes/socRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Apply Security Middlewares
configureSecurityHeaders(app);
app.use(corsMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(sanitizeInput);

// General API rate limiter
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    project: 'FreelanceShield - Cyber-Resilient Marketplace',
    institution: 'TCET CSE (Cyber Security)',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/gigs', gigRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/deliverables', deliverableRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/soc', socRoutes);

// Serve Client Static Build if available (Single-Port Production mode)
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(clientDistPath, 'index.html'));
    }
    next();
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred.' : err.message
  });
});

// Start Server & Auto-seed
const startServer = async () => {
  try {
    await seedDatabase();

    app.listen(CONFIG.PORT, () => {
      console.log('================================================================');
      console.log('  🛡️   FREELANCESHIELD: ZERO-TRUST MARKETPLACE CORE ONLINE     ');
      console.log('  🎓   TCET Department of Computer Science & Engg (Cyber Security)');
      console.log(`  🌐   Server Port: http://localhost:${CONFIG.PORT}               `);
      console.log('  🔒   OWASP Top 10 Defenses, Escrow Vault & SOC Active         ');
      console.log('================================================================');
    });
  } catch (err) {
    console.error('[-] Failed to start server:', err);
  }
};

startServer();
