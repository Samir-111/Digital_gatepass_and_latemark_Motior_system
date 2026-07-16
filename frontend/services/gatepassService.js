/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiFetch } from '../lib/api.js';

export const gatepassService = {
  // --- Student Dashboard APIs ---
  getStudentHistory: async () => {
    return apiFetch('/api/student/history');
  },

  applyGatePass: async (payload) => {
    return apiFetch('/api/student/apply', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  cancelGatePass: async (id) => {
    return apiFetch('/api/student/cancel', {
      method: 'POST',
      body: JSON.stringify({ id }),
    });
  },

  updateStudentProfile: async (payload) => {
    return apiFetch('/api/student/profile', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  submitLateCome: async (payload) => {
    return apiFetch('/api/student/late-come', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // --- HOD Dashboard APIs ---
  getHODPendingPasses: async () => {
    return apiFetch('/api/hod/pending');
  },

  getHODHistoryPasses: async () => {
    return apiFetch('/api/hod/history');
  },

  approveGatePassHOD: async (id, remarks) => {
    return apiFetch('/api/hod/approve', {
      method: 'POST',
      body: JSON.stringify({ id, remarks }),
    });
  },

  rejectGatePassHOD: async (id, remarks) => {
    return apiFetch('/api/hod/reject', {
      method: 'POST',
      body: JSON.stringify({ id, remarks }),
    });
  },

  // --- Teacher Dashboard APIs ---
  getTeacherGatePasses: async () => {
    return apiFetch('/api/teacher/gatepasses');
  },

  getTeacherStudents: async () => {
    return apiFetch('/api/teacher/students');
  },

  approveGatePassTeacher: async (id, remarks) => {
    return apiFetch('/api/teacher/approve', {
      method: 'POST',
      body: JSON.stringify({ id, remarks }),
    });
  },

  rejectGatePassTeacher: async (id, remarks) => {
    return apiFetch('/api/teacher/reject', {
      method: 'POST',
      body: JSON.stringify({ id, remarks }),
    });
  },

  sendWarningSMS: async (payload) => {
    return apiFetch('/api/sms/send-warning', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  triggerWarningSMS: async (payload) => {
    return apiFetch('/api/teacher/warning-sms', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // --- Guard Dashboard APIs ---
  getGuardEntries: async () => {
    return apiFetch('/api/guard/entries');
  },

  verifyGatePass: async (payload) => {
    return apiFetch('/api/guard/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  markStudentExit: async (id) => {
    return apiFetch('/api/guard/exit', {
      method: 'POST',
      body: JSON.stringify({ id }),
    });
  },

  markStudentReturn: async (id) => {
    return apiFetch('/api/guard/return', {
      method: 'POST',
      body: JSON.stringify({ id }),
    });
  },

  // --- General Common APIs ---
  getLateComeEntries: async () => {
    return apiFetch('/api/late-come');
  },

  getPublicInfo: async () => {
    return apiFetch('/api/public/info');
  },

  getNotifications: async () => {
    return apiFetch('/api/notifications');
  },

  markNotificationRead: async (id, all) => {
    return apiFetch('/api/notifications/read', {
      method: 'POST',
      body: JSON.stringify({ id, all }),
    });
  },

  // --- Admin Dashboard APIs ---
  getAdminDashboard: async () => {
    return apiFetch('/api/admin/dashboard');
  },

  getAdminGatePasses: async () => {
    return apiFetch('/api/admin/gatepasses');
  },

  getAdminLogs: async () => {
    return apiFetch('/api/admin/logs');
  },

  getAdminParentContacts: async () => {
    return apiFetch('/api/admin/parent-contacts');
  },

  uploadAdminParentContacts: async (contacts) => {
    return apiFetch('/api/admin/upload-parent-contacts', {
      method: 'POST',
      body: JSON.stringify({ contacts }),
    });
  },

  getAdminDepartments: async () => {
    return apiFetch('/api/admin/departments');
  },

  addAdminDepartment: async (name) => {
    return apiFetch('/api/admin/departments', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  deleteAdminDepartment: async (id) => {
    return apiFetch(`/api/admin/departments/${id}`, {
      method: 'DELETE',
    });
  },

  getAdminStudents: async () => {
    return apiFetch('/api/admin/students');
  },

  registerAdminStudent: async (studentData) => {
    return apiFetch('/api/admin/students', {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
  },

  deleteAdminStudent: async (id) => {
    return apiFetch(`/api/admin/students/${id}`, {
      method: 'DELETE',
    });
  },

  getAdminHODs: async () => {
    return apiFetch('/api/admin/hods');
  },

  registerAdminHOD: async (hodData) => {
    return apiFetch('/api/admin/hods', {
      method: 'POST',
      body: JSON.stringify(hodData),
    });
  },

  deleteAdminHOD: async (id) => {
    return apiFetch(`/api/admin/hods/${id}`, {
      method: 'DELETE',
    });
  },

  getAdminGuards: async () => {
    return apiFetch('/api/admin/guards');
  },

  registerAdminGuard: async (guardData) => {
    return apiFetch('/api/admin/guards', {
      method: 'POST',
      body: JSON.stringify(guardData),
    });
  },

  deleteAdminGuard: async (id) => {
    return apiFetch(`/api/admin/guards/${id}`, {
      method: 'DELETE',
    });
  },

  getAdminTeachers: async () => {
    return apiFetch('/api/admin/teachers');
  },

  registerAdminTeacher: async (teacherData) => {
    return apiFetch('/api/admin/teachers', {
      method: 'POST',
      body: JSON.stringify(teacherData),
    });
  },

  deleteAdminTeacher: async (id) => {
    return apiFetch(`/api/admin/teachers/${id}`, {
      method: 'DELETE',
    });
  },

  getWhatsappStatus: async () => {
    return apiFetch('/api/admin/whatsapp/status');
  },

  getWhatsappLogs: async () => {
    return apiFetch('/api/admin/whatsapp/logs');
  },
};
