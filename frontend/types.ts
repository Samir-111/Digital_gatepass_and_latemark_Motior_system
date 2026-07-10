/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Vance GatePass Portal - TypeScript Type Declarations
 * 
 * These types define the data structures used across both the frontend and backend.
 * Separating interfaces here ensures strict type safety, prevents runtime errors,
 * and maintains clean architectural boundaries.
 */

// Core user roles in the system
export type UserRole = 'student' | 'hod' | 'guard' | 'admin' | 'teacher';

// Academic departments managed by the institution
export interface Department {
  id: string;
  department_name: string;
}

// Student record containing profile details
export interface Student {
  id: string;
  college_id: string; // Institutional Registration ID
  name: string;
  roll_no: string;    // Student Roll Number (Unique identifier)
  department: string; // Foreign link to Department Name
  email: string;
  phone: string;
  parent_phone: string; // Parent contact number for SMS updates
  photo?: string;     // Base64 Data URL for avatar
  created_at: string;
  class_teacher_id?: string; // Chosen class teacher ID
  class_teacher_name?: string; // Chosen class teacher name
  selected_hod_id?: string;    // Chosen HOD ID during registration
  selected_hod_name?: string;  // Chosen HOD name during registration
}

// Class Teacher (Class Incharge) profile
export interface Teacher {
  id: string;
  name: string;
  class_name: string; // e.g. "Third Year - CS - A"
  department: string; // Linked department name
  email: string;
}

// Head of Department profile
export interface HOD {
  id: string;
  name: string;
  department: string; // Managed department
  email: string;
}

// Security Guard profile at the campus checkpoint
export interface Guard {
  id: string;
  name: string;
  email: string;
}

// System Administrator profile
export interface Admin {
  id: string;
  name: string;
  email: string;
}

/**
 * Central GatePass Transaction Record
 * Tracks the complete lifecycle of a student's outing application
 */
export interface GatePass {
  id: string;
  student_id: string;
  student_name?: string;       // Joined from Student table for display
  student_roll_no?: string;    // Joined from Student table for display
  student_department?: string; // Joined from Student table for display
  student_phone?: string;      // Joined from Student table for display
  student_parent_phone?: string; // Joined Parent contact number
  selected_hod_id?: string;    // HOD selected by the student
  selected_hod_name?: string;  // Name of selected HOD
  class_teacher_id?: string;   // Class Teacher ID
  class_teacher_name?: string; // Class Teacher name
  reason: string;              // Student-stated reason for leaving
  destination: string;         // Outing destination address
  exit_time: string;           // Scheduled exit window
  return_time: string;         // Expected return deadline
  status: 'pending' | 'pending_hod' | 'approved' | 'rejected' | 'exited' | 'closed' | 'cancelled';
  qr_code?: string;            // Base64 QR Image representing secure token
  approved_by?: string;        // HOD who authorized the request
  remarks?: string;            // HOD approval or rejection feedback
  exit_marked_at?: string;     // Timestamp logged by Guard when exiting gate
  return_marked_at?: string;   // Timestamp logged by Guard upon returning
  token?: string;              // Cryptographically random validation secret
  risk_level?: 'low' | 'medium' | 'high'; // Gemini AI Safety Risk rating
  risk_remarks?: string;       // Gemini AI analytical feedback advisory
  created_at: string;
}

// Security activity logs tracking auditing details
export interface ActivityLog {
  id: string;
  user_id: string;
  user_name: string;
  role: UserRole;
  action: string;
  timestamp: string;
}

// In-app Notification for real-time tracking
export interface AppNotification {
  id: string;
  recipient_id: string;      // User ID (or 'hod-all' / department name for group HOD notifications)
  recipient_role: UserRole;
  department?: string;       // For department-targeted notifications (e.g. HODs of Computer Science)
  title: string;
  message: string;
  type: 'status_changed' | 'pending_request' | 'system';
  reference_id?: string;     // ID of the gate pass referenced
  is_read: boolean;
  created_at: string;
}

// Aggregate metrics computed for the System Admin Dashboard
export interface SystemStats {
  total_requests: number;
  pending_requests: number;
  approved_today: number;
  rejected_today: number;
  active_outside: number; // Students currently outside the campus boundaries
  requests_by_department: Record<string, number>;
  requests_by_status: Record<string, number>;
}

export interface OfficialParentContact {
  roll_no: string;
  parent_phone: string;
  name?: string;
}

export interface LateComeEntry {
  id: string;
  student_id: string;
  student_name: string;
  student_roll_no: string;
  student_department: string;
  class_teacher_id?: string;
  class_teacher_name?: string;
  arrival_time: string; // ISO String format
  reason: string;
  created_at: string;
}

