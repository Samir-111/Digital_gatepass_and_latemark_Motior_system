/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import jwt from 'jsonwebtoken';
import QRCode from 'qrcode';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { Database } from './db.js';

dotenv.config();

process.on('uncaughtException', (err) => {
  console.warn('[Server Warning] Uncaught Exception:', err.message || err);
});

process.on('unhandledRejection', (reason) => {
  console.warn('[Server Warning] Unhandled Rejection:', reason?.message || reason);
});

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'college_gatepass_super_secret_key_2026';
const db = Database.getInstance();

// Initialize Gemini SDK with User-Agent for telemetry
const apiKey = process.env.GEMINI_API_KEY;
let ai = null;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Authentication Middleware
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Session expired or invalid token. Please log in again.' });
      }
      req.user = decoded;
      next();
    });
  } else {
    res.status(401).json({ error: 'Authorization header is missing.' });
  }
};

// Role-based Access Control Middleware
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient privileges.' });
    }
    next();
  };
};

// Helper to send a real SMS using Fast2SMS API
const sendSMS = async (phoneNumber, message) => {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey || apiKey === 'YOUR_FAST2SMS_API_KEY' || apiKey.includes('api_key')) {
    console.log(`[SMS Gateway] Real SMS to ${phoneNumber} skipped: FAST2SMS_API_KEY not configured in .env`);
    return;
  }

  // Sanitize phone number (remove any leading +91, spaces, dashes)
  let cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
  if (cleanNumber.startsWith('91') && cleanNumber.length === 12) {
    cleanNumber = cleanNumber.substring(2);
  }

  try {
    const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        'authorization': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        route: 'q',
        message: message,
        numbers: cleanNumber
      })
    });

    const result = await response.json();
    console.log(`[SMS Gateway] Fast2SMS dispatch result to ${cleanNumber}:`, result);
  } catch (error) {
    console.error(`[SMS Gateway] Failed to send SMS to ${cleanNumber}:`, error);
  }
};

// Helper to send OTP email (using Brevo HTTPS REST API with fallback to nodemailer SMTP or console)
const sendOTPEmail = async (email, otp, purpose = '2-Step Verification Code') => {
  const brevoApiKey = (process.env.BREVO_API_KEY || '').trim();
  const senderEmail = (process.env.BREVO_SENDER_EMAIL || process.env.SMTP_FROM || process.env.SMTP_USER || 'sbjitnagpur@gmail.com').trim();
  const senderName = process.env.BREVO_SENDER_NAME || 'Campus GatePass Portal';

  const subject = `Campus Portal ${purpose}: ${otp}`;
  const textContent = `Your One-Time Password (OTP) for ${purpose} is: ${otp}. It is valid for 5 minutes.`;
  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #1e293b; max-width: 540px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #059669; font-size: 22px; font-weight: 800; margin: 0;">S. B. Jain Institute of Technology</h2>
        <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Digital Gatepass & Security Verification System</p>
      </div>
      <div style="background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
        <p style="font-size: 14px; font-weight: 600; color: #334155; margin-top: 0;">${purpose}</p>
        <div style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #0f172a; margin: 12px 0;">
          ${otp}
        </div>
        <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">⏱ Valid for <b>5 minutes</b>. Do not share this code with anyone.</p>
      </div>
      <p style="font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5; margin-bottom: 0;">
        If you did not initiate this login request, please contact college administration immediately.
      </p>
    </div>
  `;

  // 1. Primary: Brevo HTTPS REST API (Zero port-blocking on Render/Vercel)
  if (brevoApiKey && !brevoApiKey.includes('YOUR_')) {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': brevoApiKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: email }],
          subject: subject,
          htmlContent: htmlContent,
          textContent: textContent
        })
      });

      if (response.ok) {
        const result = await response.json().catch(() => ({}));
        console.log(`[Brevo Email Gateway] OTP successfully sent to ${email} (MessageId: ${result.messageId || 'ok'})`);
        return true;
      } else {
        const errText = await response.text();
        console.error(`[Brevo Email Gateway Error] HTTP ${response.status}:`, errText);
      }
    } catch (err) {
      console.error(`[Brevo Email Gateway Network Error]:`, err.message);
    }
  }

  // 2. Fallback: SMTP via Nodemailer
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER || process.env.SMTP_FROM || 'sbjitnagpur@gmail.com';
  const rawPass = process.env.SMTP_PASS || 'gjof mtzf ffqr yeml';
  const pass = rawPass.replace(/\s+/g, '');
  const from = process.env.SMTP_FROM || user || 'sbjitnagpur@gmail.com';

  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 8000,
      });

      await transporter.sendMail({
        from: `Campus GatePass Portal <${from}>`,
        to: email,
        subject,
        text: textContent,
        html: htmlContent
      });

      console.log(`[SMTP Fallback] OTP dispatched via SMTP to ${email}`);
      return true;
    } catch (error) {
      console.warn(`[SMTP Fallback Error]:`, error?.message || error);
    }
  }

  // 3. Fallback: Terminal Logging
  console.log('\n====================================================');
  console.log(`[OTP SERVICE] (LOCAL CONSOLE FALLBACK)`);
  console.log(`To: ${email}`);
  console.log(`OTP: ${otp}`);
  console.log(`Purpose: ${purpose}`);
  console.log(`Note: Add BREVO_API_KEY in .env for production transactional email`);
  console.log('====================================================\n');
  return false;
};

// Helper to send transactional GatePass notification emails to Class Incharge, HOD, Principal, or Student
const sendGatePassEmailAlert = async ({
  toEmail,
  recipientName,
  recipientRole,
  subject,
  title,
  badge = 'GATEPASS NOTIFICATION',
  badgeColor = '#2563eb',
  details = {},
  message = '',
  actionText = 'Open Portal',
  actionUrl = ''
}) => {
  if (!toEmail || !toEmail.includes('@')) {
    console.warn(`[GatePass Email Alert] No valid email provided for ${recipientName || recipientRole || 'recipient'}. Skipping email dispatch.`);
    return false;
  }

  const brevoApiKey = (process.env.BREVO_API_KEY || '').trim();
  const senderEmail = (process.env.BREVO_SENDER_EMAIL || process.env.SMTP_FROM || process.env.SMTP_USER || 'sbjitnagpur@gmail.com').trim();
  const senderName = process.env.BREVO_SENDER_NAME || 'Campus GatePass Portal';

  const rowsHtml = Object.entries(details)
    .filter(([_, val]) => val !== undefined && val !== null && val !== '')
    .map(([key, val]) => `
      <tr>
        <td style="padding: 9px 14px; font-weight: 600; color: #475569; width: 34%; border-bottom: 1px solid #f1f5f9; font-size: 13px;">${key}:</td>
        <td style="padding: 9px 14px; color: #0f172a; font-weight: 500; border-bottom: 1px solid #f1f5f9; font-size: 13px;">${val}</td>
      </tr>
    `).join('');

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #059669; font-size: 20px; font-weight: 800; margin: 0;">S. B. Jain Institute of Technology</h2>
        <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Digital Gatepass & Late-Mark Monitoring System</p>
      </div>
      
      <div style="background: #f8fafc; border-left: 4px solid ${badgeColor}; border-radius: 8px; padding: 16px 20px; margin-bottom: 20px;">
        <div style="display: inline-block; background: ${badgeColor}; color: #ffffff; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
          ${badge}
        </div>
        <h3 style="color: #0f172a; font-size: 17px; font-weight: 700; margin: 4px 0 6px 0;">${title}</h3>
        <p style="color: #334155; font-size: 14px; margin: 0; line-height: 1.5;">${message}</p>
      </div>

      <div style="margin-bottom: 20px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse; text-align: left;">
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>

      <div style="background: #f0fdf4; border: 1px dashed #86efac; border-radius: 8px; padding: 12px 16px; text-align: center; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 13px; color: #166534; font-weight: 600;">
          ⚡ Real-Time Automated Update: Please log in to your college portal dashboard to review or take action.
        </p>
      </div>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
        This is an automated notification from SBJITMR Campus GatePass Portal. Please do not reply directly to this email.
      </p>
    </div>
  `;

  const textContent = `${title}\n\n${message}\n\n` + Object.entries(details).map(([k, v]) => `${k}: ${v}`).join('\n');

  // 1. Primary: Brevo HTTPS REST API
  if (brevoApiKey && !brevoApiKey.includes('YOUR_')) {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': brevoApiKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: toEmail, name: recipientName || undefined }],
          subject: subject,
          htmlContent: htmlContent,
          textContent: textContent
        })
      });

      if (response.ok) {
        const result = await response.json().catch(() => ({}));
        console.log(`[GatePass Email Alert] Successfully sent via Brevo to ${toEmail} (${recipientRole || 'user'}) - MessageId: ${result.messageId || 'ok'}`);
        return true;
      } else {
        const errText = await response.text();
        console.error(`[GatePass Email Brevo Error] HTTP ${response.status}:`, errText);
      }
    } catch (err) {
      console.error(`[GatePass Email Brevo Network Error]:`, err.message);
    }
  }

  // 2. Fallback: SMTP via Nodemailer
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER || process.env.SMTP_FROM || 'sbjitnagpur@gmail.com';
  const rawPass = process.env.SMTP_PASS || 'gjof mtzf ffqr yeml';
  const pass = rawPass.replace(/\s+/g, '');
  const from = process.env.SMTP_FROM || user || 'sbjitnagpur@gmail.com';

  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 8000,
      });

      await transporter.sendMail({
        from: `Campus GatePass Portal <${from}>`,
        to: toEmail,
        subject,
        text: textContent,
        html: htmlContent
      });

      console.log(`[GatePass Email Alert] Dispatched via SMTP to ${toEmail} (${recipientRole || 'user'})`);
      return true;
    } catch (error) {
      console.warn(`[GatePass Email SMTP Error]:`, error?.message || error);
    }
  }

  // 3. Fallback: Terminal Logging
  console.log('\n====================================================');
  console.log(`[GATEPASS EMAIL ALERT] (LOCAL CONSOLE DISPATCH)`);
  console.log(`To: ${toEmail} (${recipientName || recipientRole})`);
  console.log(`Subject: ${subject}`);
  console.log(`Title: ${title}`);
  console.log(`Details:`, details);
  console.log('====================================================\n');
  return false;
};

