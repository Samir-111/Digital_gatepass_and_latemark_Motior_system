/**
 * College Digital Gatepass WhatsApp Automation Engine
 * Runs locally on the gate desktop PC to monitor departures and notify parents.
 */

// 1. Initialize dotenv at the very top of the script
const path = require('path');
const fs = require('fs');

// Resolve .env path relative to this script's directory, falling back to parent if needed
const envPath = fs.existsSync(path.resolve(__dirname, '../.env'))
  ? path.resolve(__dirname, '../.env')
  : path.resolve(__dirname, '.env');

require('dotenv').config({ path: envPath });

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCodeImage = require('qrcode');

process.on('uncaughtException', (err) => {
  console.warn('[WhatsApp Daemon Warning] Uncaught Exception:', err.message || err);
});

process.on('unhandledRejection', (reason) => {
  const msg = reason?.message || String(reason || '');
  if (
    msg.includes('detached Frame') ||
    msg.includes('Execution context was destroyed') ||
    msg.includes('Target closed')
  ) {
    return; // Non-fatal Puppeteer frame lifecycle noise during WhatsApp Web DOM changes
  }
  console.warn('[WhatsApp Daemon Warning] Unhandled Rejection:', msg);
});

console.log('==================================================================');
console.log('   STARTING COLLEGE DIGITAL GATEPASS WHATSAPP AUTOMATION ENGINE   ');
console.log('==================================================================');

const http = require('http');

let db = null;
let credential = null;
let projectId = process.env.FIREBASE_PROJECT_ID || 'college-digital-gatepass';

// 1. PRIORITY 1: Check environment variable FIREBASE_SERVICE_ACCOUNT_JSON
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON && process.env.FIREBASE_SERVICE_ACCOUNT_JSON.trim()) {
  try {
    let rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON.trim();
    if ((rawJson.startsWith("'") && rawJson.endsWith("'")) || (rawJson.startsWith('"') && rawJson.endsWith('"') && !rawJson.includes('\n') && !rawJson.includes(':'))) {
      rawJson = rawJson.slice(1, -1).trim();
    }
    if (!rawJson.startsWith('{')) {
      rawJson = Buffer.from(rawJson, 'base64').toString('utf-8');
    }
    const serviceAccount = JSON.parse(rawJson);
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    credential = cert(serviceAccount);
    if (serviceAccount.project_id) projectId = serviceAccount.project_id;
    console.log('[Firebase Admin] Loaded service account credentials from FIREBASE_SERVICE_ACCOUNT_JSON environment variable');
  } catch (err) {
    console.warn('[Firebase Admin Warning] Could not parse FIREBASE_SERVICE_ACCOUNT_JSON:', err.message || err);
  }
}

// 2. PRIORITY 2: Check local service account credentials file
if (!credential) {
  let credentialsPath = path.resolve(__dirname, process.env.GOOGLE_APPLICATION_CREDENTIALS || './firebase-service-account.json');
  if (!fs.existsSync(credentialsPath)) {
    const parentCredentialsPath = path.resolve(__dirname, '..', process.env.GOOGLE_APPLICATION_CREDENTIALS || './firebase-service-account.json');
    if (fs.existsSync(parentCredentialsPath)) {
      credentialsPath = parentCredentialsPath;
    }
  }

  if (fs.existsSync(credentialsPath)) {
    try {
      const serviceAccount = require(credentialsPath);
      credential = cert(serviceAccount);
      if (serviceAccount.project_id) projectId = serviceAccount.project_id;
      console.log(`[Firebase Admin] Loaded service account credentials from file: ${credentialsPath}`);
    } catch (err) {
      console.warn('[Firebase Admin Warning] Could not load service account file:', err.message || err);
    }
  }
}

if (credential) {
  try {
    initializeApp({
      credential,
      projectId
    });
    db = getFirestore();
    console.log(`[Firebase Admin] Firestore database initialized for project: ${projectId}`);
  } catch (err) {
    console.warn('[Firebase Admin Warning] Could not initialize Firestore:', err.message);
  }
} else {
  console.log('[Firebase Admin] Running in standalone local mode (No Firebase credentials required)');
}

let clientState = {
  status: 'DISCONNECTED',
  qr: null,
  updated_at: new Date().toISOString()
};

// Detect Chrome / Edge executable path across Windows and Linux environments
const getChromeExecutablePath = () => {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/opt/google/chrome/chrome'
  ];
  for (const p of candidates) {
    if (p && fs.existsSync(p)) return p;
  }
  return undefined;
};

