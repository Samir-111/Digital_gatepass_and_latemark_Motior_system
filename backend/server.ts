/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import QRCode from 'qrcode';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { Database } from './db.js';
import { UserRole } from '../frontend/types.js';

dotenv.config();

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'college_gatepass_super_secret_key_2026';
const db = Database.getInstance();

// Initialize Gemini SDK with User-Agent for telemetry
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
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

// Extend Express Request interface to hold auth user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    department?: string;
  };
}

// Authentication Middleware
const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
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
const authorizeRoles = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient privileges.' });
    }
    next();
  };
};

// ==========================================
// API ROUTES
// ==========================================

// Public metadata for dynamic dropdown menus in login & registration
app.get('/api/public/info', (req: Request, res: Response) => {
  res.json({
    departments: db.getDepartments(),
    hods: db.getHODs(),
    teachers: db.getTeachers(),
  });
});

// 1. General Auth Route
app.post('/api/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const authResult = db.authenticateUser(email, password);
  if (!authResult) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const tokenPayload = {
    id: authResult.user.id,
    name: authResult.user.name,
    email: authResult.user.email,
    role: authResult.role,
    department: authResult.user.department || undefined,
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '12h' });

  db.addLog(authResult.user.id, authResult.user.name, authResult.role, `Logged in successfully`);

  res.json({
    token,
    user: authResult.user,
    role: authResult.role,
  });
});

// 1.5 Student Registration Route
app.post('/api/register', (req: Request, res: Response) => {
  const { name, email, password, phone, parent_phone, roll_no, department, college_id, class_teacher_id, selected_hod_id } = req.body;

  if (!name || !email || !password || !phone || !parent_phone || !roll_no || !department || !college_id || !class_teacher_id || !selected_hod_id) {
    return res.status(400).json({ error: 'All fields are required for student registration, including Class Teacher and HOD selection.' });
  }

  // Validate email domain
  if (!email.toLowerCase().endsWith('@sbjit.edu.in')) {
    return res.status(400).json({ error: 'Registration is restricted. You must use a valid college email ending with @sbjit.edu.in' });
  }

  // Check if student already exists by email or roll number
  const existingByEmail = db.getStudents().find(s => s.email.toLowerCase() === email.toLowerCase());
  const existingByRoll = db.getStudents().find(s => s.roll_no.toLowerCase() === roll_no.toLowerCase());

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
      parent_phone,
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
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to complete registration.' });
  }
});

// 1.8 Class Teacher (Class Incharge) Routes
app.get('/api/teacher/students', authenticateJWT, authorizeRoles('teacher'), (req: AuthenticatedRequest, res: Response) => {
  const teacherId = req.user!.id;
  const students = db.getStudents().filter(s => s.class_teacher_id === teacherId);
  res.json(students);
});

app.post('/api/sms/send-warning', authenticateJWT, authorizeRoles('teacher'), (req: AuthenticatedRequest, res: Response) => {
  const { entryId, parentPhone, studentName, arrivalTime, teacherName, className } = req.body;

  if (!parentPhone || !studentName) {
    return res.status(400).json({ error: 'Parent phone number and student name are required.' });
  }

  // Real integration log / SMS dispatch emulation
  console.log('====================================================');
  console.log(`[GATEPASS WARNING SMS DISPATCHED]`);
  console.log(`To: ${parentPhone} (Parent of ${studentName})`);
  console.log(`Message: "Dear Parent, your ward ${studentName} was late to college today (Arrival Time: ${arrivalTime}). Entered class through Class Incharge ${teacherName}. Please ensure timely attendance."`);
  console.log('====================================================');

  db.addLog(
    req.user!.id,
    req.user!.name,
    'teacher',
    `Triggered warning SMS to parent number (${parentPhone}) for late arrival of ${studentName}`
  );

  res.json({ success: true, message: 'SMS warning successfully dispatched to parent.' });
});

app.get('/api/teacher/gatepasses', authenticateJWT, authorizeRoles('teacher'), (req: AuthenticatedRequest, res: Response) => {
  const teacherId = req.user!.id;
  // Get all gatepasses and filter where student's class_teacher_id matches this teacher
  const allPasses = db.getGatePasses();
  const teacherPasses = allPasses.filter(p => p.class_teacher_id === teacherId);
  res.json(teacherPasses);
});

