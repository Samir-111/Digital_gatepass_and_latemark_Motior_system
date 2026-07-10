/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiFetch } from '../lib/api.js';
import { GatePass, LateComeEntry, OfficialParentContact } from '../types.js';

export const gatepassService = {
  // --- Student Dashboard APIs ---
  getStudentHistory: async (): Promise<GatePass[]> => {
    return apiFetch('/api/student/history');
  },

  applyGatePass: async (payload: {
    reason: string;
    destination?: string;
    exit_time: string;
    return_time?: string;
  }): Promise<GatePass> => {
    return apiFetch('/api/student/apply', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  cancelGatePass: async (id: string): Promise<GatePass> => {
    return apiFetch('/api/student/cancel', {
      method: 'POST',
      body: JSON.stringify({ id }),
    });
  },

  updateStudentProfile: async (payload: {
    phone?: string;
    email?: string;
    photo?: string;
    name?: string;
    roll_no?: string;
    college_id?: string;
    password?: string;
  }): Promise<{ message: string }> => {
    return apiFetch('/api/student/profile', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  submitLateCome: async (payload: {
    arrival_time: string;
    reason: string;
  }): Promise<{ success: boolean; entry: LateComeEntry }> => {
    return apiFetch('/api/student/late-come', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // --- HOD Dashboard APIs ---
  getHODPendingPasses: async (): Promise<GatePass[]> => {
    return apiFetch('/api/hod/pending');
  },

  getHODHistoryPasses: async (): Promise<GatePass[]> => {
    return apiFetch('/api/hod/history');
  },

  approveGatePassHOD: async (id: string, remarks?: string): Promise<GatePass> => {
    return apiFetch('/api/hod/approve', {
      method: 'POST',
      body: JSON.stringify({ id, remarks }),
    });
  },

  rejectGatePassHOD: async (id: string, remarks: string): Promise<GatePass> => {
    return apiFetch('/api/hod/reject', {
      method: 'POST',
      body: JSON.stringify({ id, remarks }),
    });
  },

  // --- Teacher Dashboard APIs ---
  getTeacherGatePasses: async (): Promise<GatePass[]> => {
    return apiFetch('/api/teacher/gatepasses');
  },

  getTeacherStudents: async (): Promise<any[]> => {
    return apiFetch('/api/teacher/students');
  },

  approveGatePassTeacher: async (id: string, remarks?: string): Promise<GatePass> => {
    return apiFetch('/api/teacher/approve', {
      method: 'POST',
      body: JSON.stringify({ id, remarks }),
    });
  },

  rejectGatePassTeacher: async (id: string, remarks: string): Promise<GatePass> => {
    return apiFetch('/api/teacher/reject', {
      method: 'POST',
      body: JSON.stringify({ id, remarks }),
    });
  },

  sendWarningSMS: async (payload: {
    entryId: string;
    parentPhone: string;
    studentName: string;
    arrivalTime: string;
    teacherName: string;
    className?: string;
  }): Promise<{ success: boolean; message: string }> => {
    return apiFetch('/api/sms/send-warning', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  triggerWarningSMS: async (payload: {
    studentId: string;
    studentName: string;
    parentPhone: string;
    arrivalTime: string;
    teacherName: string;
  }): Promise<{ success: boolean; message: string }> => {
    return apiFetch('/api/teacher/warning-sms', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // --- Guard Dashboard APIs ---
  getGuardEntries: async (): Promise<GatePass[]> => {
    return apiFetch('/api/guard/entries');
  },

  verifyGatePass: async (payload: { token?: string; id?: string }): Promise<{
    message: string;
    pass: GatePass;
    expired?: boolean;
    duplicate?: boolean;
  }> => {
    return apiFetch('/api/guard/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  markStudentExit: async (id: string): Promise<{ message: string; pass: GatePass }> => {
    return apiFetch('/api/guard/exit', {
      method: 'POST',
      body: JSON.stringify({ id }),
    });
  },

  markStudentReturn: async (id: string): Promise<{ message: string; pass: GatePass }> => {
    return apiFetch('/api/guard/return', {
      method: 'POST',
      body: JSON.stringify({ id }),
    });
  },

  // --- General Common APIs ---
  getLateComeEntries: async (): Promise<LateComeEntry[]> => {
    return apiFetch('/api/late-come');
  },

  getPublicInfo: async (): Promise<{ hods: { id: string; name: string }[] }> => {
    return apiFetch('/api/public/info');
  },

  getNotifications: async (): Promise<any[]> => {
    return apiFetch('/api/notifications');
  },

  markNotificationRead: async (id?: string, all?: boolean): Promise<{ success: boolean }> => {
    return apiFetch('/api/notifications/read', {
      method: 'POST',
      body: JSON.stringify({ id, all }),
    });
  },

  // --- Admin Dashboard APIs ---
  getAdminDashboard: async (): Promise<any> => {
    return apiFetch('/api/admin/dashboard');
  },

  getAdminGatePasses: async (): Promise<GatePass[]> => {
    return apiFetch('/api/admin/gatepasses');
  },

  getAdminLogs: async (): Promise<any[]> => {
    return apiFetch('/api/admin/logs');
  },

  getAdminParentContacts: async (): Promise<OfficialParentContact[]> => {
    return apiFetch('/api/admin/parent-contacts');
  },

  uploadAdminParentContacts: async (contacts: OfficialParentContact[]): Promise<{ success: boolean; message: string }> => {
    return apiFetch('/api/admin/upload-parent-contacts', {
      method: 'POST',
      body: JSON.stringify({ contacts }),
    });
  },

  getAdminDepartments: async (): Promise<any[]> => {
    return apiFetch('/api/admin/departments');
  },

  addAdminDepartment: async (name: string): Promise<any> => {
    return apiFetch('/api/admin/departments', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  deleteAdminDepartment: async (id: string): Promise<{ message: string }> => {
    return apiFetch(`/api/admin/departments/${id}`, {
      method: 'DELETE',
    });
  },

  getAdminStudents: async (): Promise<any[]> => {
    return apiFetch('/api/admin/students');
  },

  registerAdminStudent: async (studentData: any): Promise<any> => {
    return apiFetch('/api/admin/students', {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
  },

  deleteAdminStudent: async (id: string): Promise<{ message: string }> => {
    return apiFetch(`/api/admin/students/${id}`, {
      method: 'DELETE',
    });
  },

  getAdminHODs: async (): Promise<any[]> => {
    return apiFetch('/api/admin/hods');
  },

  registerAdminHOD: async (hodData: any): Promise<any> => {
    return apiFetch('/api/admin/hods', {
      method: 'POST',
      body: JSON.stringify(hodData),
    });
  },

  deleteAdminHOD: async (id: string): Promise<{ message: string }> => {
    return apiFetch(`/api/admin/hods/${id}`, {
      method: 'DELETE',
    });
  },

  getAdminGuards: async (): Promise<any[]> => {
    return apiFetch('/api/admin/guards');
  },

  registerAdminGuard: async (guardData: any): Promise<any> => {
    return apiFetch('/api/admin/guards', {
      method: 'POST',
      body: JSON.stringify(guardData),
    });
  },

  deleteAdminGuard: async (id: string): Promise<{ message: string }> => {
    return apiFetch(`/api/admin/guards/${id}`, {
      method: 'DELETE',
    });
  },

  getAdminTeachers: async (): Promise<any[]> => {
    return apiFetch('/api/admin/teachers');
  },

  registerAdminTeacher: async (teacherData: any): Promise<any> => {
    return apiFetch('/api/admin/teachers', {
      method: 'POST',
      body: JSON.stringify(teacherData),
    });
  },

  deleteAdminTeacher: async (id: string): Promise<{ message: string }> => {
    return apiFetch(`/api/admin/teachers/${id}`, {
      method: 'DELETE',
    });
  },
};
