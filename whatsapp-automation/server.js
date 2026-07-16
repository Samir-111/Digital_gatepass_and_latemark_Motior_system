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

console.log('==================================================================');
console.log('   STARTING COLLEGE DIGITAL GATEPASS WHATSAPP AUTOMATION ENGINE   ');
console.log('==================================================================');

// 2. Load service account credentials dynamically
let credentialsPath = path.resolve(__dirname, process.env.GOOGLE_APPLICATION_CREDENTIALS || './firebase-service-account.json');

if (!fs.existsSync(credentialsPath)) {
  // If not found in current folder, fallback to checking parent directory
  const parentCredentialsPath = path.resolve(__dirname, '..', process.env.GOOGLE_APPLICATION_CREDENTIALS || './firebase-service-account.json');
  if (fs.existsSync(parentCredentialsPath)) {
    credentialsPath = parentCredentialsPath;
  } else {
    console.error(`[CRITICAL ERROR] Service account credentials file not found at:
  - Local: ${credentialsPath}
  - Parent: ${parentCredentialsPath}
Please check your .env configuration.`);
    process.exit(1);
  }
}

console.log(`[Firebase Admin] Loading credentials from: ${credentialsPath}`);
const serviceAccount = require(credentialsPath);

// Initialize Firebase Admin dynamically using the loaded JSON credentials object
initializeApp({
  credential: cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID
});

const db = getFirestore();
console.log(`[Firebase Admin] Firestore database initialized for project: ${process.env.FIREBASE_PROJECT_ID}`);

// 3. Configure the whatsapp-web.js client
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: path.resolve(__dirname, '.wwebjs_auth') // Persists WhatsApp Web sessions in local directory
  }),
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process'
    ]
  }
});

// 4. Print scannable QR code directly into the terminal console using 'qrcode-terminal'
client.on('qr', (qr) => {
  console.log('\n[WhatsApp] Scan this QR code with your WhatsApp Business app to log in:');
  qrcode.generate(qr, { small: true });
  console.log('[WhatsApp] QR code printed above. Waiting for authorization...\n');

  // Save the connection status and QR token in Firestore settings
  db.collection('settings').doc('whatsappStatus').set({
    status: 'QR_READY',
    qr,
    updated_at: new Date().toISOString()
  }).catch(err => console.error('[Firestore Error] Failed to update QR status:', err));

  // Save the QR code as a PNG file in the same directory for 100% reliable scanning
  const qrFilePath = path.resolve(__dirname, 'whatsapp-qr.png');
  QRCodeImage.toFile(qrFilePath, qr, {
    color: {
      dark: '#000000',
      light: '#ffffff'
    },
    width: 320
  }, (err) => {
    if (err) {
      console.error('[WhatsApp] Failed to save QR code image:', err);
    } else {
      console.log('==================================================================');
      console.log(`[WhatsApp] A high-quality QR code image has been saved to:`);
      console.log(`           ${qrFilePath}`);
      console.log('           Open this image file on your computer to scan it easily!');
      console.log('==================================================================\n');
    }
  });
});

client.on('ready', () => {
  console.log('\n[WhatsApp] Authentication successful! Client is ready to send messages.\n');

  // Update status in Firestore
  db.collection('settings').doc('whatsappStatus').set({
    status: 'CONNECTED',
    qr: null,
    updated_at: new Date().toISOString()
  }).catch(err => console.error('[Firestore Error] Failed to update ready status:', err));

  startFirestoreListener();
});

client.on('auth_failure', (msg) => {
  console.error('[WhatsApp] Authentication failure:', msg);

  // Update status in Firestore
  db.collection('settings').doc('whatsappStatus').set({
    status: 'DISCONNECTED',
    qr: null,
    updated_at: new Date().toISOString()
  }).catch(err => console.error('[Firestore Error] Failed to update auth_failure status:', err));
});

client.on('disconnected', (reason) => {
  console.warn('[WhatsApp] Client was disconnected:', reason);

  // Update status in Firestore
  db.collection('settings').doc('whatsappStatus').set({
    status: 'DISCONNECTED',
    qr: null,
    updated_at: new Date().toISOString()
  }).catch(err => console.error('[Firestore Error] Failed to update disconnected status:', err));
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
      await client.sendMessage(currentMsg.to, currentMsg.body);
      console.log(`[Sender] SUCCESS: Message delivered successfully to ${currentMsg.to}`);

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
  console.log('[Firestore] Establishing real-time listener on the "students" collection...');

  // Keep an in-memory cache of student status to monitor flip transitions
  const studentStatusCache = new Map();

  db.collection('students').onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const docId = change.doc.id; // Document ID is the student's Roll Number
      const data = change.doc.data();
      const newStatus = data.status || '';
      const studentName = data.studentName || data.name || 'Student';
      const parentPhone = data.parentPhone || data.parent_phone || '';

      if (change.type === 'added') {
        // Cache initial status values on boot to prevent triggering notifications for pre-existing documents
        studentStatusCache.set(docId, newStatus);
      } else if (change.type === 'modified') {
        const oldStatus = studentStatusCache.get(docId);

        console.log(`[Firestore Change] Student ${studentName} (${docId}): status changed from "${oldStatus}" to "${newStatus}"`);

        // Trigger the message ONLY when a student's 'status' field flips from something else to exactly "Left"
        if (newStatus === 'Left' && oldStatus !== 'Left') {
          if (parentPhone) {
            const rollNo = data.roll_no || data.rollNo || docId;
            queueWhatsAppMessage(parentPhone, studentName, rollNo);
          } else {
            console.warn(`[Warning] Student ${studentName} (${docId}) checked out, but parentPhone is missing or undefined.`);
          }
        }

        // Keep cache in sync with updated status
        studentStatusCache.set(docId, newStatus);
      } else if (change.type === 'removed') {
        // Clean up status cache if student document is deleted
        studentStatusCache.delete(docId);
      }
    });
  }, (error) => {
    console.error('[Firestore Error] real-time snapshot listener encountered an error:', error);
  });
}