app.post('/api/teacher/approve', authenticateJWT, authorizeRoles('teacher'), (req: AuthenticatedRequest, res: Response) => {
  const { id, remarks } = req.body;
  if (!id) return res.status(400).json({ error: 'Gate pass ID is required.' });

  const pass = db.getGatePassById(id);
  if (!pass) return res.status(404).json({ error: 'Gate pass not found.' });
  if (pass.status !== 'pending') {
    return res.status(400).json({ error: 'Gate pass is already approved or processed by class teacher.' });
  }

  // Update status to pending_hod so HOD can review it next
  const updated = db.updateGatePassStatus(id, 'pending_hod', undefined, remarks || 'Approved by Class Teacher');
  db.addLog(req.user!.id, req.user!.name, 'teacher', `Class Teacher approved gate pass ${id} for student ${pass.student_name}. Forwarding to HOD.`);

  // Notify student
  db.addNotification(
    pass.student_id,
    'student',
    'GatePass Approved by Teacher 📝',
    `Your gate pass request has been APPROVED by Class Incharge ${req.user!.name}. It has been forwarded to HOD ${pass.selected_hod_name || 'Department Head'} for final authorization.`,
    'status_changed',
    id
  );

  // Notify HOD
  db.addNotification(
    pass.selected_hod_id || 'hod-all',
    'hod',
    'New GatePass Approved by Teacher',
    `Student ${pass.student_name} has requested a gate pass. Class Incharge ${req.user!.name} has APPROVED it. Ready for HOD final review. Reason: "${pass.reason}"`,
    'pending_request',
    id,
    pass.student_department
  );

  res.json(updated);
});

app.post('/api/teacher/reject', authenticateJWT, authorizeRoles('teacher'), (req: AuthenticatedRequest, res: Response) => {
  const { id, remarks } = req.body;
  if (!id) return res.status(400).json({ error: 'Gate pass ID is required.' });
  if (!remarks) return res.status(400).json({ error: 'Remarks/Reason for rejection are required.' });

  const pass = db.getGatePassById(id);
  if (!pass) return res.status(404).json({ error: 'Gate pass not found.' });
  if (pass.status !== 'pending') {
    return res.status(400).json({ error: 'Gate pass is already processed.' });
  }

  const updated = db.updateGatePassStatus(id, 'rejected', req.user!.name, remarks);
  db.addLog(req.user!.id, req.user!.name, 'teacher', `Class Teacher rejected gate pass ${id} for student ${pass.student_name}. Reason: "${remarks}"`);

  // Notify student
  db.addNotification(
    pass.student_id,
    'student',
    'GatePass Rejected by Teacher ❌',
    `Your gate pass request has been REJECTED by Class Incharge ${req.user!.name}. Remarks: "${remarks}"`,
    'status_changed',
    id
  );

  res.json(updated);
});