const chromePath = getChromeExecutablePath();

const puppeteerArgs = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-accelerated-2d-canvas',
  '--no-first-run',
  '--no-zygote',
  '--disable-gpu',
  '--disable-blink-features=AutomationControlled'
];

if (process.platform === 'linux') {
  puppeteerArgs.push('--single-process');
}

const puppeteerConfig = {
  headless: true,
  bypassCSP: true,
  args: puppeteerArgs
};

if (chromePath) {
  puppeteerConfig.executablePath = chromePath;
}

// 3. Configure the whatsapp-web.js client
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: path.resolve(__dirname, '.wwebjs_auth') // Persists WhatsApp Web sessions in local directory
  }),
  puppeteer: puppeteerConfig
});

// 4. IPC HTTP Service on port 3001
const httpServer = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  if (req.method === 'GET' && (req.url === '/api/status' || req.url === '/status')) {
    res.writeHead(200);
    return res.end(JSON.stringify(clientState));
  }

  if (req.method === 'POST' && (req.url === '/api/reset' || req.url === '/reset' || req.url === '/api/reconnect')) {
    console.log('[WhatsApp Engine] Reset request received! Re-initializing WhatsApp Web client...');
    clientState = {
      status: 'DISCONNECTED',
      qr: null,
      qr_image: null,
      updated_at: new Date().toISOString()
    };
    try {
      client.destroy().then(() => client.initialize()).catch(() => client.initialize());
    } catch (err) {
      client.initialize();
    }
    res.writeHead(200);
    return res.end(JSON.stringify({ success: true, message: 'Re-initialization triggered.' }));
  }

  if (req.method === 'POST' && (req.url === '/api/send' || req.url === '/send')) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { parentPhone, studentName, rollNo, message } = payload;

        if (clientState.status !== 'CONNECTED') {
          res.writeHead(400);
          return res.end(JSON.stringify({
            success: false,
            error: `WhatsApp client status is ${clientState.status}. Scan QR code to connect.`
          }));
        }

        let cleanedPhone = (parentPhone || '').replace(/^\+/, '').replace(/\D/g, '');
        if (cleanedPhone.length === 10) {
          cleanedPhone = '91' + cleanedPhone;
        }

        const formattedJid = `${cleanedPhone}@c.us`;
        let targetJid = formattedJid;

        try {
          const numberId = await client.getNumberId(cleanedPhone);
          if (numberId && numberId._serialized) {
            targetJid = numberId._serialized;
          }
        } catch (numErr) {
          console.warn('[WhatsApp HTTP] Could not resolve getNumberId, using formatted JID:', numErr.message);
        }

        const timeString = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        const messageBody = message || `*GATEPASS EXIT ALERT* 🚪\n\nDear Parent, your ward *${studentName}* (Roll No: ${rollNo}) has checked out and departed the college premises.\n\n_Time: ${timeString}_\n\n- S. B. Jain Institute of Technology, Management and Research`;

        await client.sendMessage(targetJid, messageBody);
        console.log(`[WhatsApp HTTP] SUCCESS: Message delivered to ${targetJid}`);

        res.writeHead(200);
        return res.end(JSON.stringify({ success: true, targetJid }));
      } catch (err) {
        console.error('[WhatsApp HTTP Error] Failed to dispatch:', err);
        res.writeHead(500);
        return res.end(JSON.stringify({ success: false, error: err.message || 'Dispatch error' }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn('[WhatsApp Engine] Port 3001 is already bound to an active WhatsApp daemon. Exiting duplicate instance gracefully.');
    process.exit(0);
  } else {
    console.error('[WhatsApp Engine HTTP Error]:', err.message);
  }
});

httpServer.listen(3001, '0.0.0.0', () => {
  console.log('[WhatsApp Engine IPC] HTTP Server listening on http://127.0.0.1:3001');
});

// QR code generated: update state & DataURL for Admin Web Dashboard
client.on('qr', async (qr) => {
  console.log('\n[WhatsApp Engine] Scan the QR code below using WhatsApp on your phone:');
  try {
    qrcode.generate(qr, { small: true });
  } catch (e) {
    // Ignore terminal qrcode render error if non-TTY
  }

  let qrDataUrl = null;
  try {
    qrDataUrl = await QRCodeImage.toDataURL(qr);
  } catch (err) {
    console.warn('[WhatsApp QR] Failed to encode DataURL:', err.message);
  }

  clientState = {
    status: 'QR_READY',
    qr,
    qr_image: qrDataUrl,
    updated_at: new Date().toISOString()
  };

  if (db) {
    db.collection('settings').doc('whatsappStatus').set({ status: 'QR_READY', updated_at: clientState.updated_at }).catch(err => console.error('[Firestore Error] Failed to update QR status:', err));
  }
});