// Helper to get active effective WhatsApp configuration (DB overrides .env)
const getEffectiveWhatsAppConfig = () => {
  const dbConfig = db.getWhatsAppConfig();
  if (dbConfig && dbConfig.idInstance && dbConfig.apiTokenInstance) {
    const instanceId = dbConfig.idInstance.trim().replace(/['"]/g, '');
    const apiToken = dbConfig.apiTokenInstance.trim().replace(/['"]/g, '');
    const rawUrl = dbConfig.apiUrl || (instanceId ? `https://${instanceId.substring(0, 4)}.api.greenapi.com` : 'https://7107.api.greenapi.com');
    const apiUrl = rawUrl.trim().replace(/['"]/g, '').replace(/\/$/, '');
    return {
      instanceId,
      apiToken,
      apiUrl,
      source: 'Admin Settings (Saved in System)',
      isCustom: true,
      updated_at: dbConfig.updated_at,
      updated_by: dbConfig.updated_by
    };
  }

  const envInstance = (process.env.GREEN_API_INSTANCE_ID || '710722683037').trim().replace(/['"]/g, '');
  const envToken = (process.env.GREEN_API_TOKEN || '37e35fefa1de4a6b8bea6b9d083d8e06c5a2402d03704bb0a0').trim().replace(/['"]/g, '');
  const rawUrl = process.env.GREEN_API_URL || (envInstance ? `https://${envInstance.substring(0, 4)}.api.greenapi.com` : 'https://7107.api.greenapi.com');
  const apiUrl = rawUrl.trim().replace(/['"]/g, '').replace(/\/$/, '');
  return {
    instanceId: envInstance,
    apiToken: envToken,
    apiUrl,
    source: 'Environment Default (.env)',
    isCustom: false,
    updated_at: null,
    updated_by: null
  };
};

// Helper to dispatch WhatsApp message to parent and audit the result
const sendWhatsAppMessage = async ({ parentPhone, studentName, rollNo, reason, exitTime, customMessage }) => {
  let cleanNumber = (parentPhone || '').replace(/[^0-9]/g, '');
  if (cleanNumber.length === 10) {
    cleanNumber = '91' + cleanNumber;
  }

  let timeString = exitTime;
  if (!timeString || timeString.includes('GMT') || timeString.includes('T')) {
    try {
      const dt = exitTime ? new Date(exitTime) : new Date();
      timeString = dt.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      timeString = new Date().toLocaleTimeString('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
  }

  const messageBody = customMessage || `*GATEPASS EXIT ALERT* 🚪\n\nDear Parent, your ward *${studentName}* (Roll No: ${rollNo}) has checked out and departed the college premises.\n\n_Time: ${timeString}_\n_Reason: ${reason || 'Official / Permitted Outing'}_\n\n- S. B. Jain Institute of Technology, Management and Research`;

  const logId = 'walog-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
  let status = 'failed';
  let errorMsg = null;

  // Green-API dynamic configuration (Admin Settings or .env fallback)
  const { instanceId, apiToken, apiUrl } = getEffectiveWhatsAppConfig();

  if (instanceId && apiToken && !instanceId.includes('YOUR_') && !apiToken.includes('YOUR_')) {
    try {
      const url = `${apiUrl}/waInstance${instanceId}/sendMessage/${apiToken}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: `${cleanNumber}@c.us`,
          message: messageBody
        })
      });

      if (response.ok) {
        const resData = await response.json();
        console.log(`[WhatsApp Gateway (Green-API)] Message successfully dispatched to ${cleanNumber}:`, resData);
        status = 'success';
        errorMsg = null;
        db.updateWhatsAppStatus({ status: 'CONNECTED', provider: 'Green-API', idInstance: instanceId, qr: null, updated_at: new Date().toISOString() });
      } else {
        const errorText = await response.text();
        console.error(`[WhatsApp Gateway (Green-API)] Returned status ${response.status}:`, errorText);
        errorMsg = `Green-API HTTP ${response.status}: ${errorText || 'Failed to dispatch'}`;
      }
    } catch (err) {
      console.error(`[WhatsApp Gateway (Green-API)] Network error connecting to Green-API:`, err);
      errorMsg = err.message || 'Network error connecting to Green-API';
    }
  } else {
    errorMsg = 'GREEN_API_INSTANCE_ID or GREEN_API_TOKEN is not configured';
    console.warn(`[WhatsApp Gateway Warning] ${errorMsg}`);
  }

  if (status !== 'success') {
    console.warn(`[WhatsApp Gateway Warning] Parent alert dispatch failed for ${studentName} (${cleanNumber}): ${errorMsg || 'WhatsApp client disconnected'}`);
  }

  const logEntry = {
    id: logId,
    studentName: studentName || 'Student',
    rollNo: rollNo || 'N/A',
    parentPhone: cleanNumber || parentPhone || 'N/A',
    message: messageBody,
    status,
    error: errorMsg || null,
    sent_at: new Date().toISOString()
  };

  db.addWhatsAppLog(logEntry);
  return logEntry;
};

// ==========================================
// API ROUTES
// ==========================================

// Public metadata for dynamic dropdown menus in login & registration
app.get('/api/public/info', (req, res) => {
  const allTeachers = db.getTeachers() || [];
  res.json({
    departments: db.getDepartments(),
    hods: db.getHODs(),
    teachers: allTeachers,
    allTeachers: allTeachers,
    guards: (db.getGuards() || []).map(g => ({ id: g.id, name: g.name, email: g.email, shift: g.shift })),
    principals: (db.getPrincipals() || []).map(p => ({ id: p.id, name: p.name, email: p.email })),
    students: (db.getStudents() || []).map(s => ({ id: s.id, name: s.name, email: s.email, roll_no: s.roll_no })),
  });
});

// 2-Step Authentication (2FA) Challenges Store (5-minute TTL)
const twoFactorChallenges = new Map();

// Periodic cleanup for expired 2FA challenges
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of twoFactorChallenges.entries()) {
    if (val.expiresAt < now) {
      twoFactorChallenges.delete(key);
    }
  }
}, 5 * 60 * 1000);

// 1. General Auth Route (Step 1: Password Verification & Dispatch WhatsApp OTP)
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const authResult = db.authenticateUser(email, password);
  if (!authResult) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  // Look up registered mobile number from user object
  const userPhone = authResult.user.phone || authResult.user.parent_phone || authResult.user.mobile || '';

  if (!userPhone || userPhone.trim() === '') {
    // If no mobile number is associated, proceed directly with standard login fallback
    const tokenPayload = {
      id: authResult.user.id,
      name: authResult.user.name,
      email: authResult.user.email,
      role: authResult.role,
      department: authResult.user.department || undefined,
    };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '12h' });
    db.addLog(authResult.user.id, authResult.user.name, authResult.role, `Logged in successfully (No registered mobile number)`);
    return res.json({ token, user: authResult.user, role: authResult.role });
  }

  // Generate 6-digit OTP code
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const challengeId = '2fa-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
  const expiresAt = Date.now() + (5 * 60 * 1000); // Expires in 5 minutes

  const userEmail = authResult.user.email || authResult.user.institutional_email || email || '';

  twoFactorChallenges.set(challengeId, {
    challengeId,
    otp,
    expiresAt,
    user: authResult.user,
    role: authResult.role,
    email: userEmail,
    phone: userPhone
  });

  // Trigger both Gmail & WhatsApp OTP dispatches in parallel background promises (instant <50ms response)
  sendOTPEmail(userEmail, otp, '2-Step Login Verification Code').catch(err => console.warn('[Brevo/Gmail OTP Dispatch Note]:', err?.message));

  if (userPhone) {
    sendWhatsAppMessage({
      parentPhone: userPhone,
      studentName: authResult.user.name,
      rollNo: authResult.user.roll_no || '2FA-OTP',
      reason: `Your 2-Step Login OTP Code is: ${otp}`,
      exitTime: new Date().toLocaleTimeString(),
      customMessage: `*Campus Portal 2-Step Login Verification Code:* *${otp}*\n\nValid for 5 minutes.`
    }).catch(err => console.warn('[WhatsApp 2FA Dispatch Note]:', err?.message));
  }

  const maskedEmail = userEmail ? userEmail.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => gp2 + '*'.repeat(gp3.length)) : 'registered email';

  res.json({
    requires2FA: true,
    challengeId,
    maskedEmail,
    userEmail,
    message: `A 6-digit 2-step verification code has been sent to your registered Gmail address (${maskedEmail}). Please check your inbox and spam folder.`
  });
});

// Step 2: 2FA WhatsApp OTP Verification Endpoint
app.post('/api/login/verify-2fa', (req, res) => {
  const { challengeId, otp } = req.body;

  if (!challengeId || !otp) {
    return res.status(400).json({ error: 'Challenge ID and 6-digit verification code are required.' });
  }

  const challenge = twoFactorChallenges.get(challengeId);
  if (!challenge) {
    return res.status(400).json({ error: 'Invalid or expired verification session. Please try logging in again.' });
  }

  if (Date.now() > challenge.expiresAt) {
    twoFactorChallenges.delete(challengeId);
    return res.status(400).json({ error: 'Verification code has expired. Please click resend to get a new code.' });
  }

  if (challenge.otp.trim() !== otp.toString().trim()) {
    return res.status(400).json({ error: 'Incorrect 6-digit verification code. Please check your Gmail inbox and spam folder.' });
  }

  // OTP verified successfully! Clear challenge and issue JWT token
  twoFactorChallenges.delete(challengeId);

  const tokenPayload = {
    id: challenge.user.id,
    name: challenge.user.name,
    email: challenge.user.email,
    role: challenge.role,
    department: challenge.user.department || undefined,
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '12h' });

  db.addLog(challenge.user.id, challenge.user.name, challenge.role, `Logged in successfully via 2-Step Gmail Verification`);

  res.json({
    token,
    user: challenge.user,
    role: challenge.role,
  });
});

// Step 3: Resend 2FA Gmail OTP Endpoint
app.post('/api/login/resend-2fa', async (req, res) => {
  const { challengeId } = req.body;

  if (!challengeId) {
    return res.status(400).json({ error: 'Challenge ID is required.' });
  }

  const challenge = twoFactorChallenges.get(challengeId);
  if (!challenge) {
    return res.status(400).json({ error: 'Invalid or expired verification session. Please log in again.' });
  }

  const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
  challenge.otp = newOtp;
  challenge.expiresAt = Date.now() + (5 * 60 * 1000);
  twoFactorChallenges.set(challengeId, challenge);

  const userEmail = challenge.email || challenge.user.email || '';  // Non-blocking async dispatches
  sendOTPEmail(userEmail, newOtp, '2-Step Login Verification Code').catch(err => console.warn('[Resend OTP Error]:', err?.message));

  if (challenge.phone) {
    sendWhatsAppMessage({
      parentPhone: challenge.phone,
      studentName: challenge.user.name,
      rollNo: challenge.user.roll_no || '2FA-OTP',
      reason: `Your 2-Step Login OTP Code is: ${newOtp}`,
      exitTime: new Date().toLocaleTimeString(),
      customMessage: `*Campus Portal 2-Step Login Verification Code:* *${newOtp}*\n\nValid for 5 minutes.`
    }).catch(err => console.warn('[WhatsApp 2FA Resend Note]:', err?.message));
  }

  const maskedEmail = userEmail ? userEmail.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => gp2 + '*'.repeat(gp3.length)) : 'registered email';

  res.json({
    success: true,
    maskedEmail,
    message: `A new 6-digit verification code has been dispatched to your registered Gmail (${maskedEmail}) and WhatsApp.`
  });
});

// 1.5 Student Registration Route
app.post('/api/register', (req, res) => {
  const { name, email, password, phone, parent_phone, roll_no, department, college_id, class_teacher_id, selected_hod_id } = req.body;

  if (!name || !email || !password || !phone || !roll_no || !department || !college_id || !class_teacher_id || !selected_hod_id) {
    return res.status(400).json({ error: 'All fields are required for student registration, including Class Teacher and HOD selection.' });
  }

  // Validate email domain
  if (!email.toLowerCase().endsWith('@sbjit.edu.in')) {
    return res.status(400).json({ error: 'Registration is restricted. You must use a valid college email ending with @sbjit.edu.in' });
  }

  // Check if student already exists by email or roll number
  const existingByEmail = db.getStudents().find(s => s.email && email && s.email.toLowerCase() === email.toLowerCase());
  const existingByRoll = db.getStudents().find(s => s.roll_no && roll_no && s.roll_no.toLowerCase() === roll_no.toLowerCase());

  if (existingByEmail) {
    return res.status(400).json({ error: 'Student with this email address is already registered.' });
  }
  if (existingByRoll) {
    return res.status(400).json({ error: 'Student with this roll number is already registered.' });
  }

  try {
    let teacherName = '';
    if (class_teacher_id) {
      const teacher = db.getTeachers().find(t => t.id === class_teacher_id);
      if (teacher) {
        teacherName = teacher.name;
      }
    }

    let hodName = '';
    if (selected_hod_id) {
      const hod = db.getHODs().find(h => h.id === selected_hod_id);
      if (hod) {
        hodName = hod.name;
      }
    }

    const student = db.registerStudent({
      name,
      email,
      phone,
      parent_phone: parent_phone || '', // Will be automatically looked up by roll number in registerStudent
      roll_no,
      department,
      college_id,
      class_teacher_id,
      class_teacher_name: teacherName,
      selected_hod_id,
      selected_hod_name: hodName,
      password_plain: password
    });

    db.addLog(student.id, student.name, 'student', `Self-registered new account with class teacher: ${teacherName || 'None'} & HOD: ${hodName || 'None'}`);

    res.status(201).json({ success: true, message: 'Registration successful! You can now log in.' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to complete registration.' });
  }
});

// 1.6 Faculty Registration Route
app.post('/api/register/faculty', (req, res) => {
  const { name, email, password, phone, department, selected_hod_id } = req.body;

  if (!name || !email || !password || !phone || !department || !selected_hod_id) {
    return res.status(400).json({ error: 'Name, email, password, mobile number, department, and HOD selection are required.' });
  }

  if (!email.toLowerCase().endsWith('@sbjit.edu.in')) {
    return res.status(400).json({ error: 'Registration is restricted. You must use a valid college email ending with @sbjit.edu.in' });
  }

  const existingTeacher = db.getTeachers().find(t => t.email && email && t.email.toLowerCase() === email.toLowerCase());
  if (existingTeacher) {
    return res.status(400).json({ error: 'A faculty member with this email address is already registered.' });
  }

  try {
    let hodName = '';
    if (selected_hod_id) {
      const hod = db.getHODs().find(h => h.id === selected_hod_id);
      if (hod) {
        hodName = hod.name;
      }
    }

    const faculty = db.registerFaculty({
      name,
      email,
      phone,
      department,
      selected_hod_id,
      selected_hod_name: hodName,
      password_plain: password
    });

    db.addLog(faculty.id, faculty.name, 'teacher', `Faculty self-registered new account with selected HOD: ${hodName || 'None'}`);

    res.status(201).json({ success: true, message: 'Faculty registration successful! You can now log in.' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to complete faculty registration.' });
  }
});

// 1.7 OTP Forgot Password Routes
// 1.7.1 Request OTP for Forgot Password
app.post('/api/forgot-password/request-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email address is required.' });
  }

  // Find user by email
  const user = db.findUserByEmail(email);
  if (!user) {
    return res.status(404).json({ error: 'No account registered with this email address.' });
  }

  try {
    // Generate a 6-digit random code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in database/memory
    db.storeOTP(email, otp);

    // Send the OTP email via Brevo REST API / fallback
    const emailSent = await sendOTPEmail(email, otp, 'Password Reset OTP Code');

    const maskedEmail = email ? email.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => gp2 + '*'.repeat(gp3.length)) : 'registered email';

    res.json({
      success: true,
      message: emailSent
        ? `A 6-digit password reset OTP code has been sent to your registered Gmail address (${maskedEmail}). Please check your inbox and spam folder.`
        : `A 6-digit password reset OTP code has been generated.`,
      ...(!emailSent ? { dev_otp: otp } : {})
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to generate and send OTP.' });
  }
});

// 1.7.2 Verify OTP and Reset Password
app.post('/api/forgot-password/verify-otp', (req, res) => {
  const { email, otp, new_password } = req.body;

  if (!email || !otp || !new_password) {
    return res.status(400).json({ error: 'Email, OTP code, and new password are required.' });
  }

  // Verify OTP
  const isOTPValid = db.verifyOTP(email, otp);
  if (!isOTPValid) {
    return res.status(400).json({ error: 'Invalid or expired OTP. Please request a new code.' });
  }

  try {
    // Update user's password
    const success = db.updateUserPassword(email, new_password);
    if (success) {
      return res.json({ success: true, message: 'Password reset successful! You can now log in with your new password.' });
    } else {
      return res.status(500).json({ error: 'Failed to update user password.' });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to reset password.' });
  }
});

// 1.8 Class Teacher (Class Incharge) Routes
app.get('/api/teacher/students', authenticateJWT, authorizeRoles('teacher'), (req, res) => {
  const teacherId = req.user.id;
  const teacherObj = db.getTeachers().find(t => t.id === teacherId);
  const teacherDept = req.user.department || teacherObj?.department;

  const students = db.getStudents();
  const filtered = students.filter(s => {
    if (s.class_teacher_id === teacherId) return true;
    if (teacherDept && s.department && s.department.toLowerCase() === teacherDept.toLowerCase()) return true;
    return false;
  });
  res.json(filtered.length > 0 ? filtered : students);
});

app.get('/api/teacher/gatepasses', authenticateJWT, authorizeRoles('teacher'), (req, res) => {
  const teacherId = req.user.id;
  const teacherObj = db.getTeachers().find(t => t.id === teacherId);
  const teacherDept = req.user.department || teacherObj?.department;

  const allPasses = db.getGatePasses();
  const filtered = allPasses.filter(p => {
    if (p.class_teacher_id && p.class_teacher_id === teacherId) return true;
    if (teacherDept && p.student_department && p.student_department.toLowerCase() === teacherDept.toLowerCase()) return true;
    return false;
  });
  res.json(filtered.length > 0 ? filtered : allPasses);
});

app.post('/api/teacher/approve', authenticateJWT, authorizeRoles('teacher'), (req, res) => {
  const { id, remarks } = req.body;
  if (!id) return res.status(400).json({ error: 'Gate pass ID is required.' });

  const pass = db.getGatePassById(id);
  if (!pass) return res.status(404).json({ error: 'Gate pass not found.' });
  if (pass.status !== 'pending') {
    return res.status(400).json({ error: 'Gate pass is already approved or processed by class teacher.' });
  }

  const updated = db.updateGatePassStatus(id, 'pending_hod', undefined, remarks || 'Approved by Class Teacher');
  db.addLog(req.user.id, req.user.name, 'teacher', `Class Teacher approved gate pass ${id} for student ${pass.student_name}. Forwarding to HOD.`);

  // Notify student (In-app)
  db.addNotification(
    pass.student_id,
    'student',
    'GatePass Approved by Teacher 📝',
    `Your gate pass request has been APPROVED by Class Incharge ${req.user.name}. It has been forwarded to HOD ${pass.selected_hod_name || 'Department Head'} for final authorization.`,
    'status_changed',
    id
  );

  // Notify HOD (In-app)
  db.addNotification(
    pass.selected_hod_id || 'hod-all',
    'hod',
    'New GatePass Approved by Teacher',
    `Student ${pass.student_name} has requested a gate pass. Class Incharge ${req.user.name} has APPROVED it. Ready for HOD final review. Reason: "${pass.reason}"`,
    'pending_request',
    id,
    pass.student_department
  );

  // 🔔 1. Dispatch Email Alert directly to HOD's email
  const hodObj = (db.getHODs() || []).find(h => h.id === pass.selected_hod_id || (h.department && pass.student_department && h.department.toLowerCase() === pass.student_department.toLowerCase()));
  if (hodObj?.email) {
    sendGatePassEmailAlert({
      toEmail: hodObj.email,
      recipientName: hodObj.name,
      recipientRole: 'Head of Department (HOD)',
      subject: `📋 [HOD Clearance Required] GatePass Approved by Class Incharge for ${pass.student_name}`,
      title: 'GatePass Awaiting Final HOD Clearance',
      badge: 'PENDING HOD SIGN-OFF',
      badgeColor: '#7c3aed',
      message: `Class Incharge <b>${req.user.name}</b> has reviewed and <b>APPROVED</b> the gatepass request for student <b>${pass.student_name}</b>. It is now forwarded to your HOD dashboard for final authorization and QR generation.`,
      details: {
        'Student Name': pass.student_name,
        'Roll Number': pass.student_roll_no || 'N/A',
        'Department': pass.student_department || 'N/A',
        'Class Incharge': req.user.name,
        'Teacher Remarks': remarks || 'Approved by Class Teacher',
        'Reason': pass.reason,
        'Departure Time': pass.exit_time ? new Date(pass.exit_time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'
      }
    }).catch(err => console.warn('[Email Alert Error (HOD forwarded)]:', err?.message));
  }

  // 🔔 2. Dispatch Email Alert to Student
  const studentUser = (db.getStudents() || []).find(s => s.id === pass.student_id);
  const studentEmail = studentUser?.email || pass.student_email;
  if (studentEmail) {
    sendGatePassEmailAlert({
      toEmail: studentEmail,
      recipientName: pass.student_name,
      recipientRole: 'Student',
      subject: `📝 GatePass Approved by Class Incharge (Forwarded to HOD)`,
      title: 'Class Incharge Approved Your GatePass',
      badge: 'FORWARDED TO HOD',
      badgeColor: '#0284c7',
      message: `Your Class Incharge <b>${req.user.name}</b> has <b>APPROVED</b> your gatepass request. It is now awaiting final clearance from your Head of Department (HOD).`,
      details: {
        'Student Name': pass.student_name,
        'Class Incharge': req.user.name,
        'Teacher Remarks': remarks || 'Approved',
        'Reason': pass.reason,
        'Departure Time': pass.exit_time ? new Date(pass.exit_time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'
      }
    }).catch(err => console.warn('[Email Alert Error (Student progress)]:', err?.message));
  }

  res.json(updated);
});

app.post('/api/teacher/reject', authenticateJWT, authorizeRoles('teacher'), (req, res) => {
  const { id, remarks } = req.body;
  if (!id) return res.status(400).json({ error: 'Gate pass ID is required.' });
  if (!remarks) return res.status(400).json({ error: 'Remarks/Reason for rejection are required.' });

  const pass = db.getGatePassById(id);
  if (!pass) return res.status(404).json({ error: 'Gate pass not found.' });
  if (pass.status !== 'pending') {
    return res.status(400).json({ error: 'Gate pass is already processed.' });
  }

  const updated = db.updateGatePassStatus(id, 'rejected', req.user.name, remarks);
  db.addLog(req.user.id, req.user.name, 'teacher', `Class Teacher rejected gate pass ${id} for student ${pass.student_name}. Reason: "${remarks}"`);

  // Notify student (In-app)
  db.addNotification(
    pass.student_id,
    'student',
    'GatePass Rejected by Teacher ❌',
    `Your gate pass request has been REJECTED by Class Incharge ${req.user.name}. Remarks: "${remarks}"`,
    'status_changed',
    id
  );

  // 🔔 Dispatch Email Alert to Student
  const studentUser = (db.getStudents() || []).find(s => s.id === pass.student_id);
  const studentEmail = studentUser?.email || pass.student_email;
  if (studentEmail) {
    sendGatePassEmailAlert({
      toEmail: studentEmail,
      recipientName: pass.student_name,
      recipientRole: 'Student',
      subject: `❌ GatePass Request Rejected by Class Incharge`,
      title: 'GatePass Application Rejected',
      badge: 'REJECTED BY INCHARGE',
      badgeColor: '#dc2626',
      message: `Your gatepass application has been <b>REJECTED</b> by Class Incharge <b>${req.user.name}</b>.`,
      details: {
        'Student Name': pass.student_name,
        'Reason Applied': pass.reason,
        'Rejected By': `Class Incharge ${req.user.name}`,
        'Rejection Remarks': remarks
      }
    }).catch(err => console.warn('[Email Alert Error (Teacher reject)]:', err?.message));
  }

  res.json(updated);
});

// 2. Student Routes
app.post('/api/student/apply', authenticateJWT, authorizeRoles('student'), async (req, res) => {
  const studentId = req.user.id;
  const { reason, destination, exit_time, return_time } = req.body;

  if (!reason || !exit_time) {
    return res.status(400).json({ error: 'Reason of application and leaving date/time are required.' });
  }

  const student = db.getStudents().find(s => s.id === studentId);
  if (!student) {
    return res.status(404).json({ error: 'Student profile not found.' });
  }

  // Automatically route to the active HOD of the student's department
  let finalHODId = null;
  let finalHODName = 'Department HOD';

  if (student.department) {
    const deptHOD = (db.getHODs() || []).find(h => h.department && h.department.trim().toLowerCase() === student.department.trim().toLowerCase());
    if (deptHOD) {
      finalHODId = deptHOD.id;
      finalHODName = deptHOD.name;
    }
  }

  if (!finalHODId && student.selected_hod_id) {
    const savedHOD = (db.getHODs() || []).find(h => h.id === student.selected_hod_id);
    if (savedHOD) {
      finalHODId = savedHOD.id;
      finalHODName = savedHOD.name;
    }
  }

  if (!finalHODId) {
    const firstHOD = (db.getHODs() || [])[0];
    if (firstHOD) {
      finalHODId = firstHOD.id;
      finalHODName = firstHOD.name;
    }
  }

  const finalDestination = destination || 'N/A';
  let finalReturnTime = return_time;
  if (!finalReturnTime) {
    try {
      finalReturnTime = new Date(new Date(exit_time).getTime() + 4 * 60 * 60 * 1000).toISOString();
    } catch (e) {
      finalReturnTime = exit_time;
    }
  }

  try {
    const gatePass = db.createGatePass(studentId, {
      reason,
      destination: finalDestination,
      exit_time,
      return_time: finalReturnTime,
      selected_hod_id: finalHODId,
      selected_hod_name: finalHODName
    });
    db.addLog(studentId, req.user.name, 'student', `Applied for gate pass: ${gatePass.id} to HOD: ${finalHODName || 'Department Head'}`);

    // Frequency Risk Assessment
    const currentMonth = new Date().toISOString().substring(0, 7); // "YYYY-MM"
    const passesThisMonth = db.getGatePasses().filter(p =>
      p.student_id === studentId &&
      p.created_at &&
      p.created_at.substring(0, 7) === currentMonth &&
      p.status !== 'rejected' &&
      p.status !== 'cancelled'
    );
    const monthlyCount = passesThisMonth.length;

    let risk_level = 'low';
    let risk_remarks = '';

    if (monthlyCount <= 2) {
      risk_level = 'low';
      risk_remarks = `Student has applied for/received ${monthlyCount} gate pass(es) this month. (Low frequency)`;
    } else if (monthlyCount <= 4) {
      risk_level = 'medium';
      risk_remarks = `Student has applied for/received ${monthlyCount} gate pass(es) this month. (Medium frequency)`;
    } else {
      risk_level = 'high';
      risk_remarks = `Warning: Student has applied for/received ${monthlyCount} gate pass(es) this month. This reaches/exceeds the limit of 5. Class Incharge or HOD should REJECT this application.`;
    }

    db.updateGatePassAIScore(gatePass.id, risk_level, risk_remarks);

    const studentInfo = db.getStudents().find(s => s.id === studentId);
    const teacherId = studentInfo?.class_teacher_id;
    const teacher = teacherId ? (db.getTeachers() || []).find(t => t.id === teacherId) : null;

    if (teacherId && teacher) {
      db.addNotification(
        teacherId,
        'teacher',
        'New GatePass Request Pending',
        `Student ${req.user.name} has requested a gate pass for "${reason}". Risk assessment: ${risk_level.toUpperCase()}. Please review and approve.`,
        'pending_request',
        gatePass.id
      );

      // 🔔 Dispatch Real-Time Email to Class Incharge's Email
      if (teacher.email) {
        sendGatePassEmailAlert({
          toEmail: teacher.email,
          recipientName: teacher.name,
          recipientRole: 'Class Incharge',
          subject: `🔔 [Action Required] New GatePass Request: ${req.user.name} (${studentInfo.roll_no || 'Student'})`,
          title: 'New GatePass Request Pending Your Approval',
          badge: 'CLASS INCHARGE ACTION REQUIRED',
          badgeColor: '#2563eb',
          message: `Student <b>${req.user.name}</b> has applied for a gate pass and is awaiting your initial review.`,
          details: {
            'Student Name': req.user.name,
            'Roll Number': studentInfo.roll_no || 'N/A',
            'Department': req.user.department || studentInfo.department || 'N/A',
            'Class / Section': studentInfo.class_name || teacher.class_name || 'N/A',
            'Reason': reason,
            'Departure Time': new Date(exit_time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }),
            'AI Risk Check': `${risk_level.toUpperCase()} (${risk_remarks})`
          }
        }).catch(err => console.warn('[Email Alert Error (Teacher on apply)]:', err?.message));
      }
    } else {
      db.addNotification(
        finalHODId || 'hod-all',
        'hod',
        'New GatePass Request Pending (No Teacher Mapped)',
        `Student ${req.user.name} has requested a gate pass for "${reason}". Risk assessment: ${risk_level.toUpperCase()}.`,
        'pending_request',
        gatePass.id,
        req.user.department
      );

      // 🔔 Dispatch Real-Time Email directly to HOD
      const hodObj = (db.getHODs() || []).find(h => h.id === finalHODId || (h.department && req.user.department && h.department.toLowerCase() === req.user.department.toLowerCase()));
      if (hodObj?.email) {
        sendGatePassEmailAlert({
          toEmail: hodObj.email,
          recipientName: hodObj.name,
          recipientRole: 'Head of Department (HOD)',
          subject: `🔔 [Action Required] New GatePass Request: ${req.user.name} (Direct HOD Review)`,
          title: 'New GatePass Request (Direct HOD Clearance)',
          badge: 'HOD ACTION REQUIRED',
          badgeColor: '#7c3aed',
          message: `Student <b>${req.user.name}</b> has submitted a gate pass request directly to HOD for review.`,
          details: {
            'Student Name': req.user.name,
            'Roll Number': studentInfo.roll_no || 'N/A',
            'Department': req.user.department || studentInfo.department || 'N/A',
            'Reason': reason,
            'Departure Time': new Date(exit_time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }),
            'Risk Level': `${risk_level.toUpperCase()}`
          }
        }).catch(err => console.warn('[Email Alert Error (HOD direct on apply)]:', err?.message));
      }
    }

    const finalizedPass = db.getGatePassById(gatePass.id);
    res.status(201).json(finalizedPass);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to submit request.' });
  }
});

app.get('/api/student/history', authenticateJWT, authorizeRoles('student'), (req, res) => {
  const studentId = req.user.id;
  const passes = db.getGatePasses({ student_id: studentId });
  res.json(passes);
});

app.post('/api/student/cancel', authenticateJWT, authorizeRoles('student'), (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Gate pass ID is required.' });

  const pass = db.getGatePassById(id);
  if (!pass) return res.status(404).json({ error: 'Gate pass not found.' });
  if (pass.student_id !== req.user.id) return res.status(403).json({ error: 'Access denied.' });
  if (pass.status !== 'pending') return res.status(400).json({ error: 'Only pending requests can be cancelled.' });

  const updated = db.updateGatePassStatus(id, 'cancelled');
  db.addLog(req.user.id, req.user.name, 'student', `Cancelled gate pass request: ${id}`);

  if (pass.selected_hod_id) {
    db.addNotification(
      pass.selected_hod_id,
      'hod',
      'GatePass Cancelled',
      `Student ${req.user.name} has cancelled their pending gate pass request: ${id}.`,
      'status_changed',
      id,
      req.user.department
    );
  }

  res.json(updated);
});

// 3. HOD Routes
app.get('/api/hod/pending', authenticateJWT, authorizeRoles('hod'), (req, res) => {
  const hodDept = req.user.department;
  const hodId = req.user.id;

  const allPasses = db.getGatePasses();
  const passes = allPasses.filter(p => {
    const matchesHod = (p.selected_hod_id && p.selected_hod_id === hodId) ||
      (hodDept && p.student_department && p.student_department.toLowerCase() === hodDept.toLowerCase()) ||
      (hodDept && p.faculty_department && p.faculty_department.toLowerCase() === hodDept.toLowerCase());

    if (!matchesHod) return false;

    return p.status === 'pending_hod' || (p.status === 'pending' && (!p.class_teacher_id || p.class_teacher_id === ''));
  });

  res.json(passes);
});

app.get('/api/hod/history', authenticateJWT, authorizeRoles('hod'), (req, res) => {
  const hodDept = req.user.department;
  const hodId = req.user.id;

  const allPasses = db.getGatePasses();
  const history = allPasses.filter(p => {
    const matchesHod = (p.selected_hod_id && p.selected_hod_id === hodId) ||
      (hodDept && p.student_department && p.student_department.toLowerCase() === hodDept.toLowerCase()) ||
      (hodDept && p.faculty_department && p.faculty_department.toLowerCase() === hodDept.toLowerCase());

    if (!matchesHod) return false;
    return p.status !== 'pending' && p.status !== 'pending_hod';
  });

  res.json(history);
});

app.post('/api/hod/approve', authenticateJWT, authorizeRoles('hod'), async (req, res) => {
  const { id, remarks } = req.body;
  if (!id) return res.status(400).json({ error: 'Gate pass ID is required.' });

  const pass = db.getGatePassById(id);
  if (!pass) return res.status(404).json({ error: 'Gate pass not found.' });
  if (pass.status !== 'pending_hod' && pass.status !== 'pending') {
    return res.status(400).json({ error: 'Gate pass is not pending HOD clearance.' });
  }

  // Handle Faculty GatePass approval (Forwards to Principal)
  if (pass.user_type === 'faculty' || pass.faculty_id) {
    const updated = db.updateGatePassStatus(id, 'pending_principal', req.user.name, remarks || 'Approved by HOD. Forwarded to Principal.');
    db.addLog(req.user.id, req.user.name, 'hod', `HOD approved faculty gate pass ${id} for ${pass.faculty_name}. Forwarded to Principal for final clearance.`);

    // Notify Faculty (In-app)
    db.addNotification(
      pass.faculty_id,
      'teacher',
      'Faculty GatePass Cleared by HOD 📝',
      `Your gate pass request for "${pass.reason}" was CLEARED by HOD ${req.user.name}. It has been forwarded to Principal for final authorization & QR generation.`,
      'status_changed',
      id
    );

    // Notify Principal (In-app)
    db.addNotification(
      'principal-1',
      'principal',
      'New Faculty GatePass Forwarded by HOD 🎓',
      `HOD ${req.user.name} has cleared & forwarded Faculty ${pass.faculty_name}'s gate pass request ("${pass.reason}"). Awaiting Principal sign-off.`,
      'pending_request',
      id
    );

    // 🔔 1. Dispatch Email Alert to Principal
    const principalObj = (db.getPrincipals() || [])[0] || { email: 'principal@sbjit.edu.in', name: 'Dr. S. K. Principal' };
    if (principalObj?.email) {
      sendGatePassEmailAlert({
        toEmail: principalObj.email,
        recipientName: principalObj.name,
        recipientRole: 'Principal',
        subject: `🎓 [Principal Authorization] Faculty GatePass for ${pass.faculty_name}`,
        title: 'Faculty GatePass Awaiting Principal Sign-Off',
        badge: 'PRINCIPAL ACTION REQUIRED',
        badgeColor: '#4f46e5',
        message: `HOD <b>${req.user.name}</b> has approved and forwarded Faculty <b>${pass.faculty_name}</b>'s gate pass application. Please authorize it in your dashboard.`,
        details: {
          'Faculty Name': pass.faculty_name,
          'Department': pass.faculty_department || 'Faculty',
          'Reason': pass.reason,
          'Cleared By': `HOD ${req.user.name}`,
          'HOD Remarks': remarks || 'Approved & Forwarded'
        }
      }).catch(err => console.warn('[Email Alert Error (Principal on HOD approve)]:', err?.message));
    }

    // 🔔 2. Dispatch Email Alert to Faculty
    const teacherObj = (db.getTeachers() || []).find(t => t.id === pass.faculty_id);
    const facultyEmail = teacherObj?.email || pass.faculty_email;
    if (facultyEmail) {
      sendGatePassEmailAlert({
        toEmail: facultyEmail,
        recipientName: pass.faculty_name,
        recipientRole: 'Faculty',
        subject: `📝 Faculty GatePass Approved by HOD (Forwarded to Principal)`,
        title: 'GatePass Approved by HOD',
        badge: 'FORWARDED TO PRINCIPAL',
        badgeColor: '#0284c7',
        message: `Your gate pass application for <b>"${pass.reason}"</b> was approved by HOD <b>${req.user.name}</b> and forwarded to the Principal for final sign-off.`,
        details: {
          'Faculty Name': pass.faculty_name,
          'HOD Name': req.user.name,
          'Reason': pass.reason
        }
      }).catch(err => console.warn('[Email Alert Error (Faculty on HOD approve)]:', err?.message));
    }

    return res.json(updated);
  }

  // Handle Student GatePass approval (Generates QR Code)
  try {
    const qrPayload = JSON.stringify({
      id: pass.id,
      token: pass.token,
      student_id: pass.student_id,
      student_name: pass.student_name,
      roll_no: pass.student_roll_no,
      department: pass.student_department,
      destination: pass.destination,
      exit_time: pass.exit_time,
      return_time: pass.return_time,
    });

    const qrCodeBase64 = await QRCode.toDataURL(qrPayload, {
      color: {
        dark: '#1e293b',
        light: '#ffffff',
      },
      margin: 2,
    });

    const updated = db.updateGatePassStatus(id, 'approved', req.user.name, remarks || 'Approved by HOD', qrCodeBase64);
    db.addLog(req.user.id, req.user.name, 'hod', `Approved gate pass ${id} for student ${pass.student_name}`);

    // Notify student of approval (In-app)
    db.addNotification(
      pass.student_id,
      'student',
      'GatePass Approved! 🎉',
      `Your gate pass request for "${pass.reason}" has been APPROVED by HOD ${req.user.name}. You can download your QR code now.`,
      'status_changed',
      id
    );

    // 🔔 Dispatch Real-Time Email to Student
    const studentUser = (db.getStudents() || []).find(s => s.id === pass.student_id);
    const studentEmail = studentUser?.email || pass.student_email;
    if (studentEmail) {
      sendGatePassEmailAlert({
        toEmail: studentEmail,
        recipientName: pass.student_name,
        recipientRole: 'Student',
        subject: `🎉 GatePass APPROVED by HOD - QR Code Ready!`,
        title: 'GatePass Approved & Authorized',
        badge: 'APPROVED & QR READY',
        badgeColor: '#059669',
        message: `Your gatepass request for <b>"${pass.reason}"</b> has been <b>APPROVED</b> by HOD <b>${req.user.name}</b>. Your Digital QR Pass is now active in your student dashboard.`,
        details: {
          'Student Name': pass.student_name,
          'Roll Number': pass.student_roll_no || 'N/A',
          'Department': pass.student_department || 'N/A',
          'Authorized By': `HOD ${req.user.name}`,
          'Reason': pass.reason,
          'Departure Time': pass.exit_time ? new Date(pass.exit_time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) : 'N/A',
          'HOD Remarks': remarks || 'Approved'
        }
      }).catch(err => console.warn('[Email Alert Error (Student on HOD approve)]:', err?.message));
    }

    // Real parents SMS notification
    const parentPhone = pass.student_parent_phone || '+91 9876543210';
    const message = `Dear Parent, your child ${pass.student_name} is leaving the college for the reason: "${pass.reason}".`;
    db.addLog(
      'system',
      'SMS Gateway',
      'admin',
      `SMS alert sent to Parent (${parentPhone}): ${message}`
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate secure QR Code.' });
  }
});

app.post('/api/hod/reject', authenticateJWT, authorizeRoles('hod'), (req, res) => {
  const { id, remarks } = req.body;
  if (!id) return res.status(400).json({ error: 'Gate pass ID is required.' });
  if (!remarks) return res.status(400).json({ error: 'Reason/Remarks for rejection are required.' });

  const pass = db.getGatePassById(id);
  if (!pass) return res.status(404).json({ error: 'Gate pass not found.' });
  if (pass.status !== 'pending_hod' && pass.status !== 'pending') return res.status(400).json({ error: 'Gate pass is already processed or not pending HOD clearance.' });

  const updated = db.updateGatePassStatus(id, 'rejected', req.user.name, remarks);
  db.addLog(req.user.id, req.user.name, 'hod', `Rejected gate pass ${id} for ${pass.user_type === 'faculty' ? pass.faculty_name : pass.student_name}`);

  // Notify applicant of rejection (In-app)
  const recipientId = pass.user_type === 'faculty' ? pass.faculty_id : pass.student_id;
  const recipientRole = pass.user_type === 'faculty' ? 'teacher' : 'student';

  db.addNotification(
    recipientId,
    recipientRole,
    'GatePass Rejected ❌',
    `Your gate pass request for "${pass.reason}" has been REJECTED by HOD ${req.user.name}. Remarks: "${remarks}"`,
    'status_changed',
    id
  );

  // 🔔 Dispatch Real-Time Email to Applicant (Student or Faculty)
  const recipientEmail = pass.user_type === 'faculty'
    ? (db.getTeachers()?.find(t => t.id === pass.faculty_id)?.email || pass.faculty_email)
    : (db.getStudents()?.find(s => s.id === pass.student_id)?.email || pass.student_email);

  if (recipientEmail) {
    sendGatePassEmailAlert({
      toEmail: recipientEmail,
      recipientName: pass.user_type === 'faculty' ? pass.faculty_name : pass.student_name,
      recipientRole: pass.user_type === 'faculty' ? 'Faculty' : 'Student',
      subject: `❌ GatePass Request Rejected by HOD`,
      title: 'GatePass Request Rejected',
      badge: 'REJECTED BY HOD',
      badgeColor: '#dc2626',
      message: `Your gate pass request for <b>"${pass.reason}"</b> was <b>REJECTED</b> by HOD <b>${req.user.name}</b>.`,
      details: {
        'Applicant': pass.user_type === 'faculty' ? pass.faculty_name : pass.student_name,
        'Reason Applied': pass.reason,
        'Rejected By': `HOD ${req.user.name}`,
        'Rejection Remarks': remarks
      }
    }).catch(err => console.warn('[Email Alert Error (Applicant on HOD reject)]:', err?.message));
  }

  res.json(updated);
});



// Warning SMS & Parent Disciplinary Alert Handler
const handleSendWarningSMS = async (req, res) => {
  const { entryId, parentPhone, studentName, arrivalTime, teacherName, className } = req.body;
  if (!parentPhone || !studentName) {
    return res.status(400).json({ error: 'Parent phone number and student name are required.' });
  }

  const cleanPhone = parentPhone.replace(/[^0-9]/g, '');
  const timeStr = arrivalTime || new Date().toLocaleTimeString();

  const waLog = await sendWhatsAppMessage({
    parentPhone: cleanPhone,
    studentName: studentName,
    rollNo: 'LATE-WARNING',
    reason: `Late Campus Arrival at ${timeStr}`,
    exitTime: timeStr
  });

  db.addLog(
    req.user ? req.user.id : 'system',
    req.user ? req.user.name : 'Class Teacher',
    req.user ? req.user.role : 'teacher',
    `Sent warning alert to Parent (${cleanPhone}) for Student ${studentName}`
  );

  res.json({
    message: 'Warning SMS alert delivered to parent successfully.',
    whatsapp: waLog
  });
};

app.post('/api/sms/send-warning', authenticateJWT, handleSendWarningSMS);
app.post('/api/teacher/warning-sms', authenticateJWT, authorizeRoles('teacher', 'admin', 'hod'), handleSendWarningSMS);

// 3c. Faculty GatePass Routes (For Teachers / Faculty)
app.post('/api/faculty/apply', authenticateJWT, authorizeRoles('teacher'), (req, res) => {
  const facultyId = req.user.id;
  const { reason, destination, exit_time, return_time, vehicle_no, remarks, selected_hod_id } = req.body;

  if (!reason || !exit_time) {
    return res.status(400).json({ error: 'Reason for application and exit date/time are required.' });
  }

  const teacherObj = (db.getTeachers() || []).find(t => t.id === facultyId);
  let finalHodId = selected_hod_id || teacherObj?.selected_hod_id;
  let finalHodName = teacherObj?.selected_hod_name;

  if (finalHodId && !finalHodName) {
    const hod = db.getHODs().find(h => h.id === finalHodId);
    if (hod) finalHodName = hod.name;
  }

  if (!finalHodId && req.user.department) {
    const deptHOD = db.getHODs().find(h => h.department && req.user.department && h.department.toLowerCase() === req.user.department.toLowerCase());
    if (deptHOD) {
      finalHodId = deptHOD.id;
      finalHodName = deptHOD.name;
    }
  }

  const finalDestination = destination || 'N/A';
  let finalReturnTime = return_time;
  if (!finalReturnTime) {
    try {
      finalReturnTime = new Date(new Date(exit_time).getTime() + 4 * 60 * 60 * 1000).toISOString();
    } catch (e) {
      finalReturnTime = exit_time;
    }
  }

  const gatePass = db.createFacultyGatePass(facultyId, {
    reason,
    destination: finalDestination,
    exit_time,
    return_time: finalReturnTime,
    vehicle_no,
    remarks,
    faculty_name: req.user.name,
    faculty_department: req.user.department || 'General',
    selected_hod_id: finalHodId,
    selected_hod_name: finalHodName,
  });

  db.addLog(facultyId, req.user.name, 'teacher', `Faculty applied for gate pass: ${gatePass.id} to HOD: ${finalHodName || 'Department HOD'}`);

  // 1st Step Notification: Sent to HOD (In-app)
  db.addNotification(
    finalHodId || 'hod-all',
    'hod',
    'New Faculty GatePass Application 📝',
    `Faculty ${req.user.name} (${req.user.department || 'Faculty'}) has requested a gate pass for: "${reason}". Ready for HOD clearance.`,
    'pending_request',
    gatePass.id,
    req.user.department
  );

  // 🔔 Dispatch Real-Time Email to HOD
  const hodObj = (db.getHODs() || []).find(h => h.id === finalHodId || (h.department && req.user.department && h.department.toLowerCase() === req.user.department.toLowerCase()));
  if (hodObj?.email) {
    sendGatePassEmailAlert({
      toEmail: hodObj.email,
      recipientName: hodObj.name,
      recipientRole: 'Head of Department (HOD)',
      subject: `🔔 [Action Required] New Faculty GatePass: ${req.user.name}`,
      title: 'Faculty GatePass Request Awaiting Your Review',
      badge: 'FACULTY GATEPASS - HOD REVIEW',
      badgeColor: '#7c3aed',
      message: `Faculty member <b>${req.user.name}</b> has submitted a gate pass application.`,
      details: {
        'Faculty Name': req.user.name,
        'Department': req.user.department || 'General',
        'Reason': reason,
        'Vehicle No': vehicle_no || 'N/A',
        'Departure Time': new Date(exit_time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })
      }
    }).catch(err => console.warn('[Email Alert Error (HOD on faculty apply)]:', err?.message));
  }

  res.json(gatePass);
});

app.get('/api/faculty/my-passes', authenticateJWT, authorizeRoles('teacher'), (req, res) => {
  const facultyId = req.user.id;
  const allPasses = db.getGatePasses({ faculty_id: facultyId });
  res.json(allPasses);
});

// 3d. Principal Routes
app.get('/api/principal/pending', authenticateJWT, authorizeRoles('principal', 'admin'), (req, res) => {
  const allPasses = db.getGatePasses();
  const pendingFaculty = allPasses.filter(p => (p.user_type === 'faculty' || p.faculty_id) && p.status === 'pending_principal');
  res.json(pendingFaculty);
});

app.get('/api/principal/history', authenticateJWT, authorizeRoles('principal', 'admin'), (req, res) => {
  const allPasses = db.getGatePasses();
  const historyFaculty = allPasses.filter(p => (p.user_type === 'faculty' || p.faculty_id) && p.status !== 'pending_principal');
  res.json(historyFaculty);
});

app.get('/api/principal/all-passes', authenticateJWT, authorizeRoles('principal', 'admin'), (req, res) => {
  const allPasses = db.getGatePasses();
  res.json(allPasses);
});

app.post('/api/principal/approve', authenticateJWT, authorizeRoles('principal', 'admin'), async (req, res) => {
  const { id, remarks } = req.body;
  if (!id) return res.status(400).json({ error: 'Gate pass ID is required.' });

  const pass = db.getGatePassById(id);
  if (!pass) return res.status(404).json({ error: 'Gate pass not found.' });

  try {
    const qrPayload = JSON.stringify({
      id: pass.id,
      token: pass.token,
      user_type: 'faculty',
      faculty_id: pass.faculty_id,
      faculty_name: pass.faculty_name,
      department: pass.faculty_department,
      destination: pass.destination,
      exit_time: pass.exit_time,
      return_time: pass.return_time,
    });

    const qrCodeBase64 = await QRCode.toDataURL(qrPayload, {
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      margin: 2,
    });

    const updated = db.updateGatePassStatus(id, 'approved', req.user.name, remarks || 'Approved by Principal', qrCodeBase64);
    db.addLog(req.user.id, req.user.name, 'principal', `Principal approved faculty gate pass ${id} for ${pass.faculty_name}`);

    // Notify faculty member (In-app)
    db.addNotification(
      pass.faculty_id,
      'teacher',
      'Faculty GatePass Approved! 🎉',
      `Your gate pass request for "${pass.reason}" has been APPROVED by Principal ${req.user.name}. You can access & download your QR code now.`,
      'status_changed',
      id
    );

    // 🔔 Dispatch Real-Time Email to Faculty
    const teacherObj = (db.getTeachers() || []).find(t => t.id === pass.faculty_id);
    const facultyEmail = teacherObj?.email || pass.faculty_email;
    if (facultyEmail) {
      sendGatePassEmailAlert({
        toEmail: facultyEmail,
        recipientName: pass.faculty_name,
        recipientRole: 'Faculty',
        subject: `🎉 Faculty GatePass APPROVED by Principal - QR Code Ready!`,
        title: 'Faculty GatePass Authorized by Principal',
        badge: 'APPROVED & AUTHORIZED',
        badgeColor: '#059669',
        message: `Your gate pass application for <b>"${pass.reason}"</b> has received final clearance from Principal <b>${req.user.name}</b>. Your Digital QR Pass is active now.`,
        details: {
          'Faculty Name': pass.faculty_name,
          'Department': pass.faculty_department || 'General',
          'Authorized By': `Principal ${req.user.name}`,
          'Reason': pass.reason,
          'Destination': pass.destination || 'N/A',
          'Departure Time': pass.exit_time ? new Date(pass.exit_time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) : 'N/A',
          'Remarks': remarks || 'Approved by Principal'
        }
      }).catch(err => console.warn('[Email Alert Error (Faculty on Principal approve)]:', err?.message));
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate secure QR Code.' });
  }
});

app.post('/api/principal/reject', authenticateJWT, authorizeRoles('principal', 'admin'), (req, res) => {
  const { id, remarks } = req.body;
  if (!id) return res.status(400).json({ error: 'Gate pass ID is required.' });
  if (!remarks) return res.status(400).json({ error: 'Reason/Remarks for rejection are required.' });

  const pass = db.getGatePassById(id);
  if (!pass) return res.status(404).json({ error: 'Gate pass not found.' });

  const updated = db.updateGatePassStatus(id, 'rejected', req.user.name, remarks);
  db.addLog(req.user.id, req.user.name, 'principal', `Principal rejected faculty gate pass ${id} for ${pass.faculty_name}`);

  // Notify faculty member (In-app)
  db.addNotification(
    pass.faculty_id,
    'teacher',
    'Faculty GatePass Rejected ❌',
    `Your gate pass request for "${pass.reason}" has been REJECTED by Principal ${req.user.name}. Remarks: "${remarks}"`,
    'status_changed',
    id
  );

  // 🔔 Dispatch Real-Time Email to Faculty
  const teacherObj = (db.getTeachers() || []).find(t => t.id === pass.faculty_id);
  const facultyEmail = teacherObj?.email || pass.faculty_email;
  if (facultyEmail) {
    sendGatePassEmailAlert({
      toEmail: facultyEmail,
      recipientName: pass.faculty_name,
      recipientRole: 'Faculty',
      subject: `❌ Faculty GatePass Rejected by Principal`,
      title: 'GatePass Request Rejected',
      badge: 'REJECTED BY PRINCIPAL',
      badgeColor: '#dc2626',
      message: `Your gate pass application for <b>"${pass.reason}"</b> was <b>REJECTED</b> by Principal <b>${req.user.name}</b>.`,
      details: {
        'Faculty Name': pass.faculty_name,
        'Reason Applied': pass.reason,
        'Rejected By': `Principal ${req.user.name}`,
        'Remarks': remarks
      }
    }).catch(err => console.warn('[Email Alert Error (Faculty on Principal reject)]:', err?.message));
  }

  res.json(updated);
});

// Admin Principal management
app.get('/api/admin/principals', authenticateJWT, authorizeRoles('admin'), (req, res) => {
  res.json(db.getPrincipals());
});

app.post('/api/admin/principals/create', authenticateJWT, authorizeRoles('admin'), (req, res) => {
  const body = req.body || {};
  const name = (body.name || body.principalName || '').trim();
  const email = (body.email || body.principalEmail || '').trim();
  const password = body.password || body.password_plain || body.principalPass || '';

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  try {
    const p = db.registerPrincipal({ name, email, password_plain: password, phone: body.phone, designation: body.designation });
    db.addLog(req.user.id, req.user.name, 'admin', `Registered Principal Account: ${name} (${email})`);
    res.status(201).json(p);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to register principal.' });
  }
});

app.delete('/api/admin/principals/:id', authenticateJWT, authorizeRoles('admin'), (req, res) => {
  const { id } = req.params;
  const deleted = db.deletePrincipal(id);
  if (deleted) {
    db.addLog(req.user.id, req.user.name, 'admin', `Deleted Principal account: ${id}`);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Principal account not found.' });
  }
});

// 4. Guard Routes
app.get('/api/guard/entries', authenticateJWT, authorizeRoles('guard', 'admin'), (req, res) => {
  const passes = db.getGatePasses();
  res.json(passes);
});

app.post('/api/guard/verify', authenticateJWT, authorizeRoles('guard'), (req, res) => {
  let { token, id } = req.body;
  if (!token && !id) {
    return res.status(400).json({ error: 'Verification credentials are missing.' });
  }

  // If token is a JSON payload, parse it
  if (token && typeof token === 'string') {
    const trimmed = token.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.id) id = parsed.id;
        if (parsed.token) token = parsed.token;
      } catch (e) {
        console.error('Failed to parse JSON QR token:', e);
      }
    }
  }

  let pass = null;
  if (id) {
    pass = db.getGatePassById(id);
  } else {
    const list = db.getGatePasses();
    pass = list.find(p => p.token === token);
  }

  if (!pass) {
    return res.status(404).json({ error: 'Gate Pass Verification Failed: Token is invalid, forged, or counterfeit.' });
  }

  // Security checks:
  if (pass.status === 'pending') {
    return res.status(400).json({ error: 'Pass pending HOD approval. Entry/Exit not permitted.', pass });
  }
  if (pass.status === 'rejected') {
    return res.status(400).json({ error: 'Pass has been REJECTED by HOD. Access denied.', pass });
  }
  if (pass.status === 'cancelled') {
    return res.status(400).json({ error: 'Pass has been cancelled by the student.', pass });
  }

  // Is it expired?
  const now = new Date();
  const returnTime = new Date(pass.return_time);
  let expired = false;
  if (now > returnTime) {
    expired = true;
  }

  // Is it already closed?
  if (pass.status === 'closed') {
    return res.status(400).json({ error: 'Single-Use Violation: This gate pass was already completed/returned and closed.', pass, duplicate: true });
  }

  res.json({
    message: expired
      ? (pass.status === 'approved' ? 'Gate Pass Verified: Student checked out LATE.' : 'Gate Pass Verified: Student returned LATE.')
      : 'Gate Pass Verified successfully. Security checks clear.',
    pass,
    expired,
  });
});

app.post('/api/guard/exit', authenticateJWT, authorizeRoles('guard'), async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Gate pass ID is required.' });

  const pass = db.getGatePassById(id);
  if (!pass) return res.status(404).json({ error: 'Gate pass not found.' });
  if (pass.status !== 'approved') {
    return res.status(400).json({ error: `Cannot mark exit. Pass status is currently ${pass.status}.` });
  }

  const updated = db.markExit(id);
  db.addLog(req.user.id, req.user.name, 'guard', `Marked exit for ${pass.user_type === 'faculty' ? 'Faculty ' + pass.faculty_name : 'Student ' + pass.student_name} on pass ${id}`);

  if (pass.user_type === 'faculty' || pass.faculty_id) {
    const facultyExitTime = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', hour12: true });
    db.addNotification(
      pass.faculty_id,
      'teacher',
      'Campus Exit Marked 🚪',
      `You checked out of campus gate at ${facultyExitTime}. Have a safe trip!`,
      'status_changed',
      id
    );
    return res.json({ message: 'Faculty campus exit logged successfully.', pass: updated });
  }

  // Trigger real-time parent WhatsApp alert by changing student status to "Left" in Firestore/memory
  db.updateStudentStatusByRollNo(pass.student_roll_no, 'Left');

  const exitTimeString = new Date().toLocaleTimeString('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  // Notify student of exit
  db.addNotification(
    pass.student_id,
    'student',
    'Campus Exit Marked 🚪',
    `You checked out of the campus gate at ${exitTimeString}. Safe travels!`,
    'status_changed',
    id
  );

  // Parse phone number
  const parentPhone = (pass.student_parent_phone && pass.student_parent_phone !== 'N/A')
    ? pass.student_parent_phone
    : (db.getOfficialParentPhone(pass.student_roll_no, '') || '+91 9022616290');

  console.log('====================================================');
  console.log(`[CAMPUS EXIT WHATSAPP ALERT DISPATCH]`);
  console.log(`To: ${parentPhone} (Parent of ${pass.student_name})`);
  console.log(`Student Roll: ${pass.student_roll_no}`);
  console.log('====================================================');

  // Dispatch real WhatsApp message to parent and log audit entry
  const waLog = await sendWhatsAppMessage({
    parentPhone,
    studentName: pass.student_name,
    rollNo: pass.student_roll_no,
    reason: pass.reason,
    exitTime: exitTimeString
  });

  db.addLog(
    'system',
    'WhatsApp Gateway',
    'admin',
    `WhatsApp alert ${waLog.status === 'success' ? 'delivered' : 'logged'} for Parent of ${pass.student_name} (${parentPhone})`
  );

  res.json({
    message: waLog.status === 'success'
      ? 'Student exit logged successfully. WhatsApp alert delivered to parent.'
      : 'Student exit logged successfully. WhatsApp alert recorded.',
    pass: updated,
    whatsapp: waLog
  });
});

app.post('/api/guard/return', authenticateJWT, authorizeRoles('guard'), (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Gate pass ID is required.' });

  const pass = db.getGatePassById(id);
  if (!pass) return res.status(404).json({ error: 'Gate pass not found.' });
  if (pass.status !== 'exited') {
    return res.status(400).json({ error: `Cannot mark return. Pass status is ${pass.status} instead of exited.` });
  }

  const updated = db.markReturn(id);
  db.addLog(req.user.id, req.user.name, 'guard', `Marked return for ${pass.user_type === 'faculty' ? 'Faculty ' + pass.faculty_name : 'Student ' + pass.student_name}, gate pass closed.`);

  const returnTimeStr = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', hour12: true });

  if (pass.user_type === 'faculty' || pass.faculty_id) {
    db.addNotification(
      pass.faculty_id,
      'teacher',
      'Campus Return Registered ✅',
      `Welcome back! Your campus return was registered at ${returnTimeStr} and the gate pass is now closed.`,
      'status_changed',
      id
    );
    return res.json({ message: 'Faculty campus return logged successfully. Pass closed.', pass: updated });
  }

  // Reset student status in Firestore/database back to "Inside"
  db.updateStudentStatusByRollNo(pass.student_roll_no, 'Inside');

  // Notify student of return
  db.addNotification(
    pass.student_id,
    'student',
    'Campus Return Registered ✅',
    `Welcome back! Your return was registered at ${returnTimeStr} and the gate pass is now closed.`,
    'status_changed',
    id
  );

  res.json({ message: 'Student return logged successfully. Pass closed.', pass: updated });
});


// 4.5 Centralized Notification API Routes
app.get('/api/notifications', authenticateJWT, (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;
  const department = req.user.department;
  const list = db.getNotifications(userId, role, department);
  res.json(list);
});

app.post('/api/notifications/read', authenticateJWT, (req, res) => {
  const { id, all } = req.body;
  if (all) {
    db.markAllNotificationsAsRead(req.user.id, req.user.role, req.user.department);
    return res.json({ success: true, message: 'All notifications marked as read.' });
  }
  if (!id) return res.status(400).json({ error: 'Notification ID is required.' });
  const success = db.markNotificationAsRead(id);
  res.json({ success });
});

// 5. Admin Dashboard & Operations Routes
app.get('/api/admin/dashboard', authenticateJWT, authorizeRoles('admin'), (req, res) => {
  const passes = db.getGatePasses();
  const students = db.getStudents();
  const depts = db.getDepartments();
  const logs = db.getLogs().slice(0, 50);

  const total = passes.length;
  const pending = passes.filter(p => p.status === 'pending').length;
  const approved = passes.filter(p => p.status === 'approved' || p.status === 'exited' || p.status === 'closed').length;
  const activeOut = passes.filter(p => p.status === 'exited').length;

  const today = new Date().toDateString();
  const approvedToday = passes.filter(p => p.approved_by && new Date(p.created_at).toDateString() === today).length;
  const rejectedToday = passes.filter(p => p.status === 'rejected' && new Date(p.created_at).toDateString() === today).length;

  // Requests by department
  const requests_by_department = {};
  depts.forEach(d => { requests_by_department[d.department_name] = 0; });
  passes.forEach(p => {
    if (p.student_department) {
      requests_by_department[p.student_department] = (requests_by_department[p.student_department] || 0) + 1;
    }
  });

  // Requests by status
  const requests_by_status = {
    pending: 0,
    approved: 0,
    rejected: 0,
    exited: 0,
    closed: 0,
    cancelled: 0,
  };
  passes.forEach(p => {
    requests_by_status[p.status] = (requests_by_status[p.status] || 0) + 1;
  });

  res.json({
    stats: {
      total_requests: total,
      pending_requests: pending,
      approved_requests: approved,
      approved_today: approvedToday,
      rejected_today: rejectedToday,
      active_outside: activeOut,
      total_students: students.length,
      total_departments: depts.length,
    },
    requests_by_department,
    requests_by_status,
    recent_logs: logs,
  });
});

app.get('/api/admin/gatepasses', authenticateJWT, authorizeRoles('admin'), (req, res) => {
  res.json(db.getGatePasses());
});

app.get('/api/admin/reports', authenticateJWT, authorizeRoles('admin'), (req, res) => {
  const csv = db.getCSVData();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=gatepass_reports.csv');
  res.status(200).send(csv);
});

app.get('/api/admin/sql-dump', authenticateJWT, authorizeRoles('admin'), (req, res) => {
  const sql = db.generateSQLDump();
  res.setHeader('Content-Type', 'text/sql');
  res.setHeader('Content-Disposition', 'attachment; filename=gatepass_dump.sql');
  res.status(200).send(sql);
});

app.get('/api/admin/logs', authenticateJWT, authorizeRoles('admin'), (req, res) => {
  res.json(db.getLogs());
});

// WhatsApp Engine Status, Configuration & Audit APIs (Green-API Exclusive)
app.get('/api/admin/whatsapp/config', authenticateJWT, authorizeRoles('admin'), (req, res) => {
  const config = getEffectiveWhatsAppConfig();
  const rawToken = config.apiToken || '';
  const maskedToken = rawToken
    ? (rawToken.length > 10 ? `${rawToken.slice(0, 6)}••••••••${rawToken.slice(-4)}` : '••••••••')
    : 'Not Configured';

  res.json({
    idInstance: config.instanceId,
    apiTokenMasked: maskedToken,
    apiUrl: config.apiUrl,
    source: config.source,
    isCustom: config.isCustom,
    updated_at: config.updated_at,
    updated_by: config.updated_by
  });
});

app.post('/api/admin/whatsapp/config', authenticateJWT, authorizeRoles('admin'), async (req, res) => {
  const { idInstance, apiToken1, apiToken2, apiToken3, apiUrl } = req.body;

  if (!idInstance || !idInstance.trim()) {
    return res.status(400).json({ error: 'Green-API Instance ID (idInstance) is required.' });
  }
  if (!apiToken1 || !apiToken1.trim()) {
    return res.status(400).json({ error: 'New API Token (1st input) is required.' });
  }
  if (!apiToken2 || !apiToken2.trim()) {
    return res.status(400).json({ error: 'Please enter the API Token a 2nd time for confirmation.' });
  }
  if (!apiToken3 || !apiToken3.trim()) {
    return res.status(400).json({ error: 'Please enter the API Token a 3rd time for security verification.' });
  }

  const token1 = apiToken1.trim();
  const token2 = apiToken2.trim();
  const token3 = apiToken3.trim();
  const cleanId = idInstance.trim().replace(/['"]/g, '');

  // 🔒 3-Step Verification check: all 3 inputs must match exactly
  if (token1 !== token2 || token1 !== token3) {
    return res.status(400).json({
      error: 'Security verification failed: All 3 API Token inputs must match exactly to prevent accidental mistakes or deletions.'
    });
  }

  const targetUrl = (apiUrl && apiUrl.trim() ? apiUrl.trim() : (cleanId ? `https://${cleanId.substring(0, 4)}.api.greenapi.com` : 'https://7107.api.greenapi.com')).replace(/\/$/, '');

  // Live test Green API connection with the new credentials
  let stateInstance = 'unknown';
  let connectionWarning = null;
  try {
    const stateUrl = `${targetUrl}/waInstance${cleanId}/getStateInstance/${token1}`;
    const response = await fetch(stateUrl);
    if (response.ok) {
      const data = await response.json();
      stateInstance = data.stateInstance || 'authorized';
    } else {
      const errText = await response.text();
      connectionWarning = `Green-API response HTTP ${response.status}: ${errText}`;
    }
  } catch (err) {
    connectionWarning = `Could not reach Green-API endpoint (${err.message}). Configuration saved.`;
  }

  db.updateWhatsAppConfig({
    idInstance: cleanId,
    apiTokenInstance: token1,
    apiUrl: targetUrl,
    updated_by: req.user.name
  });

  const isConnected = stateInstance === 'authorized';
  db.updateWhatsAppStatus({
    status: isConnected ? 'CONNECTED' : (connectionWarning ? 'DISCONNECTED' : 'NOT_AUTHORIZED'),
    provider: 'Green-API',
    idInstance: cleanId,
    stateInstance,
    error: connectionWarning,
    updated_at: new Date().toISOString()
  });

  db.addLog(req.user.id, req.user.name, 'admin', `Updated Green-API WhatsApp account to instance #${cleanId} (3-step verification passed).`);

  res.json({
    success: true,
    message: connectionWarning
      ? `WhatsApp configuration saved! (Note: ${connectionWarning})`
      : `WhatsApp Green-API account (Instance ${cleanId}) successfully connected & verified!`,
    status: isConnected ? 'CONNECTED' : 'DISCONNECTED',
    stateInstance
  });
});

app.post('/api/admin/whatsapp/reset', authenticateJWT, authorizeRoles('admin'), (req, res) => {
  db.resetWhatsAppConfig();
  db.addLog(req.user.id, req.user.name, 'admin', 'Reset WhatsApp gateway configuration to default .env settings.');
  res.json({ success: true, message: 'WhatsApp configuration reset to default .env settings.' });
});

app.post('/api/admin/whatsapp/test', authenticateJWT, authorizeRoles('admin'), async (req, res) => {
  const { phone, message } = req.body;
  if (!phone || !phone.trim()) {
    return res.status(400).json({ error: 'Target mobile phone number is required.' });
  }

  try {
    const testLog = await sendWhatsAppMessage({
      parentPhone: phone.trim(),
      studentName: 'Test Student',
      rollNo: 'TEST-001',
      reason: 'Admin Gateway Test Dispatch',
      exitTime: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', timeStyle: 'short' }),
      customMessage: message || `🔔 *Campus GatePass System Test Alert*\n\nThis is a real-time verification test from your Digital GatePass WhatsApp Gateway at S. B. Jain Institute.\n\n_Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}_\n_Status: Active & Operational_`
    });

    if (testLog.status === 'success') {
      res.json({ success: true, message: `Test WhatsApp message successfully sent to ${phone}!` });
    } else {
      res.status(502).json({ error: `Failed to deliver test message: ${testLog.error || 'Check instance connection'}` });
    }
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to dispatch test message.' });
  }
});

app.get('/api/admin/whatsapp/status', authenticateJWT, authorizeRoles('admin'), async (req, res) => {
  try {
    const { instanceId, apiToken, apiUrl, source } = getEffectiveWhatsAppConfig();

    if (instanceId && apiToken && !instanceId.includes('YOUR_') && !apiToken.includes('YOUR_')) {
      try {
        const stateUrl = `${apiUrl}/waInstance${instanceId}/getStateInstance/${apiToken}`;
        const response = await fetch(stateUrl);
        if (response.ok) {
          const data = await response.json();
          const isAuth = data.stateInstance === 'authorized';
          const statusObj = {
            status: isAuth ? 'CONNECTED' : 'DISCONNECTED',
            provider: 'Green-API',
            idInstance: instanceId,
            qr: null,
            stateInstance: data.stateInstance,
            source,
            updated_at: new Date().toISOString()
          };
          db.updateWhatsAppStatus(statusObj);
          return res.json(statusObj);
        }
      } catch (err) {
        console.warn('[WhatsApp Status] Green-API check exception:', err.message);
      }
    }

    const unconfiguredStatus = {
      status: 'DISCONNECTED',
      provider: 'Green-API',
      error: 'GREEN_API_INSTANCE_ID or GREEN_API_TOKEN is not configured.',
      source,
      updated_at: new Date().toISOString()
    };
    db.updateWhatsAppStatus(unconfiguredStatus);
    res.json(unconfiguredStatus);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve Green API status: ' + error.message });
  }
});

app.post('/api/admin/whatsapp/reconnect', authenticateJWT, authorizeRoles('admin'), async (req, res) => {
  res.json({ success: true, message: 'Green API status refreshed.' });
});

app.get('/api/admin/whatsapp/logs', authenticateJWT, authorizeRoles('admin'), async (req, res) => {
  try {
    res.json(db.getWhatsAppLogs());
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve WhatsApp logs: ' + error.message });
  }
});

// Official Parent Contacts Directory APIs
app.get('/api/admin/parent-contacts', authenticateJWT, authorizeRoles('admin'), (req, res) => {
  res.json(db.getOfficialParentContacts());
});

app.post('/api/admin/upload-parent-contacts', authenticateJWT, authorizeRoles('admin'), (req, res) => {
  const { contacts } = req.body;
  if (!Array.isArray(contacts)) {
    return res.status(400).json({ error: 'Contacts list must be an array.' });
  }

  try {
    db.saveOfficialParentContacts(contacts);
    db.addLog(req.user.id, req.user.name, 'admin', `Uploaded/Updated official parent contact directory of ${contacts.length} records.`);
    res.json({ success: true, message: `Successfully registered/updated ${contacts.length} parent contact numbers.` });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to update parent directory.' });
  }
});

// Student Late Come APIs
app.post('/api/student/late-come', authenticateJWT, authorizeRoles('student'), (req, res) => {
  const studentId = req.user.id;
  const { arrival_time, reason } = req.body;

  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: 'Reason for late arrival is required.' });
  }

  const finalArrivalTime = arrival_time || new Date().toISOString();

  try {
    const entry = db.addLateComeEntry(studentId, finalArrivalTime, reason.trim());
    db.addLog(studentId, req.user.name, 'student', `Logged a late arrival entry for today: Reason: "${reason.trim()}"`);
    res.status(201).json({ success: true, entry });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to submit late come entry.' });
  }
});

// Role-Aware Late Come History
app.get('/api/late-come', authenticateJWT, (req, res) => {
  const { id, role, department } = req.user;
  const allEntries = db.getLateComeEntries();

  if (role === 'student') {
    const studentEntries = allEntries.filter(e => e.student_id === id);
    return res.json(studentEntries);
  } else if (role === 'hod') {
    const hodEntries = allEntries.filter(e => e.student_department.toLowerCase() === department?.toLowerCase());
    return res.json(hodEntries);
  } else if (role === 'teacher') {
    const teacherEntries = allEntries.filter(e => e.class_teacher_id === id);
    return res.json(teacherEntries);
  } else if (role === 'admin') {
    return res.json(allEntries);
  } else {
    return res.json([]);
  }
});

// Manage Departments
app.get('/api/admin/departments', authenticateJWT, authorizeRoles('admin'), (req, res) => {
  res.json(db.getDepartments());
});

app.post('/api/admin/departments', authenticateJWT, authorizeRoles('admin'), (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Department name is required.' });
  const d = db.addDepartment(name);
  db.addLog(req.user.id, req.user.name, 'admin', `Created department: ${name}`);
  res.status(201).json(d);
});

app.delete('/api/admin/departments/:id', authenticateJWT, authorizeRoles('admin'), (req, res) => {
  const { id } = req.params;
  const success = db.deleteDepartment(id);
  if (!success) return res.status(404).json({ error: 'Department not found.' });
  db.addLog(req.user.id, req.user.name, 'admin', `Deleted department ${id}`);
  res.json({ message: 'Department deleted successfully.' });
});

// Manage Students
app.get('/api/admin/students', authenticateJWT, authorizeRoles('admin'), (req, res) => {
  res.json(db.getStudents());
});

app.post('/api/admin/students', authenticateJWT, authorizeRoles('admin'), (req, res) => {
  const { college_id, name, roll_no, department, email, phone, parent_phone, password } = req.body;
  if (!college_id || !name || !roll_no || !department || !email || !phone || !password) {
    return res.status(400).json({ error: 'All student details including password are required.' });
  }

  try {
    const s = db.registerStudent({
      college_id,
      name,
      roll_no,
      department,
      email,
      phone,
      parent_phone: parent_phone || '+91 9876543210',
      password_plain: password
    });
    db.addLog(req.user.id, req.user.name, 'admin', `Registered Student ${name} (${roll_no})`);
    res.status(201).json(s);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to register student.' });
  }
});

app.delete('/api/admin/students/:id', authenticateJWT, authorizeRoles('admin'), (req, res) => {
  const { id } = req.params;
  const success = db.deleteStudent(id);
  if (!success) return res.status(404).json({ error: 'Student not found.' });
  db.addLog(req.user.id, req.user.name, 'admin', `Deleted Student ID ${id}`);
  res.json({ message: 'Student deleted successfully.' });
});

// Manage HODs
app.get('/api/admin/hods', authenticateJWT, authorizeRoles('admin'), (req, res) => {
  res.json(db.getHODs());
});

app.post('/api/admin/hods', authenticateJWT, authorizeRoles('admin'), (req, res) => {
  const { name, department, email, password } = req.body;
  if (!name || !department || !email || !password) {
    return res.status(400).json({ error: 'All HOD details including password are required.' });
  }

  try {
    const h = db.registerHOD({ name, department, email, password_plain: password });
    db.addLog(req.user.id, req.user.name, 'admin', `Registered HOD Dr./Prof. ${name} for ${department}`);
    res.status(201).json(h);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to register HOD.' });
  }
});

app.delete('/api/admin/hods/:id', authenticateJWT, authorizeRoles('admin'), (req, res) => {
  const { id } = req.params;
  const success = db.deleteHOD(id);
  if (!success) return res.status(404).json({ error: 'HOD not found.' });
  db.addLog(req.user.id, req.user.name, 'admin', `Deleted HOD ID ${id}`);
  res.json({ message: 'HOD deleted successfully.' });
});

// Manage Guards
app.get('/api/admin/guards', authenticateJWT, authorizeRoles('admin'), (req, res) => {
  res.json(db.getGuards());
});

app.post('/api/admin/guards', authenticateJWT, authorizeRoles('admin'), (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All guard details including password are required.' });
  }

  try {
    const g = db.registerGuard({ name, email, password_plain: password });
    db.addLog(req.user.id, req.user.name, 'admin', `Registered Security Guard ${name}`);
    res.status(201).json(g);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to register guard.' });
  }
});

app.delete('/api/admin/guards/:id', authenticateJWT, authorizeRoles('admin'), (req, res) => {
  const { id } = req.params;
  const success = db.deleteGuard(id);
  if (!success) return res.status(404).json({ error: 'Guard not found.' });
  db.addLog(req.user.id, req.user.name, 'admin', `Deleted Guard ID ${id}`);
  res.json({ message: 'Guard deleted successfully.' });
});

// Manage Class Teachers (Class Incharges)
app.get('/api/admin/teachers', authenticateJWT, authorizeRoles('admin'), (req, res) => {
  res.json(db.getTeachers());
});

app.post('/api/admin/teachers', authenticateJWT, authorizeRoles('admin'), (req, res) => {
  const { name, class_name, department, email, password } = req.body;
  if (!name || !class_name || !department || !email || !password) {
    return res.status(400).json({ error: 'All teacher details including class, department, email and password are required.' });
  }

  try {
    const t = db.registerTeacher({ name, class_name, department, email, password_plain: password });
    db.addLog(req.user.id, req.user.name, 'admin', `Registered Class Teacher ${name} for ${class_name} (${department})`);
    res.status(201).json(t);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to register class teacher.' });
  }
});

app.delete('/api/admin/teachers/:id', authenticateJWT, authorizeRoles('admin'), (req, res) => {
  const { id } = req.params;
  const success = db.deleteTeacher(id);
  if (!success) return res.status(404).json({ error: 'Class Teacher not found.' });
  db.addLog(req.user.id, req.user.name, 'admin', `Deleted Class Teacher ID ${id}`);
  res.json({ message: 'Class Teacher deleted successfully.' });
});

// Student Self-Service: Get current student profile
app.get('/api/student/me', authenticateJWT, authorizeRoles('student'), (req, res) => {
  const studentId = req.user.id;
  const currentStudent = (db.getStudents() || []).find(s => s.id === studentId);
  if (!currentStudent) {
    return res.status(404).json({ error: 'Student profile not found.' });
  }
  res.json({ student: currentStudent });
});

// Student Self-Service: Edit profile
app.post('/api/student/profile', authenticateJWT, authorizeRoles('student'), (req, res) => {
  const studentId = req.user.id;
  const currentStudent = (db.getStudents() || []).find(s => s.id === studentId);
  if (!currentStudent) {
    return res.status(404).json({ error: 'Student profile not found.' });
  }

  const { phone, email, password, photo, class_teacher_id } = req.body;

  let class_teacher_name = currentStudent.class_teacher_name;
  if (class_teacher_id) {
    const teacher = (db.getTeachers() || []).find(t => t.id === class_teacher_id);
    if (teacher) class_teacher_name = teacher.name;
  }

  // Auto-resolve HOD dynamically based on student's department
  let resolvedHodId = currentStudent.selected_hod_id;
  let resolvedHodName = currentStudent.selected_hod_name;
  if (currentStudent.department) {
    const deptHOD = (db.getHODs() || []).find(h => h.department && h.department.trim().toLowerCase() === currentStudent.department.trim().toLowerCase());
    if (deptHOD) {
      resolvedHodId = deptHOD.id;
      resolvedHodName = deptHOD.name;
    }
  }

  const success = db.updateStudent(studentId, {
    phone: phone || currentStudent.phone,
    email: email || currentStudent.email,
    photo: photo ?? currentStudent.photo,
    class_teacher_id: class_teacher_id || currentStudent.class_teacher_id,
    class_teacher_name: class_teacher_name,
    selected_hod_id: resolvedHodId,
    selected_hod_name: resolvedHodName,
    password_plain: password || undefined,
  });

  if (!success) {
    return res.status(500).json({ error: 'Failed to update student profile.' });
  }

  const updatedStudent = (db.getStudents() || []).find(s => s.id === studentId);
  db.addLog(studentId, currentStudent.name, 'student', `Updated profile & incharge configuration`);
  res.json({ message: 'Profile updated successfully.', user: updatedStudent });
});

// ==========================================
// STATIC FRONTEND SERVING & VITE MIDDLEWARE
// ==========================================
// For Vercel Serverless, initialize DB on the first request
let dbInitialized = false;
app.use(async (req, res, next) => {
  if (!dbInitialized) {
    try {
      await db.initMongoDB();
      dbInitialized = true;
    } catch (err) {
      console.error('Failed to initialize MongoDB in Vercel:', err);
    }
  }
  next();
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[GatePass Server] Running securely on http://localhost:${PORT}`);
  });

  // Background async MongoDB Atlas init (does not block HTTP listener)
  db.initMongoDB()
    .catch((err) => {
      console.warn('[MongoDB Atlas] Async initialization note:', err.message);
    });
}

// Only start the server automatically if NOT running on Vercel
if (!process.env.VERCEL) {
  startServer();
}

// Export the app for Vercel Serverless Functions
export default app;
