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
  console.warn('[WhatsApp Daemon Warning] Unhandled Rejection:', reason?.message || reason);
});

console.log('==================================================================');
console.log('   STARTING COLLEGE DIGITAL GATEPASS WHATSAPP AUTOMATION ENGINE   ');
console.log('==================================================================');

const http = require('http');

let db = null;
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
    initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID
    });
    db = getFirestore();
    console.log(`[Firebase Admin] Firestore database initialized for project: ${process.env.FIREBASE_PROJECT_ID}`);
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

// Detect Chrome / Edge executable path on Windows for maximum stability
const getChromeExecutablePath = () => {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return undefined;
};

const chromePath = getChromeExecutablePath();

// 3. Configure the whatsapp-web.js client
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: path.resolve(__dirname, '.wwebjs_auth') // Persists WhatsApp Web sessions in local directory
  }),
  puppeteer: {
    executablePath: chromePath,
    headless: true,
    bypassCSP: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--disable-gpu',
      '--disable-blink-features=AutomationControlled'
    ]
  }
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

httpServer.listen(3001, () => {
  console.log('[WhatsApp Engine IPC] HTTP Server listening on http://localhost:3001');
});

// Print scannable QR code directly into the terminal console using 'qrcode-terminal'
client.on('qr', (qr) => {
  clientState = {
    status: 'QR_READY',
    qr,
    updated_at: new Date().toISOString()
  };

  if (db) {
    db.collection('settings').doc('whatsappStatus').set(clientState).catch(err => console.error('[Firestore Error] Failed to update QR status:', err));
  }
});

client.on('ready', () => {
  console.log('[WhatsApp Engine] SUCCESS: Business WhatsApp account authenticated & READY!');

  clientState = {
    status: 'CONNECTED',
    qr: null,
    updated_at: new Date().toISOString()
  };

  if (db) {
    db.collection('settings').doc('whatsappStatus').set(clientState).catch(err => console.error('[Firestore Error] Failed to update ready status:', err));
    startFirestoreListener();
  }
});

client.on('auth_failure', (msg) => {
  console.error('[WhatsApp] Authentication failure:', msg);

  clientState = {
    status: 'DISCONNECTED',
    qr: null,
    updated_at: new Date().toISOString()
  };

  if (db) {
    db.collection('settings').doc('whatsappStatus').set(clientState).catch(err => console.error('[Firestore Error] Failed to update auth_failure status:', err));
  }
});

client.on('disconnected', (reason) => {
  console.warn('[WhatsApp] Client was disconnected:', reason);

  clientState = {
    status: 'DISCONNECTED',
    qr: null,
    updated_at: new Date().toISOString()
  };

  if (db) {
    db.collection('settings').doc('whatsappStatus').set(clientState).catch(err => console.error('[Firestore Error] Failed to update disconnected status:', err));
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
              if (parentPhone) {
                const rollNo = data.roll_no || data.rollNo || docId;
                queueWhatsAppMessage(parentPhone, studentName, rollNo);
              } else {
                console.warn(`[Warning] Student ${studentName} (${docId}) checked out, but parentPhone is missing or undefined.`);
              }
            }

            studentStatusCache.set(docId, newStatus);
          } else if (change.type === 'removed') {
            studentStatusCache.delete(docId);
          }
        });
      },
      (error) => {
        console.warn('[Firestore Listener] Snapshot connection paused/retryable:', error.message);
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