client.on('authenticated', () => {
  console.log('\n[WhatsApp] QR Code successfully scanned! Authenticating WhatsApp session...');
});

client.on('loading_screen', (percent, message) => {
  console.log(`[WhatsApp] Loading WhatsApp Web: ${percent}% - ${message}`);
});

client.on('ready', () => {
  console.log('\n==================================================================');
  console.log('   SUCCESS: WHATSAPP BUSINESS ACCOUNT IS AUTHENTICATED & READY!   ');
  console.log('==================================================================\n');

  clientState = {
    status: 'CONNECTED',
    qr: null,
    qr_image: null,
    updated_at: new Date().toISOString()
  };

  if (db) {
    db.collection('settings').doc('whatsappStatus').set({ 
      status: 'CONNECTED', 
      qr: null, 
      qr_image: null, 
      updated_at: clientState.updated_at 
    }).catch(err => console.error('[Firestore Error] Failed to update ready status:', err));
    startFirestoreListener();
  }
});

client.on('auth_failure', (msg) => {
  console.error('[WhatsApp] Authentication failure:', msg);

  clientState = {
    status: 'DISCONNECTED',
    qr: null,
    qr_image: null,
    updated_at: new Date().toISOString()
  };

  if (db) {
    db.collection('settings').doc('whatsappStatus').set({ status: 'DISCONNECTED', updated_at: clientState.updated_at }).catch(err => console.error('[Firestore Error] Failed to update auth_failure status:', err));
  }
});

let isReinitializing = false;

client.on('disconnected', (reason) => {
  console.warn('[WhatsApp] Client was disconnected:', reason);

  clientState = {
    status: 'DISCONNECTED',
    qr: null,
    qr_image: null,
    updated_at: new Date().toISOString()
  };

  if (db) {
    db.collection('settings').doc('whatsappStatus').set({ status: 'DISCONNECTED', updated_at: clientState.updated_at }).catch(err => console.error('[Firestore Error] Failed to update disconnected status:', err));
  }

  // Safely attempt single re-initialization if not already running
  if (!isReinitializing) {
    isReinitializing = true;
    setTimeout(async () => {
      try {
        console.log('[WhatsApp] Auto re-initializing client to generate new QR scan code...');
        await client.destroy().catch(() => {});
        client.initialize();
      } catch (err) {
        console.warn('[WhatsApp] Re-initialization error:', err.message);
      } finally {
        isReinitializing = false;
      }
    }, 5000);
  }
});

// Initialize the WhatsApp Web automation client (launches Puppeteer browser)
console.log('[WhatsApp] Initializing engine and launching Puppeteer browser...');
client.initialize();

// 5. ANTI-SPAM PROTECTION: Sequential queue to inject spacing between message dispatches
const messageQueue = [];
let isProcessingQueue = false;

/**
 * Clean & format the parent's phone number to WhatsApp's global format, then queue the message.
 */
function queueWhatsAppMessage(parentPhone, studentName, rollNo) {
  // Pull the phone string, remove '+' sign, and strip all non-digit characters
  let cleanedPhone = parentPhone.replace(/^\+/, '');
  cleanedPhone = cleanedPhone.replace(/\D/g, '');

  // Auto-prepend country code '91' for Indian mobile numbers if they are exactly 10 digits
  if (cleanedPhone.length === 10) {
    cleanedPhone = '91' + cleanedPhone;
  }

  // Append WhatsApp global suffix requirement
  const formattedJid = `${cleanedPhone}@c.us`;

  // Get current system time formatted in HH:MM AM/PM
  const timeString = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  // CRAFT THE MESSAGE TEMPLATE: professional formatting with markdown bold (*text*) and italics (_text_)
  const messageBody = `*GATEPASS ALERT*

Dear Parent, your ward *${studentName}* (Roll No: ${rollNo}) has checked out and departed the college premises.

_Time: ${timeString}_`;

  // Add the message task to queue
  messageQueue.push({
    to: formattedJid,
    body: messageBody,
    studentName,
    rollNo
  });

  console.log(`[Queue] Added message for *${studentName}* (Roll No: ${rollNo}) to queue. Position: ${messageQueue.length}`);

  // Trigger processing
  processQueue();
}

/**
 * Sequentially process the queue with random delays to prevent spam bans.
 */
