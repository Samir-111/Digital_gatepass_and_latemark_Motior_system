/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Setup file paths for persistent JSON storage on server disk (local fallback/cache backup)
const DB_DIR = path.join(process.cwd(), 'database');
const DB_FILE = path.join(DB_DIR, 'gatepass.json');

/**
 * GatePass Database Controller - Firebase Firestore Integrated
 * 
 * DESIGN PATTERN (Hybrid Cache-Through):
 * This class loads and caches all collection documents in-memory at boot time
 * from Google Cloud Firestore. This keeps reads 100% synchronous and instantaneous
 * for high performance (handles 1000+ students & teachers), while synchronously
 * flushing all writes and updates to Firebase Firestore asynchronously in the background.
 * It also maintains a local disk JSON file fallback in case of connection dropouts.
 */
export class Database {
  static instance;
  firestore;
  hasExplicitCredential = false;
  otps = new Map();

  // Local active memory state
  data = {
    departments: [],
    students: [],
    hods: [],
    guards: [],
    admins: [],
    teachers: [],
    gatepasses: [],
    logs: [],
    notifications: [],
    officialParentContacts: [],
    lateComeEntries: [],
  };

  // Private constructor restricts instantiation from external modules
  constructor() {
    this.initLocalFallback();
    this.initFirebaseSDK();
  }