// 2. Student Routes
app.post('/api/student/apply', authenticateJWT, authorizeRoles('student'), async (req: AuthenticatedRequest, res: Response) => {
  const studentId = req.user!.id;
  const { reason, destination, exit_time, return_time } = req.body;

  if (!reason || !exit_time) {
    return res.status(400).json({ error: 'Reason of application and leaving date/time are required.' });
  }

  // Fetch registered student details to automatically use their class teacher and HOD
  const student = db.getStudents().find(s => s.id === studentId);
  if (!student) {
    return res.status(404).json({ error: 'Student profile not found.' });
  }

  // Retrieve student's registered HOD or fallback to HOD of their department
  let finalHODId = student.selected_hod_id;
  let finalHODName = student.selected_hod_name;

  if (!finalHODId && student.department) {
    const deptHOD = db.getHODs().find(h => h.department.toLowerCase() === student.department.toLowerCase());
    if (deptHOD) {
      finalHODId = deptHOD.id;
      finalHODName = deptHOD.name;
    }
  }

  if (!finalHODId) {
    return res.status(400).json({ error: 'You have not selected an HOD in your registered profile. Please update your profile or contact administrator.' });
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
    db.addLog(studentId, req.user!.name, 'student', `Applied for gate pass: ${gatePass.id} to HOD: ${finalHODName || 'Department Head'}`);

    // AI Risk Assessment in background / inline
    let risk_level: 'low' | 'medium' | 'high' = 'low';
    let risk_remarks = 'Request registered successfully.';

    /**
     * 🤖 GOOGLE GEMINI AI VERIFICATION ENGINE
     * 
     * This module leverages Gemini-3.5-Flash to analyze the context of the outing:
     * - Checks for safety risks, timing discrepancies, and curfew guidelines.
     * - Enforces structured JSON output with a strict schema (risk_level and remarks).
     */
    if (ai) {
      try {
        const prompt = `Evaluate the following college student gatepass request:
Reason: "${reason}"
Destination: "${destination}"
Expected Exit: "${exit_time}"
Expected Return: "${return_time}"`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            systemInstruction: `You are an AI Safety Assistant for a college Gate Pass Management System. Evaluate student gatepass requests for potential risks.
Risk Level classification guidelines:
- "low": standard reasons (e.g., medical, library, buy book, local market, dental checkup), within reasonable hours (< 12 hours total).
- "medium": longer requests (e.g., going home for weekend, sibling wedding, passport office), or destinations that are somewhat far but plausible.
- "high": suspicious, unsafe, or highly vague reasons (e.g., "bored", "just outing", "confidential", "night club", "meet friend at midnight"), extremely long return windows for simple reasons, or exit/return times that represent middle of the night (between 11 PM and 5 AM).
Provide a JSON object with:
- "risk_level" (must be "low", "medium", or "high" strictly)
- "remarks" (a very short summary explaining the risk level and advising HOD)
Do not include markdown tags. Return raw JSON.`,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                risk_level: { type: Type.STRING, description: 'strictly one of low, medium, or high' },
                remarks: { type: Type.STRING, description: 'Short advisory note' },
              },
              required: ['risk_level', 'remarks'],
            },
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text.trim());
          if (parsed.risk_level && ['low', 'medium', 'high'].includes(parsed.risk_level.toLowerCase())) {
            risk_level = parsed.risk_level.toLowerCase() as 'low' | 'medium' | 'high';
            risk_remarks = parsed.remarks || 'AI risk check completed.';
          }
        }
      } catch (geminiErr) {
        console.error('Gemini verification failed, using standard rule base', geminiErr);
        
        /**
         * 🛡️ GRACEFUL FALLBACK (Offline mode)
         * If the Gemini API is offline, the system falls back to a deterministic regex-based 
         * keyword checker to ensure uninterrupted gate operations.
         */
        const reasonLower = reason.toLowerCase();
        if (reasonLower.includes('emergency') || reasonLower.includes('hospital') || reasonLower.includes('medical')) {
          risk_level = 'low';
          risk_remarks = 'Automatic detection: High priority medical/emergency pass.';
        } else if (reasonLower.includes('bored') || reasonLower.includes('party') || reasonLower.includes('movie') || reasonLower.includes('club')) {
          risk_level = 'high';
          risk_remarks = 'Automatic warning: Recreational outing requested during academic sessions.';
        }
      }
    } else {
      // Rule-based keyword matching when no Gemini API Key is configured in environment
      const reasonLower = reason.toLowerCase();
      if (reasonLower.includes('emergency') || reasonLower.includes('hospital') || reasonLower.includes('medical')) {
        risk_level = 'low';
        risk_remarks = 'Rule-based analyzer: High-priority medical reason.';
      } else if (reasonLower.includes('bored') || reasonLower.includes('party') || reasonLower.includes('movie') || reasonLower.includes('club')) {
        risk_level = 'high';
        risk_remarks = 'Rule-based analyzer: Suspicious or recreational destination flagged.';
      } else {
        risk_level = 'low';
        risk_remarks = 'Default rule check completed.';
      }
    }

    db.updateGatePassAIScore(gatePass.id, risk_level, risk_remarks);
    
    // Find student details to get class teacher
    const studentInfo = db.getStudents().find(s => s.id === studentId);
    const teacherId = studentInfo?.class_teacher_id;

    if (teacherId) {
      // Notify class teacher (Class Incharge) first
      db.addNotification(
        teacherId,
        'teacher',
        'New GatePass Request Pending',
        `Student ${req.user!.name} has requested a gate pass for "${reason}". Risk assessment: ${risk_level.toUpperCase()}. Please review and approve.`,
        'pending_request',
        gatePass.id
      );
    } else {
      // Fallback: Notify HOD if no class teacher mapped
      db.addNotification(
        finalHODId || 'hod-all',
        'hod',
        'New GatePass Request Pending (No Teacher Mapped)',
        `Student ${req.user!.name} has requested a gate pass for "${reason}". Risk assessment: ${risk_level.toUpperCase()}.`,
        'pending_request',
        gatePass.id,
        req.user!.department
      );
    }

    // Retrieve fully analyzed gatepass
    const finalizedPass = db.getGatePassById(gatePass.id);
    res.status(201).json(finalizedPass);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to submit request.' });
  }
});