async function processQueue() {
  if (isProcessingQueue) return;
  if (messageQueue.length === 0) return;

  isProcessingQueue = true;
  const currentMsg = messageQueue.shift();

  // ANTI-SPAM: Random delay between 2,000 and 7,000 milliseconds for every single message
  const delay = Math.floor(Math.random() * (7000 - 2000 + 1)) + 2000;
  console.log(`[Rate Limiter] Preparing to notify parent of ${currentMsg.studentName}. Delaying for ${delay}ms to prevent spam flag...`);

  setTimeout(async () => {
    const logId = 'walog-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    try {
      console.log(`[Sender] Dispatching WhatsApp message to ${currentMsg.to}...`);
      let targetJid = currentMsg.to;
      try {
        const rawNum = currentMsg.to.replace('@c.us', '');
        const numberId = await client.getNumberId(rawNum);
        if (numberId && numberId._serialized) {
          targetJid = numberId._serialized;
        }
      } catch (numErr) {
        console.warn(`[Sender] Could not resolve getNumberId for ${currentMsg.to}, falling back to direct JID:`, numErr.message);
      }
      await client.sendMessage(targetJid, currentMsg.body);
      console.log(`[Sender] SUCCESS: Message delivered successfully to ${targetJid}`);

      // Save success log in Firestore
      db.collection('whatsappLogs').doc(logId).set({
        id: logId,
        studentName: currentMsg.studentName,
        rollNo: currentMsg.rollNo,
        parentPhone: currentMsg.to.replace('@c.us', ''),
        message: currentMsg.body,
        status: 'success',
        error: null,
        sent_at: new Date().toISOString()
      }).catch(err => console.error('[Firestore Error] Failed to save success log:', err));
    } catch (error) {
      console.error(`[Sender] FAILED to deliver message to ${currentMsg.to}:`, error);

      // Save failed log in Firestore
      db.collection('whatsappLogs').doc(logId).set({
        id: logId,
        studentName: currentMsg.studentName,
        rollNo: currentMsg.rollNo,
        parentPhone: currentMsg.to.replace('@c.us', ''),
        message: currentMsg.body,
        status: 'failed',
        error: error.message || 'Unknown error',
        sent_at: new Date().toISOString()
      }).catch(err => console.error('[Firestore Error] Failed to save failure log:', err));
    } finally {
      isProcessingQueue = false;
      // Move to the next queued message
      processQueue();
    }
  }, delay);
}

// 6. Firestore listener on the 'students' collection using '.onSnapshot()'
function startFirestoreListener() {
  if (!db) return;
  console.log('[Firestore] Establishing real-time listener on the "students" collection...');

  // Keep an in-memory cache of student status to monitor flip transitions
  const studentStatusCache = new Map();

  try {
    const unsubscribe = db.collection('students').onSnapshot(
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const docId = change.doc.id; // Document ID is the student's Roll Number
          const data = change.doc.data();
          const newStatus = data.status || '';
          const studentName = data.studentName || data.name || 'Student';
          const parentPhone = data.parentPhone || data.parent_phone || '';

          if (change.type === 'added') {
            studentStatusCache.set(docId, newStatus);
          } else if (change.type === 'modified') {
            const oldStatus = studentStatusCache.get(docId);

            console.log(`[Firestore Change] Student ${studentName} (${docId}): status changed from "${oldStatus}" to "${newStatus}"`);

            if (newStatus === 'Left' && oldStatus !== 'Left') {
              // Disabled to avoid duplicate message delivery.
              // The backend API (/api/send) already dispatches the complete GATEPASS EXIT ALERT with reason.
              console.log(`[Firestore Listener] Student ${studentName} status changed to Left. (API alert handled by backend)`);
            }

            studentStatusCache.set(docId, newStatus);
          } else if (change.type === 'removed') {
            studentStatusCache.delete(docId);
          }
        });
      },
      (error) => {
        const msg = error?.message || String(error || '');
        if (error?.code === 8 || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('Quota exceeded')) {
          console.warn('[Firestore Listener] Quota limit reached (RESOURCE_EXHAUSTED). Real-time cloud sync paused.');
          return;
        }
        console.warn('[Firestore Listener] Snapshot connection paused/retryable:', msg);
        setTimeout(() => {
          try {
            startFirestoreListener();
          } catch (e) {
            // Ignore retry failure
          }
        }, 15000);
      }
    );
  } catch (err) {
    console.warn('[Firestore Listener] Failed to initialize snapshot listener:', err.message);
  }
}