  /**
   * Static access method to retrieve the single active Database instance
   */
  static getInstance() {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  /**
   * Initializes local disk backup and seeding just in case
   */
  initLocalFallback() {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        this.data.teachers = this.data.teachers || [];
        this.data.notifications = this.data.notifications || [];
        this.data.officialParentContacts = this.data.officialParentContacts || [];
        this.data.lateComeEntries = this.data.lateComeEntries || [];
      } catch (err) {
        console.error('Error reading gatepass.json', err);
      }
    }
  }

  /**
   * Initializes Firebase Admin SDK using environment variables, local credentials file, or applet metadata
   */
  initFirebaseSDK() {
    let projectId = process.env.FIREBASE_PROJECT_ID || 'primordial-lambda-qk91c';
    let databaseId = process.env.FIRESTORE_DATABASE_ID || '';

    try {
      const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        if (process.env.FIREBASE_PROJECT_ID === undefined && config.projectId) {
          projectId = config.projectId;
        }
        if (process.env.FIRESTORE_DATABASE_ID === undefined && config.firestoreDatabaseId) {
          databaseId = config.firestoreDatabaseId;
        }
      }
    } catch (e) {
      console.error('Error reading firebase-applet-config.json:', e);
    }

    // Try to load service account credentials
    let credential = undefined;
    let serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    // Auto-detect common local service account filenames if environment variable not set
    if (!serviceAccountPath) {
      const possiblePaths = [
        path.join(process.cwd(), 'firebase-service-account.json'),
        path.join(process.cwd(), 'service-account.json')
      ];
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          serviceAccountPath = p;
          break;
        }
      }
    }

    if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
      try {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
        credential = cert(serviceAccount);
        this.hasExplicitCredential = true;
        if (serviceAccount.project_id && !process.env.FIREBASE_PROJECT_ID) {
          projectId = serviceAccount.project_id;
        }
        console.log(`[Firestore] Loaded service account credentials from file: ${serviceAccountPath}`);
      } catch (err) {
        console.error('[Firestore] Error loading service account credential file:', err);
      }
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        credential = cert(serviceAccount);
        this.hasExplicitCredential = true;
        if (serviceAccount.project_id && !process.env.FIREBASE_PROJECT_ID) {
          projectId = serviceAccount.project_id;
        }
        console.log('[Firestore] Loaded service account credentials from environment variable FIREBASE_SERVICE_ACCOUNT_JSON');
      } catch (err) {
        console.error('[Firestore] Error parsing FIREBASE_SERVICE_ACCOUNT_JSON:', err);
      }
    }

    const appOptions = { projectId };
    if (credential) {
      appOptions.credential = credential;
    }

    const app = getApps().length === 0 ? initializeApp(appOptions) : getApp();

    try {
      if (databaseId) {
        this.firestore = getFirestore(app, databaseId);
        console.log(`[Firestore] Initialized custom named database: ${databaseId}`);
      } else {
        this.firestore = getFirestore(app);
        console.log('[Firestore] Initialized default database');
      }
    } catch (e) {
      console.error('[Firestore] Custom database ID initialization failed, falling back to default:', e);
      this.firestore = getFirestore(app);
    }
  }

  /**
   * Asynchronously verifies if Google Cloud Application Default Credentials (ADC) are available.
   */
  async hasADC() {
    try {
      const { GoogleAuth } = await import('google-auth-library');
      const auth = new GoogleAuth();
      await auth.getApplicationDefault();
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Generates initial database records for seeding (Only admin profile is created initially).
   */
  getSeedData() {
    const depts = [];

    const salt = bcrypt.genSaltSync(10);
    const defaultHash = bcrypt.hashSync('password', salt);

    const teachers = [];
    const students = [];
    const hods = [];
    const guards = [];

    const admins = [
      {
        id: 'admin-1',
        name: 'System Administrator',
        email: 'admin@college.edu',
        password_hash: defaultHash,
      }
    ];

    const gatepasses = [];

    const logs = [
      {
        id: 'log-1',
        user_id: 'admin-1',
        user_name: 'System Administrator',
        role: 'admin',
        action: 'Database Initialized (Admin Profile Created)',
        timestamp: new Date().toISOString(),
      }
    ];

    return { depts, teachers, students, hods, guards, admins, gatepasses, logs };
  }

  /**
   * Seeds database cache locally when Firestore is bypassed or fails.
   */
  seedLocal() {
    const { depts, teachers, students, hods, guards, admins, gatepasses, logs } = this.getSeedData();

    this.data = {
      departments: depts,
      students,
      teachers,
      hods,
      guards,
      admins,
      gatepasses,
      logs,
      notifications: [],
      officialParentContacts: [],
      lateComeEntries: [],
    };

    this.saveLocal();
    console.log('[Local Database] Successfully seeded local fallback cache!');
  }

  /**
   * Checks if local database is empty and seeds it if necessary.
   */
  initLocalOnlySeed() {
    if (!this.data.admins || this.data.admins.length === 0) {
      console.log('[Local Database] Empty local database detected. Seeding initial demo profiles locally...');
      this.seedLocal();
    } else {
      console.log('[Local Database] Local database loaded successfully with', this.data.gatepasses.length, 'gate passes.');
    }
  }

  /**
   * Loads all collections from Google Cloud Firestore and caches them in memory.
   * If the cloud database is brand new and empty, it executes seeding on the cloud automatically.
   */
  async initFirestore() {
    console.log('[Firestore] Checking for Google Cloud credentials...');
    const hasCreds = this.hasExplicitCredential || await this.hasADC();

    if (!hasCreds) {
      console.warn('[Firestore] No Google Cloud credentials detected. Skipping Firestore synchronization.');
      console.log('[Firestore] Running in local-only fallback mode.');
      this.firestore = undefined;
      this.initLocalOnlySeed();
      return;
    }

    console.log('[Firestore] Synchronizing cloud database cache...');
    try {
      const deptsSnap = await this.firestore.collection('departments').get();
      const studentsSnap = await this.firestore.collection('students').get();
      const teachersSnap = await this.firestore.collection('teachers').get();
      const hodsSnap = await this.firestore.collection('hods').get();
      const guardsSnap = await this.firestore.collection('guards').get();
      const adminsSnap = await this.firestore.collection('admins').get();
      const gatepassesSnap = await this.firestore.collection('gatepasses').get();
      const logsSnap = await this.firestore.collection('logs').get();
      const notificationsSnap = await this.firestore.collection('notifications').get();
      const parentContactsSnap = await this.firestore.collection('officialParentContacts').get();
      const lateComeSnap = await this.firestore.collection('lateComeEntries').get();

      // If database is empty, seed it
      if (adminsSnap.empty) {
        console.log('[Firestore] Empty database detected. Running live cloud seed...');
        await this.seedCloud();
        return;
      }

      // Sync local memory data structures
      this.data.departments = deptsSnap.docs.map(doc => doc.data());
      this.data.students = studentsSnap.docs.map(doc => doc.data());
      this.data.teachers = teachersSnap.docs.map(doc => doc.data());
      this.data.hods = hodsSnap.docs.map(doc => doc.data());
      this.data.guards = guardsSnap.docs.map(doc => doc.data());
      this.data.admins = adminsSnap.docs.map(doc => doc.data());
      this.data.gatepasses = gatepassesSnap.docs.map(doc => doc.data());
      this.data.logs = logsSnap.docs.map(doc => doc.data());
      this.data.notifications = notificationsSnap.docs.map(doc => doc.data());
      this.data.officialParentContacts = parentContactsSnap.docs.map(doc => doc.data());
      this.data.lateComeEntries = lateComeSnap.docs.map(doc => doc.data());

      console.log('[Firestore] Synchronization completed! Total gate passes loaded:', this.data.gatepasses.length);

      // Save locally to keep backup robust
      this.saveLocal();
    } catch (err) {
      console.error('[Firestore] Initialization error. Running on local fallback cache:', err);
      this.firestore = undefined;
      this.initLocalOnlySeed();
    }
  }

  /**
   * Seeds cloud collections with initial demo profiles
   */
  async seedCloud() {
    const { depts, teachers, students, hods, guards, admins, gatepasses, logs } = this.getSeedData();

    try {
      const batch = this.firestore.batch();
      depts.forEach(d => batch.set(this.firestore.collection('departments').doc(d.id), d));
      teachers.forEach(t => batch.set(this.firestore.collection('teachers').doc(t.id), t));
      students.forEach(s => batch.set(this.firestore.collection('students').doc(s.id), s));
      hods.forEach(h => batch.set(this.firestore.collection('hods').doc(h.id), h));
      guards.forEach(g => batch.set(this.firestore.collection('guards').doc(g.id), g));
      admins.forEach(a => batch.set(this.firestore.collection('admins').doc(a.id), a));
      gatepasses.forEach(p => batch.set(this.firestore.collection('gatepasses').doc(p.id), p));
      logs.forEach(l => batch.set(this.firestore.collection('logs').doc(l.id), l));

      await batch.commit();

      this.data = {
        departments: depts,
        students,
        teachers,
        hods,
        guards,
        admins,
        gatepasses,
        logs,
        notifications: [],
        officialParentContacts: [],
        lateComeEntries: [],
      };

      this.saveLocal();
      console.log('[Firestore] Successfully seeded live college database!');
    } catch (err) {
      console.error('[Firestore] Seeding cloud error:', err);
    }
  }

  /**
   * Commits the current in-memory database records to disk fallback
   */
  saveLocal() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save local database backup:', err);
    }
  }

  /**
   * Helper to write a single document to Firestore asynchronously
   */
  saveDoc(collectionName, id, docData) {
    if (!this.firestore) return;

    // Clean up undefined properties so Firestore doesn't reject the write
    const cleanObject = (obj) => {
      if (obj === null || typeof obj !== 'object') return obj;

      if (Array.isArray(obj)) return obj.map(cleanObject);

      const cleaned = {};
      for (const key of Object.keys(obj)) {
        if (obj[key] !== undefined) {
          cleaned[key] = cleanObject(obj[key]);
        }
      }
      return cleaned;
    };

    const cleaned = cleanObject(docData);

    this.firestore.collection(collectionName).doc(id).set(cleaned).catch(err => {
      console.error(`[Firestore] Failed to save ${id} in ${collectionName}:`, err);
    });
  }

  /**
   * Helper to delete a single document from Firestore asynchronously
   */
  deleteDoc(collectionName, id) {
    if (!this.firestore) return;
    this.firestore.collection(collectionName).doc(id).delete().catch(err => {
      console.error(`[Firestore] Failed to delete ${id} in ${collectionName}:`, err);
    });
  }

  // ==========================================
  // CORE API IMPLEMENTATION
  // ==========================================

  // Auth Operations
  authenticateUser(email, password_plain) {
    if (!email) return null;
    const emailLower = email.toLowerCase().trim();

    // Check Students
    const student = this.data.students.find(s => s.email && s.email.toLowerCase().trim() === emailLower);
    if (student && bcrypt.compareSync(password_plain, student.password_hash)) {
      const { password_hash, ...rest } = student;
      return { user: rest, role: 'student' };
    }

    // Check HODs
    const hod = this.data.hods.find(h => h.email && h.email.toLowerCase().trim() === emailLower);
    if (hod && bcrypt.compareSync(password_plain, hod.password_hash)) {
      const { password_hash, ...rest } = hod;
      return { user: rest, role: 'hod' };
    }

    // Check Guards
    const guard = this.data.guards.find(g => g.email && g.email.toLowerCase().trim() === emailLower);
    if (guard && bcrypt.compareSync(password_plain, guard.password_hash)) {
      const { password_hash, ...rest } = guard;
      return { user: rest, role: 'guard' };
    }

    // Check Admins
    const admin = this.data.admins.find(a => a.email && a.email.toLowerCase().trim() === emailLower);
    if (admin && bcrypt.compareSync(password_plain, admin.password_hash)) {
      const { password_hash, ...rest } = admin;
      return { user: rest, role: 'admin' };
    }

    // Check Teachers / Class Incharges
    if (this.data.teachers) {
      const teacher = this.data.teachers.find(t => t.email && t.email.toLowerCase().trim() === emailLower);
      if (teacher && bcrypt.compareSync(password_plain, teacher.password_hash)) {
        const { password_hash, ...rest } = teacher;
        return { user: rest, role: 'teacher' };
      }
    }

    return null;
  }

  // Fetch departments
  getDepartments() {
    return this.data.departments;
  }

  addDepartment(name) {
    const id = `dept-${Date.now()}`;
    const newDept = { id, department_name: name };
    this.data.departments.push(newDept);
    this.saveLocal();
    this.saveDoc('departments', id, newDept);
    return newDept;
  }

  deleteDepartment(id) {
    const index = this.data.departments.findIndex(d => d.id === id);
    if (index !== -1) {
      this.data.departments.splice(index, 1);
      this.saveLocal();
      this.deleteDoc('departments', id);
      return true;
    }
    return false;
  }

  // Student Operations
  getOfficialParentPhone(roll_no, studentProvidedPhone) {
    if (!this.data.officialParentContacts || !roll_no) return studentProvidedPhone;
    const official = this.data.officialParentContacts.find(
      c => c.roll_no && c.roll_no.trim().toLowerCase() === roll_no.trim().toLowerCase()
    );
    return official ? official.parent_phone : studentProvidedPhone;
  }

  getStudents() {
    return this.data.students.map(({ password_hash, ...rest }) => {
      return {
        ...rest,
        parent_phone: this.getOfficialParentPhone(rest.roll_no, rest.parent_phone),
      };
    });
  }

  registerStudent(studentData) {
    const id = `stud-${Date.now()}`;
    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(studentData.password_plain, salt);

    const finalParentPhone = this.getOfficialParentPhone(studentData.roll_no, studentData.parent_phone || '+91 9876543210');

    const newStudent = {
      id,
      college_id: studentData.college_id,
      name: studentData.name,
      roll_no: studentData.roll_no,
      department: studentData.department,
      email: studentData.email,
      phone: studentData.phone,
      parent_phone: finalParentPhone,
      photo: studentData.photo || '',
      class_teacher_id: studentData.class_teacher_id,
      class_teacher_name: studentData.class_teacher_name,
      selected_hod_id: studentData.selected_hod_id,
      selected_hod_name: studentData.selected_hod_name,
      created_at: new Date().toISOString(),
      password_hash,
    };

    this.data.students.push(newStudent);
    this.saveLocal();
    this.saveDoc('students', id, newStudent);

    const { password_hash: _, ...userWithoutPassword } = newStudent;
    return userWithoutPassword;
  }

  updateStudent(id, update) {
    const index = this.data.students.findIndex(s => s.id === id);
    if (index !== -1) {
      const current = this.data.students[index];
      let hash = current.password_hash;
      if (update.password_plain) {
        const salt = bcrypt.genSaltSync(10);
        hash = bcrypt.hashSync(update.password_plain, salt);
      }

      const newRollNo = update.roll_no ?? current.roll_no;
      const proposedParentPhone = update.parent_phone ?? current.parent_phone ?? '+91 9876543210';
      const finalParentPhone = this.getOfficialParentPhone(newRollNo, proposedParentPhone);

      const updatedStudent = {
        ...current,
        name: update.name ?? current.name,
        roll_no: newRollNo,
        college_id: update.college_id ?? current.college_id,
        department: update.department ?? current.department,
        email: update.email ?? current.email,
        phone: update.phone ?? current.phone,
        parent_phone: finalParentPhone,
        photo: update.photo ?? current.photo,
        class_teacher_id: update.class_teacher_id ?? current.class_teacher_id,
        class_teacher_name: update.class_teacher_name ?? current.class_teacher_name,
        selected_hod_id: update.selected_hod_id ?? current.selected_hod_id,
        selected_hod_name: update.selected_hod_name ?? current.selected_hod_name,
        password_hash: hash,
      };

      this.data.students[index] = updatedStudent;
      this.saveLocal();
      this.saveDoc('students', id, updatedStudent);
      return true;
    }
    return false;
  }

  deleteStudent(id) {
    const index = this.data.students.findIndex(s => s.id === id);
    if (index !== -1) {
      this.data.students.splice(index, 1);
      this.saveLocal();
      this.deleteDoc('students', id);
      return true;
    }
    return false;
  }

  // HOD Operations
  getHODs() {
    return this.data.hods.map(({ password_hash, ...rest }) => rest);
  }

  registerHOD(hodData) {
    const id = `hod-${Date.now()}`;
    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(hodData.password_plain, salt);

    const newHOD = {
      id,
      name: hodData.name,
      department: hodData.department,
      email: hodData.email,
      password_hash,
    };

    this.data.hods.push(newHOD);
    this.saveLocal();
    this.saveDoc('hods', id, newHOD);

    const { password_hash: _, ...rest } = newHOD;
    return rest;
  }

  deleteHOD(id) {
    const index = this.data.hods.findIndex(h => h.id === id);
    if (index !== -1) {
      this.data.hods.splice(index, 1);
      this.saveLocal();
      this.deleteDoc('hods', id);
      return true;
    }
    return false;
  }

  // Guards Operations
  getGuards() {
    return this.data.guards.map(({ password_hash, ...rest }) => rest);
  }

  registerGuard(guardData) {
    const id = `guard-${Date.now()}`;
    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(guardData.password_plain, salt);

    const newGuard = {
      id,
      name: guardData.name,
      email: guardData.email,
      password_hash,
    };

    this.data.guards.push(newGuard);
    this.saveLocal();
    this.saveDoc('guards', id, newGuard);

    const { password_hash: _, ...rest } = newGuard;
    return rest;
  }

  deleteGuard(id) {
    const index = this.data.guards.findIndex(g => g.id === id);
    if (index !== -1) {
      this.data.guards.splice(index, 1);
      this.saveLocal();
      this.deleteDoc('guards', id);
      return true;
    }
    return false;
  }

  // GatePass Operations
  getGatePasses(filters) {
    let list = this.data.gatepasses.map(pass => {
      const student = this.data.students.find(s => s.id === pass.student_id);
      const parentPhone = student ? this.getOfficialParentPhone(student.roll_no, student.parent_phone) : 'N/A';
      return {
        ...pass,
        student_name: student?.name || 'Unknown Student',
        student_roll_no: student?.roll_no || 'N/A',
        student_department: student?.department || 'N/A',
        student_phone: student?.phone || 'N/A',
        student_parent_phone: parentPhone,
        class_teacher_id: pass.class_teacher_id || student?.class_teacher_id,
        class_teacher_name: pass.class_teacher_name || student?.class_teacher_name,
      };
    });

    if (filters) {
      if (filters.student_id) {
        list = list.filter(p => p.student_id === filters.student_id);
      }
      if (filters.department) {
        list = list.filter(p => p.student_department === filters.department);
      }
      if (filters.status) {
        list = list.filter(p => p.status === filters.status);
      }
    }

    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  getGatePassById(id) {
    const pass = this.data.gatepasses.find(p => p.id === id);
    if (!pass) return null;
    const student = this.data.students.find(s => s.id === pass.student_id);
    const parentPhone = student ? this.getOfficialParentPhone(student.roll_no, student.parent_phone) : 'N/A';
    return {
      ...pass,
      student_name: student?.name || 'Unknown Student',
      student_roll_no: student?.roll_no || 'N/A',
      student_department: student?.department || 'N/A',
      student_phone: student?.phone || 'N/A',
      student_parent_phone: parentPhone,
      class_teacher_id: pass.class_teacher_id || student?.class_teacher_id,
      class_teacher_name: pass.class_teacher_name || student?.class_teacher_name,
    };
  }

  createGatePass(studentId, data) {
    const id = `pass-${Date.now()}`;
    const token = `gp_tok_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
    const student = this.data.students.find(s => s.id === studentId);

    const newPass = {
      id,
      student_id: studentId,
      reason: data.reason,
      destination: data.destination,
      exit_time: data.exit_time,
      return_time: data.return_time,
      status: 'pending',
      token,
      selected_hod_id: data.selected_hod_id,
      selected_hod_name: data.selected_hod_name,
      class_teacher_id: student?.class_teacher_id,
      class_teacher_name: student?.class_teacher_name,
      created_at: new Date().toISOString(),
    };

    this.data.gatepasses.push(newPass);
    this.saveLocal();
    this.saveDoc('gatepasses', id, newPass);
    return this.getGatePassById(id);
  }

  updateGatePassStatus(id, status, approvedBy, remarks, qrCode) {
    const index = this.data.gatepasses.findIndex(p => p.id === id);
    if (index !== -1) {
      const current = this.data.gatepasses[index];

      const updatedPass = {
        ...current,
        status,
        approved_by: approvedBy ?? current.approved_by,
        remarks: remarks ?? current.remarks,
        qr_code: qrCode ?? current.qr_code,
      };

      this.data.gatepasses[index] = updatedPass;
      this.saveLocal();
      this.saveDoc('gatepasses', id, updatedPass);
      return this.getGatePassById(id);
    }
    return null;
  }

  markExit(id) {
    const index = this.data.gatepasses.findIndex(p => p.id === id);
    if (index !== -1) {
      const current = this.data.gatepasses[index];
      const updatedPass = {
        ...current,
        status: 'exited',
        exit_marked_at: new Date().toISOString(),
      };
      this.data.gatepasses[index] = updatedPass;
      this.saveLocal();
      this.saveDoc('gatepasses', id, updatedPass);
      return this.getGatePassById(id);
    }
    return null;
  }

  markReturn(id) {
    const index = this.data.gatepasses.findIndex(p => p.id === id);
    if (index !== -1) {
      const current = this.data.gatepasses[index];
      const updatedPass = {
        ...current,
        status: 'closed',
        return_marked_at: new Date().toISOString(),
      };
      this.data.gatepasses[index] = updatedPass;
      this.saveLocal();
      this.saveDoc('gatepasses', id, updatedPass);
      return this.getGatePassById(id);
    }
    return null;
  }

  updateStudentStatusByRollNo(rollNo, status) {
    // 1. Update in local memory state cache
    const student = this.data.students.find(
      s => s.roll_no && rollNo && s.roll_no.trim().toLowerCase() === rollNo.trim().toLowerCase()
    );
    
    // If student is found in local memory, use their actual DB ID (e.g., stud-XXXX).
    // Otherwise, fall back to the Roll Number.
    const docId = student ? student.id : rollNo;

    if (student) {
      student.status = status;
      this.saveLocal();
    }

    // 2. Update in Firebase Cloud Firestore using merge: true to avoid deleting other student fields
    if (this.firestore) {
      this.firestore.collection('students').doc(docId).set({ status }, { merge: true })
        .then(() => {
          console.log(`[Firestore] Successfully updated student ${docId} status to "${status}" (merge: true).`);
        })
        .catch(err => {
          console.error(`[Firestore] Failed to update student ${docId} status:`, err);
        });
    }
  }

  updateGatePassAIScore(id, risk_level, risk_remarks) {
    const index = this.data.gatepasses.findIndex(p => p.id === id);
    if (index !== -1) {
      this.data.gatepasses[index].risk_level = risk_level;
      this.data.gatepasses[index].risk_remarks = risk_remarks;
      this.saveLocal();
      this.saveDoc('gatepasses', id, this.data.gatepasses[index]);
    }
  }

  // Logs Operations
  getLogs() {
    return [...this.data.logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  addLog(userId, userName, role, action) {
    const log = {
      id: `log-${Date.now()}`,
      user_id: userId,
      user_name: userName,
      role,
      action,
      timestamp: new Date().toISOString(),
    };
    this.data.logs.push(log);
    this.saveLocal();
    this.saveDoc('logs', log.id, log);
  }

  // Notifications Operations
  getNotifications(userId, role, department) {
    this.data.notifications = this.data.notifications || [];
    return this.data.notifications
      .filter(n => {
        if (n.recipient_id === userId) return true;
        if (role === 'hod') {
          if (n.recipient_id === 'hod-all') return true;
          if (n.recipient_role === 'hod' && department && n.department === department) return true;
        }
        return false;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  addNotification(recipientId, recipientRole, title, message, type, referenceId, department) {
    this.data.notifications = this.data.notifications || [];
    const notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      recipient_id: recipientId,
      recipient_role: recipientRole,
      department,
      title,
      message,
      type,
      reference_id: referenceId || '',
      is_read: false,
      created_at: new Date().toISOString(),
    };
    this.data.notifications.push(notification);
    this.saveLocal();
    this.saveDoc('notifications', notification.id, notification);
    return notification;
  }

  markNotificationAsRead(id) {
    this.data.notifications = this.data.notifications || [];
    const notif = this.data.notifications.find(n => n.id === id);
    if (notif) {
      notif.is_read = true;
      this.saveLocal();
      this.saveDoc('notifications', id, notif);
      return true;
    }
    return false;
  }

  markAllNotificationsAsRead(userId, role, department) {
    this.data.notifications = this.data.notifications || [];
    let updated = false;
    this.data.notifications.forEach(n => {
      let match = false;
      if (n.recipient_id === userId) {
        match = true;
      } else if (role === 'hod') {
        if (n.recipient_id === 'hod-all') match = true;
        if (n.recipient_role === 'hod' && department && n.department === department) match = true;
      }

      if (match && !n.is_read) {
        n.is_read = true;
        updated = true;
        this.saveDoc('notifications', n.id, n);
      }
    });
    if (updated) {
      this.saveLocal();
    }
    return updated;
  }

  // Get CSV Reports Data
  getCSVData() {
    const list = this.getGatePasses();
    const headers = ['Pass ID', 'Student Name', 'Roll No', 'Department', 'Reason', 'Destination', 'Status', 'Risk Level', 'Exit Expected', 'Return Expected', 'Actual Exit', 'Actual Return', 'Approved By', 'Remarks', 'Applied At'];

    const rows = list.map(p => [
      p.id,
      p.student_name,
      p.student_roll_no,
      p.student_department,
      `"${(p.reason || '').replace(/"/g, '""')}"`,
      `"${(p.destination || '').replace(/"/g, '""')}"`,
      p.status,
      p.risk_level || 'N/A',
      p.exit_time,
      p.return_time,
      p.exit_marked_at || 'N/A',
      p.return_marked_at || 'N/A',
      p.approved_by || 'N/A',
      `"${(p.remarks || '').replace(/"/g, '""')}"`,
      p.created_at,
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  // Export SQL Script
  generateSQLDump() {
    let sql = `-- SMART DIGITAL GATE PASS SYSTEM DATABASE DUMP
-- Exported on ${new Date().toISOString()}

CREATE DATABASE IF NOT EXISTS gatepass;
USE gatepass;

-- 1. Departments Table
CREATE TABLE IF NOT EXISTS Departments (
  id VARCHAR(50) PRIMARY KEY,
  department_name VARCHAR(100) NOT NULL UNIQUE
);

-- 2. Students Table
CREATE TABLE IF NOT EXISTS Students (
  id VARCHAR(50) PRIMARY KEY,
  college_id VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  roll_no VARCHAR(50) NOT NULL UNIQUE,
  department VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  photo TEXT,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. HOD Table
CREATE TABLE IF NOT EXISTS HOD (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  department VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL
);

-- 4. Guards Table
CREATE TABLE IF NOT EXISTS Guards (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL
);

-- 5. Admins Table
CREATE TABLE IF NOT EXISTS Admins (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL
);

-- 6. GatePass Table
CREATE TABLE IF NOT EXISTS GatePass (
  id VARCHAR(50) PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL,
  reason TEXT NOT NULL,
  destination VARCHAR(255) NOT NULL,
  exit_time TIMESTAMP NOT NULL,
  return_time TIMESTAMP NOT NULL,
  status ENUM('pending', 'approved', 'rejected', 'exited', 'closed', 'cancelled') DEFAULT 'pending',
  qr_code LONGTEXT,
  approved_by VARCHAR(100),
  remarks TEXT,
  exit_marked_at TIMESTAMP NULL,
  return_marked_at TIMESTAMP NULL,
  token VARCHAR(255) UNIQUE,
  risk_level ENUM('low', 'medium', 'high'),
  risk_remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES Students(id) ON DELETE CASCADE
);

-- 7. ActivityLogs Table
CREATE TABLE IF NOT EXISTS ActivityLogs (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  user_name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL,
  action TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SEEDING SAMPLE DATA --
`;

    sql += `\n-- Seeding Departments\n`;
    this.data.departments.forEach(d => {
      sql += `INSERT INTO Departments (id, department_name) VALUES ('${d.id}', '${d.department_name.replace(/'/g, "''")}');\n`;
    });

    sql += `\n-- Seeding HODs\n`;
    this.data.hods.forEach(h => {
      sql += `INSERT INTO HOD (id, name, department, email, password_hash) VALUES ('${h.id}', '${h.name.replace(/'/g, "''")}', '${h.department.replace(/'/g, "''")}', '${h.email}', '${h.password_hash}');\n`;
    });

    sql += `\n-- Seeding Guards\n`;
    this.data.guards.forEach(g => {
      sql += `INSERT INTO Guards (id, name, email, password_hash) VALUES ('${g.id}', '${g.name.replace(/'/g, "''")}', '${g.email}', '${g.password_hash}');\n`;
    });

    sql += `\n-- Seeding Admins\n`;
    this.data.admins.forEach(a => {
      sql += `INSERT INTO Admins (id, name, email, password_hash) VALUES ('${a.id}', '${a.name.replace(/'/g, "''")}', '${a.email}', '${a.password_hash}');\n`;
    });

    sql += `\n-- Seeding Students\n`;
    this.data.students.forEach(s => {
      sql += `INSERT INTO Students (id, college_id, name, roll_no, department, email, phone, password_hash, created_at) VALUES ('${s.id}', '${s.college_id}', '${s.name.replace(/'/g, "''")}', '${s.roll_no}', '${s.department.replace(/'/g, "''")}', '${s.email}', '${s.phone}', '${s.password_hash}', '${s.created_at}');\n`;
    });

    sql += `\n-- Seeding GatePasses\n`;
    this.data.gatepasses.forEach(p => {
      const exit = p.exit_time ? `'${p.exit_time.slice(0, 19).replace('T', ' ')}'` : 'NULL';
      const ret = p.return_time ? `'${p.return_time.slice(0, 19).replace('T', ' ')}'` : 'NULL';
      const actualExit = p.exit_marked_at ? `'${p.exit_marked_at.slice(0, 19).replace('T', ' ')}'` : 'NULL';
      const actualRet = p.return_marked_at ? `'${p.return_marked_at.slice(0, 19).replace('T', ' ')}'` : 'NULL';
      const created = p.created_at ? `'${p.created_at.slice(0, 19).replace('T', ' ')}'` : 'NULL';
      const remarksVal = p.remarks ? `'${p.remarks.replace(/'/g, "''")}'` : 'NULL';
      const apprBy = p.approved_by ? `'${p.approved_by.replace(/'/g, "''")}'` : 'NULL';
      const rLvl = p.risk_level ? `'${p.risk_level}'` : 'NULL';
      const rRem = p.risk_remarks ? `'${p.risk_remarks.replace(/'/g, "''")}'` : 'NULL';
      const tokVal = p.token ? `'${p.token}'` : 'NULL';

      sql += `INSERT INTO GatePass (id, student_id, reason, destination, exit_time, return_time, status, approved_by, remarks, exit_marked_at, return_marked_at, token, risk_level, risk_remarks, created_at) VALUES ('${p.id}', '${p.student_id}', '${p.reason.replace(/'/g, "''")}', '${p.destination.replace(/'/g, "''")}', ${exit}, ${ret}, '${p.status}', ${apprBy}, ${remarksVal}, ${actualExit}, ${actualRet}, ${tokVal}, ${rLvl}, ${rRem}, ${created});\n`;
    });

    return sql;
  }

  // Official Parent Contacts Directory Operations
  getOfficialParentContacts() {
    return this.data.officialParentContacts || [];
  }

  saveOfficialParentContacts(contacts) {
    this.data.officialParentContacts = contacts;

    this.data.students.forEach(student => {
      if (student.roll_no) {
        const match = contacts.find(
          c => c.roll_no && c.roll_no.trim().toLowerCase() === student.roll_no.trim().toLowerCase()
        );
        if (match) {
          student.parent_phone = match.parent_phone;
          this.saveDoc('students', student.id, student);
        }
      }
    });

    // Save each to Firestore
    contacts.forEach(contact => {
      if (contact.roll_no) {
        const sanitizedId = contact.roll_no.replace(/[\/\\#?%]/g, '_');
        this.saveDoc('officialParentContacts', sanitizedId, contact);
      }
    });

    this.saveLocal();
  }

  // Late Come Operations
  getLateComeEntries() {
    return this.data.lateComeEntries || [];
  }

  addLateComeEntry(studentId, arrivalTime, reason) {
    const student = this.data.students.find(s => s.id === studentId);
    const entry = {
      id: `late-${Date.now()}`,
      student_id: studentId,
      student_name: student?.name || 'Unknown Student',
      student_roll_no: student?.roll_no || 'N/A',
      student_department: student?.department || 'N/A',
      class_teacher_id: student?.class_teacher_id,
      class_teacher_name: student?.class_teacher_name,
      arrival_time: arrivalTime,
      reason,
      created_at: new Date().toISOString()
    };

    this.data.lateComeEntries = this.data.lateComeEntries || [];
    this.data.lateComeEntries.push(entry);
    this.saveLocal();
    this.saveDoc('lateComeEntries', entry.id, entry);
    return entry;
  }

  // Teacher / Class Incharge Operations
  getTeachers() {
    return (this.data.teachers || []).map(({ password_hash, ...rest }) => rest);
  }

  registerTeacher(teacherData) {
    const id = `teacher-${Date.now()}`;
    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(teacherData.password_plain, salt);

    const newTeacher = {
      id,
      name: teacherData.name,
      class_name: teacherData.class_name,
      department: teacherData.department,
      email: teacherData.email,
      password_hash,
    };

    this.data.teachers = this.data.teachers || [];
    this.data.teachers.push(newTeacher);
    this.saveLocal();
    this.saveDoc('teachers', id, newTeacher);

    const { password_hash: _, ...rest } = newTeacher;
    return rest;
  }

  deleteTeacher(id) {
    if (!this.data.teachers) return false;
    const index = this.data.teachers.findIndex(t => t.id === id);
    if (index !== -1) {
      this.data.teachers.splice(index, 1);
      this.saveLocal();
      this.deleteDoc('teachers', id);
      return true;
    }
    return false;
  }

  // Find a user across all roles by email
  findUserByEmail(email) {
    if (!email) return null;
    const emailLower = email.toLowerCase().trim();

    // Check Students
    const student = this.data.students.find(s => s.email && s.email.toLowerCase().trim() === emailLower);
    if (student) return { name: student.name, email: student.email, role: 'student' };

    // Check Teachers / Class Incharges
    if (this.data.teachers) {
      const teacher = this.data.teachers.find(t => t.email && t.email.toLowerCase().trim() === emailLower);
      if (teacher) return { name: teacher.name, email: teacher.email, role: 'teacher' };
    }

    // Check HODs
    const hod = this.data.hods.find(h => h.email && h.email.toLowerCase().trim() === emailLower);
    if (hod) return { name: hod.name, email: hod.email, role: 'hod' };

    // Check Guards
    const guard = this.data.guards.find(g => g.email && g.email.toLowerCase().trim() === emailLower);
    if (guard) return { name: guard.name, email: guard.email, role: 'guard' };

    // Check Admins
    const admin = this.data.admins.find(a => a.email && a.email.toLowerCase().trim() === emailLower);
    if (admin) return { name: admin.name, email: admin.email, role: 'admin' };

    return null;
  }

  // Store generated OTP
  storeOTP(email, otp) {
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes from now
    this.otps.set(email.toLowerCase().trim(), { otp, expiresAt });
  }

  // Verify OTP
  verifyOTP(email, otp) {
    const emailKey = email.toLowerCase().trim();
    const entry = this.otps.get(emailKey);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.otps.delete(emailKey);
      return false;
    }

    if (entry.otp === otp) {
      this.otps.delete(emailKey); // Valid OTP is single use
      return true;
    }

    return false;
  }

  // Update password for any role
  updateUserPassword(email, password_plain) {
    if (!email) return false;
    const emailLower = email.toLowerCase().trim();
    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password_plain, salt);

    // Update Student
    const studentIndex = this.data.students.findIndex(s => s.email && s.email.toLowerCase().trim() === emailLower);
    if (studentIndex !== -1) {
      const student = this.data.students[studentIndex];
      student.password_hash = password_hash;
      this.saveLocal();
      this.saveDoc('students', student.id, student);
      this.addLog(student.id, student.name, 'student', 'Reset password via OTP verification');
      return true;
    }

    // Update Teacher
    if (this.data.teachers) {
      const teacherIndex = this.data.teachers.findIndex(t => t.email && t.email.toLowerCase().trim() === emailLower);
      if (teacherIndex !== -1) {
        const teacher = this.data.teachers[teacherIndex];
        teacher.password_hash = password_hash;
        this.saveLocal();
        this.saveDoc('teachers', teacher.id, teacher);
        this.addLog(teacher.id, teacher.name, 'teacher', 'Reset password via OTP verification');
        return true;
      }
    }

    // Update HOD
    const hodIndex = this.data.hods.findIndex(h => h.email && h.email.toLowerCase().trim() === emailLower);
    if (hodIndex !== -1) {
      const hod = this.data.hods[hodIndex];
      hod.password_hash = password_hash;
      this.saveLocal();
      this.saveDoc('hods', hod.id, hod);
      this.addLog(hod.id, hod.name, 'hod', 'Reset password via OTP verification');
      return true;
    }

    // Update Guard
    const guardIndex = this.data.guards.findIndex(g => g.email && g.email.toLowerCase().trim() === emailLower);
    if (guardIndex !== -1) {
      const guard = this.data.guards[guardIndex];
      guard.password_hash = password_hash;
      this.saveLocal();
      this.saveDoc('guards', guard.id, guard);
      this.addLog(guard.id, guard.name, 'guard', 'Reset password via OTP verification');
      return true;
    }

    // Update Admin
    const adminIndex = this.data.admins.findIndex(a => a.email && a.email.toLowerCase().trim() === emailLower);
    if (adminIndex !== -1) {
      const admin = this.data.admins[adminIndex];
      admin.password_hash = password_hash;
      this.saveLocal();
      this.saveDoc('admins', admin.id, admin);
      this.addLog(admin.id, admin.name, 'admin', 'Reset password via OTP verification');
      return true;
    }

    return false;
  }
}