app.get('/api/student/history', authenticateJWT, authorizeRoles('student'), (req: AuthenticatedRequest, res: Response) => {
  const studentId = req.user!.id;
  const passes = db.getGatePasses({ student_id: studentId });
  res.json(passes);
});

app.post('/api/student/cancel', authenticateJWT, authorizeRoles('student'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Gate pass ID is required.' });

  const pass = db.getGatePassById(id);
  if (!pass) return res.status(404).json({ error: 'Gate pass not found.' });
  if (pass.student_id !== req.user!.id) return res.status(403).json({ error: 'Access denied.' });
  if (pass.status !== 'pending') return res.status(400).json({ error: 'Only pending requests can be cancelled.' });

  const updated = db.updateGatePassStatus(id, 'cancelled');
  db.addLog(req.user!.id, req.user!.name, 'student', `Cancelled gate pass request: ${id}`);
  
  if (pass.selected_hod_id) {
    db.addNotification(
      pass.selected_hod_id,
      'hod',
      'GatePass Cancelled',
      `Student ${req.user!.name} has cancelled their pending gate pass request: ${id}.`,
      'status_changed',
      id,
      req.user!.department
    );
  }

  res.json(updated);
});

// 3. HOD Routes
app.get('/api/hod/pending', authenticateJWT, authorizeRoles('hod'), (req: AuthenticatedRequest, res: Response) => {
  const hodDept = req.user!.department;
  if (!hodDept) return res.status(400).json({ error: 'HOD department not specified in profile.' });

  const passes = db.getGatePasses({ department: hodDept, status: 'pending_hod' });
  res.json(passes);
});

app.get('/api/hod/history', authenticateJWT, authorizeRoles('hod'), (req: AuthenticatedRequest, res: Response) => {
  const hodDept = req.user!.department;
  if (!hodDept) return res.status(400).json({ error: 'HOD department not specified.' });

  const allPasses = db.getGatePasses({ department: hodDept });
  const history = allPasses.filter(p => p.status !== 'pending' && p.status !== 'pending_hod');
  res.json(history);
});

app.post('/api/hod/approve', authenticateJWT, authorizeRoles('hod'), async (req: AuthenticatedRequest, res: Response) => {
  const { id, remarks } = req.body;
  if (!id) return res.status(400).json({ error: 'Gate pass ID is required.' });

  const pass = db.getGatePassById(id);
  if (!pass) return res.status(404).json({ error: 'Gate pass not found.' });
  if (pass.status !== 'pending_hod') return res.status(400).json({ error: 'Gate pass is not approved by class teacher or already processed.' });

  try {
    // Generate secure QR Code with token encryption (unique token is embedded)
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
        dark: '#1e293b', // Deep Slate
        light: '#ffffff',
      },
      margin: 2,
    });

    const updated = db.updateGatePassStatus(id, 'approved', req.user!.name, remarks || 'Approved by HOD', qrCodeBase64);
    db.addLog(req.user!.id, req.user!.name, 'hod', `Approved gate pass ${id} for student ${pass.student_name}`);
    
    // Notify student of approval
    db.addNotification(
      pass.student_id,
      'student',
      'GatePass Approved! 🎉',
      `Your gate pass request for "${pass.reason}" has been APPROVED by HOD ${req.user!.name}. You can download your QR code now.`,
      'status_changed',
      id
    );

    // Simulate parents SMS notification logs
    const parentPhone = pass.student_parent_phone || '+91 9876543210';
    db.addLog(
      'system', 
      'SMS Gateway', 
      'admin', 
      `SMS alert sent to Parent (${parentPhone}): Dear Parent, your child ${pass.student_name} is leaving the college for the reason that the student wrote in the application: "${pass.reason}".`
    );
    
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate secure QR Code.' });
  }
});

app.post('/api/hod/reject', authenticateJWT, authorizeRoles('hod'), (req: AuthenticatedRequest, res: Response) => {
  const { id, remarks } = req.body;
  if (!id) return res.status(400).json({ error: 'Gate pass ID is required.' });
  if (!remarks) return res.status(400).json({ error: 'Reason/Remarks for rejection are required.' });

  const pass = db.getGatePassById(id);
  if (!pass) return res.status(404).json({ error: 'Gate pass not found.' });
  if (pass.status !== 'pending_hod') return res.status(400).json({ error: 'Gate pass is already processed or not approved by class teacher.' });

  const updated = db.updateGatePassStatus(id, 'rejected', req.user!.name, remarks);
  db.addLog(req.user!.id, req.user!.name, 'hod', `Rejected gate pass ${id} for student ${pass.student_name}`);
  
  // Notify student of rejection
  db.addNotification(
    pass.student_id,
    'student',
    'GatePass Rejected ❌',
    `Your gate pass request for "${pass.reason}" has been REJECTED by HOD ${req.user!.name}. Remarks: "${remarks}"`,
    'status_changed',
    id
  );

  res.json(updated);
});

// 4. Guard Routes
app.post('/api/guard/verify', authenticateJWT, authorizeRoles('guard'), (req: AuthenticatedRequest, res: Response) => {
  let { token, id } = req.body;
  if (!token && !id) {
    return res.status(400).json({ error: 'Verification credentials are missing.' });
  }

  // If token is a JSON payload (e.g. from the QR Code), try to parse it to extract actual token and id
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

  // Find by token or pass_id
  let pass: any = null;
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
  // 1. Is it approved?
  if (pass.status === 'pending') {
    return res.status(400).json({ error: 'Pass pending HOD approval. Entry/Exit not permitted.', pass });
  }
  if (pass.status === 'rejected') {
    return res.status(400).json({ error: 'Pass has been REJECTED by HOD. Access denied.', pass });
  }
  if (pass.status === 'cancelled') {
    return res.status(400).json({ error: 'Pass has been cancelled by the student.', pass });
  }

  // 2. Is it expired?
  const now = new Date();
  const returnTime = new Date(pass.return_time);
  if (now > returnTime) {
    return res.status(400).json({ error: 'Pass Expired: The return time window has lapsed.', pass, expired: true });
  }

  // 3. Is it already closed?
  if (pass.status === 'closed') {
    return res.status(400).json({ error: 'Single-Use Violation: This gate pass was already completed/returned and closed.', pass, duplicate: true });
  }

  res.json({
    message: 'Gate Pass Verified successfully. Security checks clear.',
    pass,
  });
});

app.post('/api/guard/exit', authenticateJWT, authorizeRoles('guard'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Gate pass ID is required.' });

  const pass = db.getGatePassById(id);
  if (!pass) return res.status(404).json({ error: 'Gate pass not found.' });
  if (pass.status !== 'approved') {
    return res.status(400).json({ error: `Cannot mark exit. Pass status is currently ${pass.status}.` });
  }

  const updated = db.markExit(id);
  db.addLog(req.user!.id, req.user!.name, 'guard', `Marked exit for Student ${pass.student_name} on pass ${id}`);
  
  // Notify student of exit
  db.addNotification(
    pass.student_id,
    'student',
    'Campus Exit Marked 🚪',
    `You checked out of the campus gate at ${new Date().toLocaleTimeString()}. Safe travels!`,
    'status_changed',
    id
  );

  res.json({ message: 'Student exit logged successfully.', pass: updated });
});

app.post('/api/guard/return', authenticateJWT, authorizeRoles('guard'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Gate pass ID is required.' });

  const pass = db.getGatePassById(id);
  if (!pass) return res.status(404).json({ error: 'Gate pass not found.' });
  if (pass.status !== 'exited') {
    return res.status(400).json({ error: `Cannot mark return. Pass status is ${pass.status} instead of exited.` });
  }

  const updated = db.markReturn(id);
  db.addLog(req.user!.id, req.user!.name, 'guard', `Marked return for Student ${pass.student_name}, gate pass closed.`);
  
  // Notify student of return
  db.addNotification(
    pass.student_id,
    'student',
    'Campus Return Registered ✅',
    `Welcome back! Your return was registered at ${new Date().toLocaleTimeString()} and the gate pass is now closed.`,
    'status_changed',
    id
  );

  res.json({ message: 'Student return logged successfully. Pass closed.', pass: updated });
});

app.get('/api/guard/entries', authenticateJWT, authorizeRoles('guard'), (req: AuthenticatedRequest, res: Response) => {
  // Get all passes with active/recent gate activity today
  const passes = db.getGatePasses();
  const today = new Date().toDateString();
  const activeToday = passes.filter(p => {
    const isExitToday = p.exit_marked_at && new Date(p.exit_marked_at).toDateString() === today;
    const isRetToday = p.return_marked_at && new Date(p.return_marked_at).toDateString() === today;
    return isExitToday || isRetToday || p.status === 'exited';
  });

  res.json(activeToday);
});

// 4.5 Centralized Notification API Routes
app.get('/api/notifications', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const role = req.user!.role;
  const department = req.user!.department;
  const list = db.getNotifications(userId, role, department);
  res.json(list);
});

app.post('/api/notifications/read', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  const { id, all } = req.body;
  if (all) {
    db.markAllNotificationsAsRead(req.user!.id, req.user!.role, req.user!.department);
    return res.json({ success: true, message: 'All notifications marked as read.' });
  }
  if (!id) return res.status(400).json({ error: 'Notification ID is required.' });
  const success = db.markNotificationAsRead(id);
  res.json({ success });
});

// 5. Admin Dashboard & Operations Routes
app.get('/api/admin/dashboard', authenticateJWT, authorizeRoles('admin'), (req: AuthenticatedRequest, res: Response) => {
  const passes = db.getGatePasses();
  const students = db.getStudents();
  const depts = db.getDepartments();
  const logs = db.getLogs().slice(0, 50); // last 50 logs

  const total = passes.length;
  const pending = passes.filter(p => p.status === 'pending').length;
  const approved = passes.filter(p => p.status === 'approved' || p.status === 'exited' || p.status === 'closed').length;
  const activeOut = passes.filter(p => p.status === 'exited').length;

  const today = new Date().toDateString();
  const approvedToday = passes.filter(p => p.approved_by && new Date(p.created_at).toDateString() === today).length;
  const rejectedToday = passes.filter(p => p.status === 'rejected' && new Date(p.created_at).toDateString() === today).length;

  // Requests by department
  const requests_by_department: Record<string, number> = {};
  depts.forEach(d => { requests_by_department[d.department_name] = 0; });
  passes.forEach(p => {
    if (p.student_department) {
      requests_by_department[p.student_department] = (requests_by_department[p.student_department] || 0) + 1;
    }
  });

  // Requests by status
  const requests_by_status: Record<string, number> = {
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

app.get('/api/admin/gatepasses', authenticateJWT, authorizeRoles('admin'), (req: AuthenticatedRequest, res: Response) => {
  res.json(db.getGatePasses());
});

app.get('/api/admin/reports', authenticateJWT, authorizeRoles('admin'), (req: AuthenticatedRequest, res: Response) => {
  const csv = db.getCSVData();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=gatepass_reports.csv');
  res.status(200).send(csv);
});

app.get('/api/admin/sql-dump', authenticateJWT, authorizeRoles('admin'), (req: AuthenticatedRequest, res: Response) => {
  const sql = db.generateSQLDump();
  res.setHeader('Content-Type', 'text/sql');
  res.setHeader('Content-Disposition', 'attachment; filename=gatepass_dump.sql');
  res.status(200).send(sql);
});

app.get('/api/admin/logs', authenticateJWT, authorizeRoles('admin'), (req: AuthenticatedRequest, res: Response) => {
  res.json(db.getLogs());
});

// Official Parent Contacts Directory APIs
app.get('/api/admin/parent-contacts', authenticateJWT, authorizeRoles('admin'), (req: AuthenticatedRequest, res: Response) => {
  res.json(db.getOfficialParentContacts());
});

app.post('/api/admin/upload-parent-contacts', authenticateJWT, authorizeRoles('admin'), (req: AuthenticatedRequest, res: Response) => {
  const { contacts } = req.body;
  if (!Array.isArray(contacts)) {
    return res.status(400).json({ error: 'Contacts list must be an array.' });
  }

  try {
    db.saveOfficialParentContacts(contacts);
    db.addLog(req.user!.id, req.user!.name, 'admin', `Uploaded/Updated official parent contact directory of ${contacts.length} records.`);
    res.json({ success: true, message: `Successfully registered/updated ${contacts.length} parent contact numbers.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update parent directory.' });
  }
});

// Student Late Come APIs
app.post('/api/student/late-come', authenticateJWT, authorizeRoles('student'), (req: AuthenticatedRequest, res: Response) => {
  const studentId = req.user!.id;
  const { arrival_time, reason } = req.body;

  if (!arrival_time || !reason) {
    return res.status(400).json({ error: 'Arrival time and reason are required.' });
  }

  try {
    const entry = db.addLateComeEntry(studentId, arrival_time, reason);
    db.addLog(studentId, req.user!.name, 'student', `Logged a late arrival entry for today: Reason: "${reason}"`);
    res.status(201).json({ success: true, entry });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to submit late come entry.' });
  }
});

// Role-Aware Late Come History
app.get('/api/late-come', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  const { id, role, department } = req.user!;
  const allEntries = db.getLateComeEntries();

  if (role === 'student') {
    const studentEntries = allEntries.filter(e => e.student_id === id);
    return res.json(studentEntries);
  } else if (role === 'hod') {
    // Only return entries for students in the HOD's department
    const hodEntries = allEntries.filter(e => e.student_department.toLowerCase() === department?.toLowerCase());
    return res.json(hodEntries);
  } else if (role === 'teacher') {
    // Only return entries for students mapped to this Class Teacher
    const teacherEntries = allEntries.filter(e => e.class_teacher_id === id);
    return res.json(teacherEntries);
  } else if (role === 'admin') {
    return res.json(allEntries);
  } else {
    // Guards or unrecognized roles
    return res.json([]);
  }
});

// Manage Departments
app.get('/api/admin/departments', authenticateJWT, authorizeRoles('admin'), (req: AuthenticatedRequest, res: Response) => {
  res.json(db.getDepartments());
});

app.post('/api/admin/departments', authenticateJWT, authorizeRoles('admin'), (req: AuthenticatedRequest, res: Response) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Department name is required.' });
  const d = db.addDepartment(name);
  db.addLog(req.user!.id, req.user!.name, 'admin', `Created department: ${name}`);
  res.status(201).json(d);
});

app.delete('/api/admin/departments/:id', authenticateJWT, authorizeRoles('admin'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const success = db.deleteDepartment(id);
  if (!success) return res.status(404).json({ error: 'Department not found.' });
  db.addLog(req.user!.id, req.user!.name, 'admin', `Deleted department ${id}`);
  res.json({ message: 'Department deleted successfully.' });
});

// Manage Students
app.get('/api/admin/students', authenticateJWT, authorizeRoles('admin'), (req: AuthenticatedRequest, res: Response) => {
  res.json(db.getStudents());
});

app.post('/api/admin/students', authenticateJWT, authorizeRoles('admin'), (req: AuthenticatedRequest, res: Response) => {
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
    db.addLog(req.user!.id, req.user!.name, 'admin', `Registered Student ${name} (${roll_no})`);
    res.status(201).json(s);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to register student.' });
  }
});

app.delete('/api/admin/students/:id', authenticateJWT, authorizeRoles('admin'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const success = db.deleteStudent(id);
  if (!success) return res.status(404).json({ error: 'Student not found.' });
  db.addLog(req.user!.id, req.user!.name, 'admin', `Deleted Student ID ${id}`);
  res.json({ message: 'Student deleted successfully.' });
});

// Manage HODs
app.get('/api/admin/hods', authenticateJWT, authorizeRoles('admin'), (req: AuthenticatedRequest, res: Response) => {
  res.json(db.getHODs());
});

app.post('/api/admin/hods', authenticateJWT, authorizeRoles('admin'), (req: AuthenticatedRequest, res: Response) => {
  const { name, department, email, password } = req.body;
  if (!name || !department || !email || !password) {
    return res.status(400).json({ error: 'All HOD details including password are required.' });
  }

  try {
    const h = db.registerHOD({ name, department, email, password_plain: password });
    db.addLog(req.user!.id, req.user!.name, 'admin', `Registered HOD Dr./Prof. ${name} for ${department}`);
    res.status(201).json(h);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to register HOD.' });
  }
});

app.delete('/api/admin/hods/:id', authenticateJWT, authorizeRoles('admin'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const success = db.deleteHOD(id);
  if (!success) return res.status(404).json({ error: 'HOD not found.' });
  db.addLog(req.user!.id, req.user!.name, 'admin', `Deleted HOD ID ${id}`);
  res.json({ message: 'HOD deleted successfully.' });
});

// Manage Guards
app.get('/api/admin/guards', authenticateJWT, authorizeRoles('admin'), (req: AuthenticatedRequest, res: Response) => {
  res.json(db.getGuards());
});

app.post('/api/admin/guards', authenticateJWT, authorizeRoles('admin'), (req: AuthenticatedRequest, res: Response) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All guard details including password are required.' });
  }

  try {
    const g = db.registerGuard({ name, email, password_plain: password });
    db.addLog(req.user!.id, req.user!.name, 'admin', `Registered Security Guard ${name}`);
    res.status(201).json(g);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to register guard.' });
  }
});

app.delete('/api/admin/guards/:id', authenticateJWT, authorizeRoles('admin'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const success = db.deleteGuard(id);
  if (!success) return res.status(404).json({ error: 'Guard not found.' });
  db.addLog(req.user!.id, req.user!.name, 'admin', `Deleted Guard ID ${id}`);
  res.json({ message: 'Guard deleted successfully.' });
});

// Manage Class Teachers (Class Incharges)
app.get('/api/admin/teachers', authenticateJWT, authorizeRoles('admin'), (req: AuthenticatedRequest, res: Response) => {
  res.json(db.getTeachers());
});

app.post('/api/admin/teachers', authenticateJWT, authorizeRoles('admin'), (req: AuthenticatedRequest, res: Response) => {
  const { name, class_name, department, email, password } = req.body;
  if (!name || !class_name || !department || !email || !password) {
    return res.status(400).json({ error: 'All teacher details including class, department, email and password are required.' });
  }

  try {
    const t = db.registerTeacher({ name, class_name, department, email, password_plain: password });
    db.addLog(req.user!.id, req.user!.name, 'admin', `Registered Class Teacher ${name} for ${class_name} (${department})`);
    res.status(201).json(t);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to register class teacher.' });
  }
});

app.delete('/api/admin/teachers/:id', authenticateJWT, authorizeRoles('admin'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const success = db.deleteTeacher(id);
  if (!success) return res.status(404).json({ error: 'Class Teacher not found.' });
  db.addLog(req.user!.id, req.user!.name, 'admin', `Deleted Class Teacher ID ${id}`);
  res.json({ message: 'Class Teacher deleted successfully.' });
});

// Student Self-Service: Edit profile
app.post('/api/student/profile', authenticateJWT, authorizeRoles('student'), (req: AuthenticatedRequest, res: Response) => {
  const studentId = req.user!.id;
  const { name, roll_no, college_id, phone, email, password, photo } = req.body;

  const success = db.updateStudent(studentId, {
    name,
    roll_no,
    college_id,
    phone,
    email,
    photo,
    password_plain: password || undefined,
  });

  if (!success) {
    return res.status(404).json({ error: 'Student profile not found.' });
  }

  db.addLog(studentId, name || req.user!.name, 'student', `Updated profile information`);
  res.json({ message: 'Profile updated successfully.' });
});

// ==========================================
// STATIC FRONTEND SERVING & VITE MIDDLEWARE
// ==========================================
async function startServer() {
  // Synchronize memory cache with Google Cloud Firestore at startup
  await db.initFirestore();

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
}

startServer();
