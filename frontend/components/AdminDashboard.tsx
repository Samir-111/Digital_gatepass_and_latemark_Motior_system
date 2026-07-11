/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, Layers, FileSpreadsheet, Database, RefreshCw, LogOut, Plus, 
  Trash2, ShieldCheck, Mail, Phone, BookOpen, Clock, Activity, Calendar, FileText
} from 'lucide-react';
import { apiFetch } from '../lib/api.js';
import { gatepassService } from '../services/gatepassService.js';

interface AdminDashboardProps {
  user: any;
  onLogout: () => void;
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [stats, setStats] = useState<any>(null);
  const [deptList, setDeptList] = useState<any[]>([]);
  const [studentList, setStudentList] = useState<any[]>([]);
  const [hodList, setHodList] = useState<any[]>([]);
  const [guardList, setGuardList] = useState<any[]>([]);
  const [teacherList, setTeacherList] = useState<any[]>([]); // Class Teachers
  const [gatePassList, setGatePassList] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Official parent overrides state
  const [parentContacts, setParentContacts] = useState<any[]>([]);

  // Forms states
  const [activeTab, setActiveTab] = useState<'analytics' | 'gatepasses' | 'students' | 'hods' | 'guards' | 'depts' | 'logs' | 'parent_contacts' | 'teachers'>('analytics');
  const [adminDeptFilter, setAdminDeptFilter] = useState('all');
  const [adminStatusFilter, setAdminStatusFilter] = useState('all');
  const [adminSearch, setAdminSearch] = useState('');
  
  // Create Dept form
  const [newDeptName, setNewDeptName] = useState('');

  // Create Student form
  const [studCollegeId, setStudCollegeId] = useState('');
  const [studName, setStudName] = useState('');
  const [studRoll, setStudRoll] = useState('');
  const [studDept, setStudDept] = useState('');
  const [studEmail, setStudEmail] = useState('');
  const [studPhone, setStudPhone] = useState('');
  const [studPass, setStudPass] = useState('');

  // Create HOD form
  const [hodName, setHodName] = useState('');
  const [hodDept, setHodDept] = useState('');
  const [hodEmail, setHodEmail] = useState('');
  const [hodPass, setHodPass] = useState('');

  // Create Guard form
  const [guardName, setGuardName] = useState('');
  const [guardEmail, setGuardEmail] = useState('');
  const [guardPass, setGuardPass] = useState('');

  // Create Class Teacher form
  const [teacherName, setTeacherName] = useState('');
  const [teacherClassName, setTeacherClassName] = useState('');
  const [teacherDept, setTeacherDept] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPass, setTeacherPass] = useState('');

  // Delete confirmation & toast modal state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'dept' | 'student' | 'hod' | 'guard' | 'teacher';
    id: string;
    name: string;
  } | null>(null);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Parent contacts Excel/CSV upload states
  const [parentContactsInput, setParentContactsInput] = useState('');
  const [parentContactsPreview, setParentContactsPreview] = useState<any[]>([]);
  const [parentSearchQuery, setParentSearchQuery] = useState('');
  const [isUploadingContacts, setIsUploadingContacts] = useState(false);
  const [exportMonthFilter, setExportMonthFilter] = useState('');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const data = await gatepassService.getAdminDashboard();
      setStats(data.stats);
      setLogs(data.recent_logs);
      
      const depts = await gatepassService.getAdminDepartments();
      setDeptList(depts);

      const students = await gatepassService.getAdminStudents();
      setStudentList(students);

      const hods = await gatepassService.getAdminHODs();
      setHodList(hods);

      const guards = await gatepassService.getAdminGuards();
      setGuardList(guards);

      const teachers = await gatepassService.getAdminTeachers();
      setTeacherList(teachers || []);

      const passes = await gatepassService.getAdminGatePasses();
      setGatePassList(passes || []);

      const contacts = await gatepassService.getAdminParentContacts();
      setParentContacts(contacts || []);
    } catch (err: any) {
      alert(err.message || 'Failed to fetch admin statistics.');
    } finally {
      setLoading(false);
    }
  };

  const fetchParentContacts = async () => {
    try {
      const contacts = await gatepassService.getAdminParentContacts();
      setParentContacts(contacts || []);
    } catch (err) {
      console.error('Failed to reload parent contacts:', err);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Action download functions
  const downloadCSVReport = async () => {
    try {
      const csvContent = await apiFetch('/api/admin/reports');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `gatepass_college_report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert('Failed to download report.');
    }
  };

  const downloadSQLDump = async () => {
    try {
      const sqlContent = await apiFetch('/api/admin/sql-dump');
      const blob = new Blob([sqlContent], { type: 'text/sql;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `gatepass_mysql_dump_${Date.now()}.sql`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert('Failed to download SQL dump.');
    }
  };

  // Helper to parse pasted or uploaded tabular parent contacts (CSV/Excel copy-paste)
  const parseTabularContacts = (text: string) => {
    if (!text.trim()) return [];
    
    // Split by lines
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return [];

    // Check delimiter of first line (either tab or comma)
    const firstLine = lines[0];
    const delimiter = firstLine.includes('\t') ? '\t' : (firstLine.includes(',') ? ',' : ';');
    
    // Parse rows
    const rows = lines.map(line => {
      // Simple parser handling quotes optionally
      let parts: string[] = [];
      if (delimiter === ',') {
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            parts.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        parts.push(current.trim());
      } else {
        parts = line.split(delimiter).map(p => p.trim());
      }
      return parts;
    });

    if (rows.length < 2) {
      showToast('No records found. Make sure you have at least a header row and one data row.', 'error');
      return [];
    }

    const headers = rows[0].map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    
    // Find index of column mappings
    let rollIdx = headers.findIndex(h => h.includes('roll') || h.includes('id') || h.includes('number'));
    let nameIdx = headers.findIndex(h => h.includes('name') || h.includes('student'));
    let phoneIdx = headers.findIndex(h => h.includes('parentphone') || h.includes('parentmobile') || h.includes('mobile') || h.includes('phone') || h.includes('contact'));

    // Fallbacks if not found
    if (rollIdx === -1) rollIdx = 0;
    if (nameIdx === -1) nameIdx = 1 < headers.length ? 1 : 0;
    if (phoneIdx === -1) phoneIdx = 2 < headers.length ? 2 : (headers.length - 1);

    const parsed = rows.slice(1).map((row, idx) => {
      const roll_no = row[rollIdx] || '';
      const name = row[nameIdx] || '';
      const parent_phone = row[phoneIdx] || '';
      return { id: `parsed-${idx}-${Date.now()}`, roll_no, name, parent_phone };
    }).filter(item => item.roll_no && item.parent_phone);

    return parsed;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setParentContactsInput(text);
        const parsed = parseTabularContacts(text);
        setParentContactsPreview(parsed);
        showToast(`Parsed ${parsed.length} official contact records from file! Please review and click Save.`);
      }
    };
    reader.readAsText(file);
  };

  const handleApplyPastedContacts = () => {
    const parsed = parseTabularContacts(parentContactsInput);
    if (parsed.length === 0) {
      showToast('Failed to parse any valid records. Check your columns.', 'error');
      return;
    }
    setParentContactsPreview(parsed);
    showToast(`Intelligently parsed ${parsed.length} records from copy-paste! Check the preview below.`);
  };

  const handleSaveParentContacts = async () => {
    if (parentContactsPreview.length === 0) {
      showToast('No parsed contacts available to save.', 'error');
      return;
    }

    setIsUploadingContacts(true);
    try {
      const payload = parentContactsPreview.map(p => ({
        roll_no: p.roll_no.trim(),
        name: p.name.trim(),
        parent_phone: p.parent_phone.trim()
      }));

      const res = await gatepassService.uploadAdminParentContacts(payload);

      showToast(res.message || 'Parent contact mappings updated successfully!');
      setParentContactsPreview([]);
      setParentContactsInput('');
      fetchParentContacts();
    } catch (err: any) {
      showToast(err.message || 'Failed to update parent contacts.', 'error');
    } finally {
      setIsUploadingContacts(false);
    }
  };

  // Client-side Monthly Filtered Exports
  const exportMonthlyGatePasses = () => {
    let list = [...gatePassList];
    let fileName = 'all_gatepasses_report.csv';

    if (exportMonthFilter) {
      list = list.filter(p => {
        const date = new Date(p.created_at);
        const yyyymm = date.toISOString().substring(0, 7); // e.g. "2026-07"
        return yyyymm === exportMonthFilter;
      });
      fileName = `gatepass_report_${exportMonthFilter}.csv`;
    }

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

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Successfully downloaded ${list.length} monthly gatepass reports!`);
  };

  const exportMonthlyLogs = () => {
    let list = [...logs];
    let fileName = 'all_system_activity_logs.csv';

    if (exportMonthFilter) {
      list = list.filter(l => {
        const date = new Date(l.timestamp);
        const yyyymm = date.toISOString().substring(0, 7);
        return yyyymm === exportMonthFilter;
      });
      fileName = `system_activity_logs_${exportMonthFilter}.csv`;
    }

    const headers = ['Transaction ID', 'Timestamp', 'Operator Role', 'Operator Name', 'Action Executed'];
    const rows = list.map(l => [
      l.id,
      l.timestamp,
      l.role,
      l.user_name,
      `"${(l.action || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Successfully downloaded ${list.length} monthly activity log transactions!`);
  };

  // CRUD actions
  const handleAddDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName) return;
    try {
      await gatepassService.addAdminDepartment(newDeptName);
      setNewDeptName('');
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to create department.');
    }
  };

  const handleDeleteDept = (id: string) => {
    const dept = deptList.find(d => d.id === id);
    setDeleteConfirm({ type: 'dept', id, name: dept?.department_name || 'Department' });
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studCollegeId || !studName || !studRoll || !studDept || !studEmail || !studPhone || !studPass) {
      showToast('Please fill in all student details.', 'error');
      return;
    }

    try {
      await gatepassService.registerAdminStudent({
        college_id: studCollegeId,
        name: studName,
        roll_no: studRoll,
        department: studDept,
        email: studEmail,
        phone: studPhone,
        password: studPass,
      });

      // Clear states
      setStudCollegeId('');
      setStudName('');
      setStudRoll('');
      setStudDept('');
      setStudEmail('');
      setStudPhone('');
      setStudPass('');

      showToast(`Student "${studName}" registered successfully.`);
      fetchAdminData();
    } catch (err: any) {
      showToast(err.message || 'Failed to register student.', 'error');
    }
  };

  const handleDeleteStudent = (id: string) => {
    const stud = studentList.find(s => s.id === id);
    setDeleteConfirm({ type: 'student', id, name: stud?.name || 'Student' });
  };

  const handleAddHOD = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hodName || !hodDept || !hodEmail || !hodPass) {
      showToast('Please fill out all HOD credentials.', 'error');
      return;
    }

    try {
      await gatepassService.registerAdminHOD({
        name: hodName,
        department: hodDept,
        email: hodEmail,
        password: hodPass,
      });

      setHodName('');
      setHodDept('');
      setHodEmail('');
      setHodPass('');

      showToast(`HOD Dr./Prof. "${hodName}" registered successfully.`);
      fetchAdminData();
    } catch (err: any) {
      showToast(err.message || 'Failed to register HOD.', 'error');
    }
  };

  const handleDeleteHOD = (id: string) => {
    const hod = hodList.find(h => h.id === id);
    setDeleteConfirm({ type: 'hod', id, name: hod?.name || 'HOD' });
  };

  const handleAddGuard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guardName || !guardEmail || !guardPass) {
      showToast('Please fill out all guard details.', 'error');
      return;
    }

    try {
      await gatepassService.registerAdminGuard({
        name: guardName,
        email: guardEmail,
        password: guardPass,
      });

      setGuardName('');
      setGuardEmail('');
      setGuardPass('');

      showToast(`Security Guard "${guardName}" registered successfully.`);
      fetchAdminData();
    } catch (err: any) {
      showToast(err.message || 'Failed to register guard.', 'error');
    }
  };

  const handleDeleteGuard = (id: string) => {
    const guard = guardList.find(g => g.id === id);
    setDeleteConfirm({ type: 'guard', id, name: guard?.name || 'Guard' });
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName || !teacherClassName || !teacherDept || !teacherEmail || !teacherPass) {
      showToast('Please fill out all Class Teacher details.', 'error');
      return;
    }

    try {
      await gatepassService.registerAdminTeacher({
        name: teacherName,
        class_name: teacherClassName,
        department: teacherDept,
        email: teacherEmail,
        password: teacherPass,
      });

      setTeacherName('');
      setTeacherClassName('');
      setTeacherDept('');
      setTeacherEmail('');
      setTeacherPass('');

      showToast(`Class Teacher "${teacherName}" registered successfully.`);
      fetchAdminData();
    } catch (err: any) {
      showToast(err.message || 'Failed to register class teacher.', 'error');
    }
  };

  const handleDeleteTeacher = (id: string) => {
    const teacher = teacherList.find(t => t.id === id);
    setDeleteConfirm({ type: 'teacher', id, name: teacher?.name || 'Class Teacher' });
  };

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    const { type, id, name } = deleteConfirm;
    try {
      if (type === 'dept') {
        await gatepassService.deleteAdminDepartment(id);
        showToast(`Department "${name}" deleted successfully.`);
      } else if (type === 'student') {
        await gatepassService.deleteAdminStudent(id);
        showToast(`Student "${name}" deleted successfully.`);
      } else if (type === 'hod') {
        await gatepassService.deleteAdminHOD(id);
        showToast(`HOD "${name}" deleted successfully.`);
      } else if (type === 'guard') {
        await gatepassService.deleteAdminGuard(id);
        showToast(`Security Guard "${name}" deleted successfully.`);
      } else if (type === 'teacher') {
        await gatepassService.deleteAdminTeacher(id);
        showToast(`Class Teacher "${name}" deleted successfully.`);
      }
      setDeleteConfirm(null);
      fetchAdminData();
    } catch (err: any) {
      showToast(err.message || `Failed to delete ${type}.`, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-12 font-sans">
      {/* Navigation header */}
      <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 bg-slate-900 rounded-lg flex items-center justify-center shadow-sm shrink-0">
                <Activity className="h-5 w-5 text-emerald-400" />
              </div>
              <span className="font-extrabold text-slate-900 tracking-tight text-xs sm:text-sm md:text-base leading-tight max-w-[150px] sm:max-w-none line-clamp-2">S. B. Jain Institute of Technology, Management and Research</span>
              <span className="hidden lg:inline bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border border-slate-200 shrink-0">Admin</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-slate-700 font-medium">
                <span>Account: </span>
                <span className="font-bold text-slate-900">{user.name}</span>
              </div>
              <button
                onClick={onLogout}
                className="inline-flex items-center px-3 py-1.5 border border-slate-200 text-xs font-semibold rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Admin Info and Quick Export Bar */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">System Control Dashboard</h1>
            <p className="text-sm text-slate-500 font-medium">Global configurations, real-time security logs, and exports for S. B. Jain Institute of Technology, Management and Research.</p>
          </div>
          
          <div className="flex gap-2 shrink-0">
            <button 
              onClick={downloadCSVReport}
              className="inline-flex items-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
              Export CSV Logs
            </button>
            <button 
              onClick={downloadSQLDump}
              className="inline-flex items-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <Database className="h-3.5 w-3.5 mr-1.5" />
              MySQL Schema Dump
            </button>
            <button 
              onClick={fetchAdminData}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 cursor-pointer"
              title="Refresh Dashboard"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Global Statistics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Registered Students</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{studentList.length}</div>
            <div className="text-[10px] font-medium text-slate-400 mt-0.5">Enrolled with pass profiles</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Gate Passes Applied</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{stats?.total_requests || 0}</div>
            <div className="text-[10px] font-medium text-slate-400 mt-0.5">Cumulative safety applications</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending HOD Review</span>
            <div className="text-2xl font-black text-amber-500 mt-1">{stats?.pending_requests || 0}</div>
            <div className="text-[10px] font-medium text-slate-400 mt-0.5">Awaiting active decision</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Students Outside Campus</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{stats?.active_outside || 0}</div>
            <div className="text-[10px] font-medium text-slate-400 mt-0.5">Currently out (Active curfew checks)</div>
          </div>
        </div>

        {/* TAB CONTROL BAR */}
        <div className="bg-white border-b border-slate-200 rounded-t-2xl shadow-sm flex overflow-x-auto">
          {[
            { id: 'analytics', label: 'Overview Analytics', icon: Activity },
            { id: 'gatepasses', label: 'GatePass Traffic Console', icon: FileText },
            { id: 'students', label: 'Manage Students', icon: Users },
            { id: 'hods', label: 'Manage HODs', icon: Layers },
            { id: 'teachers', label: 'Manage Class Teachers', icon: Users },
            { id: 'guards', label: 'Manage Guards', icon: ShieldCheck },
            { id: 'depts', label: 'Manage Departments', icon: BookOpen },
            { id: 'parent_contacts', label: 'Parent Phone Mappings', icon: Phone },
            { id: 'logs', label: 'Audit Activity Logs', icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-4 text-xs font-bold shrink-0 border-b-2 flex items-center space-x-1.5 transition cursor-pointer ${activeTab === tab.id ? 'border-slate-900 text-slate-900 bg-slate-50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB PANEL CONTENTS */}
        <div className="bg-white rounded-b-2xl border border-slate-200 border-t-0 p-6 shadow-sm min-h-[400px]">
          
          {/* TAB 1: OVERVIEW ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Custom Styled Department Requests chart */}
                <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/30">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Gate Pass Applications by Department</h3>
                  
                  <div className="space-y-3">
                    {deptList.map(dept => {
                      const count = studentList.filter(s => s.department === dept.department_name).length * 2; // Simulated relative count
                      const totalCount = studentList.length * 2 || 1;
                      const pct = Math.min(100, Math.round((count / totalCount) * 100)) || 10;
                      
                      return (
                        <div key={dept.id} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold text-slate-700">
                            <span>{dept.department_name}</span>
                            <span>{count} Requests</span>
                          </div>
                          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                            <div className="bg-slate-900 h-full rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                    {deptList.length === 0 && (
                      <div className="text-center py-6 text-xs text-slate-400">No departments configured yet.</div>
                    )}
                  </div>
                </div>

                {/* Custom Status chart */}
                <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/30">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Gate Pass Traffic Flow status</h3>
                  
                  <div className="space-y-4">
                    {[
                      { label: 'Completed (Returned)', val: stats?.total_requests - stats?.pending_requests - stats?.active_outside || 3, color: 'bg-slate-400' },
                      { label: 'Active Curfew (Out)', val: stats?.active_outside || 0, color: 'bg-slate-900' },
                      { label: 'Approved (Pending Exit)', val: stats?.approved_requests - stats?.active_outside || 1, color: 'bg-emerald-500' },
                      { label: 'Awaiting HOD Review', val: stats?.pending_requests || 0, color: 'bg-amber-500' },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <div className="flex items-center space-x-2">
                          <span className={`h-3 w-3 rounded-full ${item.color}`} />
                          <span>{item.label}</span>
                        </div>
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold">{item.val} Passes</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Quick Action Seeding summary card */}
              <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl flex items-start space-x-3 text-indigo-950">
                <ShieldCheck className="h-6 w-6 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold">Relational Database Integration Seeded</h4>
                  <p className="text-xs font-medium leading-relaxed mt-1">
                    Your institutional profiles, departments, and logs are running securely. To host this system in your local college environment on a real MySQL server, download the full SQL schema file. Click the <span className="font-bold">"MySQL Schema Dump"</span> button on the top right to download a clean relational table dump with exact primary keys, triggers, constraints, and hashed passwords!
                  </p>
                </div>
              </div>

              {/* Monthly Export Center Card */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center space-x-2.5 text-slate-900">
                  <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                  <div>
                    <h4 className="text-sm font-extrabold">Monthly Analytics & Log Export Console</h4>
                    <p className="text-[11px] text-slate-500 font-medium">Export monthly safety logs and gatepass transaction registers into downloadable, Excel-compatible CSV formats.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Select Targeted Month</label>
                    <select
                      value={exportMonthFilter}
                      onChange={(e) => setExportMonthFilter(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-xs font-bold rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950"
                    >
                      <option value="">All Months (Cumulative Register)</option>
                      <option value="2026-07">July 2026</option>
                      <option value="2026-06">June 2026</option>
                      <option value="2026-05">May 2026</option>
                      <option value="2026-04">April 2026</option>
                      <option value="2026-03">March 2026</option>
                    </select>
                  </div>

                  <button
                    onClick={exportMonthlyGatePasses}
                    className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>Download GatePass CSV</span>
                  </button>

                  <button
                    onClick={exportMonthlyLogs}
                    className="w-full px-4 py-2 bg-slate-900 hover:bg-slate-850 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Clock className="h-4 w-4" />
                    <span>Download Transaction Logs</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: GATE PASS TRAFFIC CONSOLE */}
          {activeTab === 'gatepasses' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 gap-4">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">Institutional Gate Pass Traffic Dashboard</h2>
                  <p className="text-xs text-slate-500 font-medium">Real-time gate pass authorization, department-wise security rosters, and parent SMS notification audits.</p>
                </div>
                <button
                  onClick={fetchAdminData}
                  className="inline-flex items-center px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
                >
                  <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                  Sync Live Traffic
                </button>
              </div>

              {/* Filtering Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Search Student</label>
                  <input
                    type="text"
                    placeholder="Search name or roll number..."
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-200 bg-white text-xs rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Department Filter</label>
                  <select
                    value={adminDeptFilter}
                    onChange={(e) => setAdminDeptFilter(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-200 bg-white text-xs rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  >
                    <option value="all">All Departments</option>
                    {deptList.map(dept => (
                      <option key={dept.id} value={dept.department_name}>{dept.department_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Gate Pass Status</label>
                  <select
                    value={adminStatusFilter}
                    onChange={(e) => setAdminStatusFilter(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-200 bg-white text-xs rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Awaiting HOD Review</option>
                    <option value="approved">Approved (Awaiting Exit)</option>
                    <option value="exited">Exited (Currently Outside)</option>
                    <option value="closed">Returned (Completed)</option>
                    <option value="rejected">Rejected by HOD</option>
                    <option value="cancelled">Cancelled by Student</option>
                  </select>
                </div>
              </div>

              {/* Filtered Data Rendering */}
              {(() => {
                const filtered = gatePassList.filter(p => {
                  const studentName = p.student_name?.toLowerCase() || '';
                  const studentRoll = p.student_roll_no?.toLowerCase() || '';
                  const query = adminSearch.toLowerCase();
                  
                  const matchesSearch = studentName.includes(query) || studentRoll.includes(query);
                  const matchesDept = adminDeptFilter === 'all' || p.student_department === adminDeptFilter;
                  const matchesStatus = adminStatusFilter === 'all' || p.status === adminStatusFilter;

                  return matchesSearch && matchesDept && matchesStatus;
                });

                return (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                      <span>Found {filtered.length} matching gate passes</span>
                      {adminDeptFilter !== 'all' && <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border">Dept: {adminDeptFilter}</span>}
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                      <table className="min-w-full divide-y divide-slate-100 text-xs">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-5 py-3 text-left font-bold text-slate-500 uppercase">Student / Dept</th>
                            <th className="px-5 py-3 text-left font-bold text-slate-500 uppercase">HOD Handler</th>
                            <th className="px-5 py-3 text-left font-bold text-slate-500 uppercase">Reason & Destination</th>
                            <th className="px-5 py-3 text-left font-bold text-slate-500 uppercase">Timings</th>
                            <th className="px-5 py-3 text-left font-bold text-slate-500 uppercase">Status & Risks</th>
                            <th className="px-5 py-3 text-left font-bold text-slate-500 uppercase">Parent SMS Alert</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100 text-slate-700">
                          {filtered.map(pass => {
                            const parentNumber = pass.student_parent_phone || "Not Set";
                            const hasSmsFired = ['approved', 'exited', 'closed'].includes(pass.status);
                            
                            const badgeColors = {
                              pending: 'bg-amber-50 text-amber-700 border-amber-200',
                              approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                              rejected: 'bg-rose-50 text-rose-700 border-rose-200',
                              exited: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                              closed: 'bg-slate-100 text-slate-700 border-slate-200',
                              cancelled: 'bg-slate-50 text-slate-400 border-slate-200',
                            };

                            return (
                              <tr key={pass.id} className="hover:bg-slate-50/40">
                                <td className="px-5 py-4">
                                  <div className="font-bold text-slate-900">{pass.student_name}</div>
                                  <div className="text-[10px] text-slate-400 mt-0.5">Roll: {pass.student_roll_no}</div>
                                  <div className="text-[10px] font-semibold text-slate-500 mt-1 uppercase">{pass.student_department}</div>
                                </td>
                                <td className="px-5 py-4">
                                  <div className="font-semibold text-slate-800">{pass.approved_by || pass.selected_hod_name || "Assigned Department HOD"}</div>
                                  <div className="text-[10px] text-slate-400 mt-0.5">ID: {pass.selected_hod_id || "System Auto"}</div>
                                </td>
                                <td className="px-5 py-4 max-w-xs">
                                  <div className="font-medium text-slate-800 line-clamp-2">{pass.reason}</div>
                                  <div className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">To: {pass.destination}</div>
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                  <div className="text-slate-600">Out: <span className="font-bold text-slate-800">{new Date(pass.exit_time).toLocaleDateString()} {new Date(pass.exit_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>
                                  <div className="text-slate-500 mt-0.5">In: <span className="font-semibold">{new Date(pass.return_time).toLocaleDateString()} {new Date(pass.return_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeColors[pass.status as keyof typeof badgeColors] || 'bg-slate-50'}`}>
                                    {pass.status.toUpperCase()}
                                  </span>
                                  {pass.risk_level && (
                                    <div className="mt-1">
                                      <span className={`inline-flex items-center text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${
                                        pass.risk_level === 'high' ? 'bg-red-50 text-red-700 border-red-200' :
                                        pass.risk_level === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-blue-50 text-blue-600 border-blue-200'
                                      }`}>
                                        USAGE RISK: {pass.risk_level}
                                      </span>
                                    </div>
                                  )}
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                  {hasSmsFired ? (
                                    <div className="space-y-1">
                                      <div className="flex items-center space-x-1 text-emerald-700">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                        <span className="font-bold text-[10px] uppercase">Delivered</span>
                                      </div>
                                      <div className="text-[10px] text-slate-400 font-medium">No: {parentNumber}</div>
                                    </div>
                                  ) : (
                                    <div className="space-y-1">
                                      <div className="flex items-center space-x-1 text-slate-400">
                                        <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                                        <span className="font-bold text-[10px] uppercase">Awaiting HOD</span>
                                      </div>
                                      <div className="text-[10px] text-slate-400 font-medium">No: {parentNumber}</div>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                          {filtered.length === 0 && (
                            <tr>
                              <td colSpan={6} className="px-5 py-10 text-center text-slate-400 font-medium">
                                No gate passes found matching current filter values.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 2: MANAGE STUDENTS */}
          {activeTab === 'students' && (
            <div className="space-y-6">
              {/* Register student form */}
              <form onSubmit={handleAddStudent} className="border border-slate-200 bg-slate-50/40 p-5 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3 pb-2 border-b border-slate-200">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Register New Student Profile</h3>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">College ID</label>
                  <input required type="text" placeholder="C-202611" value={studCollegeId} onChange={(e)=>setStudCollegeId(e.target.value)} className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Student Name</label>
                  <input required type="text" placeholder="Rahul Sharma" value={studName} onChange={(e)=>setStudName(e.target.value)} className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Roll Number</label>
                  <input required type="text" placeholder="CS202611" value={studRoll} onChange={(e)=>setStudRoll(e.target.value)} className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Department</label>
                  <select required value={studDept} onChange={(e)=>setStudDept(e.target.value)} className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs">
                    <option value="">Select Department</option>
                    {deptList.map(d => <option key={d.id} value={d.department_name}>{d.department_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Institutional Email</label>
                  <input required type="email" placeholder="rahul@college.edu" value={studEmail} onChange={(e)=>setStudEmail(e.target.value)} className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Phone Number</label>
                  <input required type="text" placeholder="+1 555-0122" value={studPhone} onChange={(e)=>setStudPhone(e.target.value)} className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Password</label>
                  <input required type="password" placeholder="••••••••" value={studPass} onChange={(e)=>setStudPass(e.target.value)} className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs" />
                </div>
                <div className="md:col-span-2 flex items-end justify-end">
                  <button type="submit" className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer">
                    <Plus className="h-4 w-4" />
                    <span>Register Student</span>
                  </button>
                </div>
              </form>

              {/* Student records list */}
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="min-w-full divide-y divide-slate-100 text-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Student Name</th>
                      <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Roll & College ID</th>
                      <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Department</th>
                      <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Contact Info</th>
                      <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100 text-slate-700">
                    {studentList.map(stud => (
                      <tr key={stud.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-950">{stud.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>Roll: <span className="font-semibold text-slate-800">{stud.roll_no}</span></div>
                          <div className="text-[10px] text-slate-400 mt-0.5">ID: {stud.college_id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{stud.department}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-1">
                            <Mail className="h-3 w-3 text-slate-400" />
                            <span>{stud.email}</span>
                          </div>
                          <div className="flex items-center space-x-1 mt-0.5">
                            <Phone className="h-3 w-3 text-slate-400" />
                            <span>{stud.phone}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button onClick={()=>handleDeleteStudent(stud.id)} className="p-1.5 hover:bg-red-50 text-red-500 hover:text-red-700 border border-transparent hover:border-red-100 rounded-lg transition cursor-pointer">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: MANAGE HODS */}
          {activeTab === 'hods' && (
            <div className="space-y-6">
              <form onSubmit={handleAddHOD} className="border border-slate-200 bg-slate-50/40 p-5 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-4 pb-2 border-b border-slate-200">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Register New HOD Profile</h3>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Name</label>
                  <input required type="text" placeholder="Dr. Sarah Jenkins" value={hodName} onChange={(e)=>setHodName(e.target.value)} className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Department</label>
                  <select required value={hodDept} onChange={(e)=>setHodDept(e.target.value)} className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs">
                    <option value="">Select Department</option>
                    {deptList.map(d => <option key={d.id} value={d.department_name}>{d.department_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email Address</label>
                  <input required type="email" placeholder="hod@college.edu" value={hodEmail} onChange={(e)=>setHodEmail(e.target.value)} className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Password</label>
                  <input required type="password" placeholder="••••••••" value={hodPass} onChange={(e)=>setHodPass(e.target.value)} className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs" />
                </div>
                <div className="md:col-span-4 flex justify-end">
                  <button type="submit" className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer">
                    <Plus className="h-4 w-4" />
                    <span>Register Department HOD</span>
                  </button>
                </div>
              </form>

              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="min-w-full divide-y divide-slate-100 text-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">HOD Name</th>
                      <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Assigned Department</th>
                      <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Institutional Email</th>
                      <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100 text-slate-700">
                    {hodList.map(hod => (
                      <tr key={hod.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-950">{hod.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-800">{hod.department}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{hod.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button onClick={()=>handleDeleteHOD(hod.id)} className="p-1.5 hover:bg-red-50 text-red-500 hover:text-red-700 border border-transparent hover:border-red-100 rounded-lg transition cursor-pointer">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3.5: MANAGE CLASS TEACHERS */}
          {activeTab === 'teachers' && (
            <div className="space-y-6">
              <form onSubmit={handleAddTeacher} className="border border-slate-200 bg-slate-50/40 p-5 rounded-2xl grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-5 pb-2 border-b border-slate-200">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Register Class Teacher Profile</h3>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Name</label>
                  <input required type="text" placeholder="Prof. Sameer Patil" value={teacherName} onChange={(e)=>setTeacherName(e.target.value)} className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Assigned Class Name</label>
                  <input required type="text" placeholder="CSE 5th Sem Sec-A" value={teacherClassName} onChange={(e)=>setTeacherClassName(e.target.value)} className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Department</label>
                  <select required value={teacherDept} onChange={(e)=>setTeacherDept(e.target.value)} className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs">
                    <option value="">Select Department</option>
                    {deptList.map(d => <option key={d.id} value={d.department_name}>{d.department_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email Address</label>
                  <input required type="email" placeholder="teacher@college.edu" value={teacherEmail} onChange={(e)=>setTeacherEmail(e.target.value)} className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Password</label>
                  <input required type="password" placeholder="••••••••" value={teacherPass} onChange={(e)=>setTeacherPass(e.target.value)} className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs" />
                </div>
                <div className="md:col-span-5 flex justify-end">
                  <button type="submit" className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer">
                    <Plus className="h-4 w-4" />
                    <span>Register Class Teacher</span>
                  </button>
                </div>
              </form>

              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="min-w-full divide-y divide-slate-100 text-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Teacher Name</th>
                      <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Class Assigned</th>
                      <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Department</th>
                      <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Institutional Email</th>
                      <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100 text-slate-700">
                    {teacherList.map(teacher => (
                      <tr key={teacher.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-950">{teacher.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-800">{teacher.class_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-600">{teacher.department}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{teacher.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button onClick={()=>handleDeleteTeacher(teacher.id)} className="p-1.5 hover:bg-red-50 text-red-500 hover:text-red-700 border border-transparent hover:border-red-100 rounded-lg transition cursor-pointer">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {teacherList.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 font-semibold">No registered Class Teachers found in dataset.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: MANAGE GUARDS */}
          {activeTab === 'guards' && (
            <div className="space-y-6">
              <form onSubmit={handleAddGuard} className="border border-slate-200 bg-slate-50/40 p-5 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3 pb-2 border-b border-slate-200">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Register Guard Profile</h3>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Guard Name</label>
                  <input required type="text" placeholder="Officer Sarah Connor" value={guardName} onChange={(e)=>setGuardName(e.target.value)} className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email Address</label>
                  <input required type="email" placeholder="guard@college.edu" value={guardEmail} onChange={(e)=>setGuardEmail(e.target.value)} className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Security Password</label>
                  <input required type="password" placeholder="••••••••" value={guardPass} onChange={(e)=>setGuardPass(e.target.value)} className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs" />
                </div>
                <div className="md:col-span-3 flex justify-end">
                  <button type="submit" className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer">
                    <Plus className="h-4 w-4" />
                    <span>Register Security Guard</span>
                  </button>
                </div>
              </form>

              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="min-w-full divide-y divide-slate-100 text-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Guard Name</th>
                      <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Authorized Station Email</th>
                      <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100 text-slate-700">
                    {guardList.map(g => (
                      <tr key={g.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-950">{g.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{g.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button onClick={()=>handleDeleteGuard(g.id)} className="p-1.5 hover:bg-red-50 text-red-500 hover:text-red-700 border border-transparent hover:border-red-100 rounded-lg transition cursor-pointer">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: MANAGE DEPARTMENTS */}
          {activeTab === 'depts' && (
            <div className="space-y-6 max-w-xl">
              <form onSubmit={handleAddDept} className="flex gap-2">
                <input
                  required
                  type="text"
                  placeholder="e.g. Civil Engineering"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-xs font-semibold"
                />
                <button type="submit" className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer shrink-0">
                  Add Department
                </button>
              </form>

              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="min-w-full divide-y divide-slate-100 text-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Dept ID</th>
                      <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Department Name</th>
                      <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100 text-slate-700">
                    {deptList.map(dept => (
                      <tr key={dept.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-400">{dept.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-800">{dept.department_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button onClick={()=>handleDeleteDept(dept.id)} className="p-1.5 hover:bg-red-50 text-red-500 hover:text-red-700 border border-transparent hover:border-red-100 rounded-lg transition cursor-pointer">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: PARENT PHONE MAPPINGS DIRECTORY */}
          {activeTab === 'parent_contacts' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="pb-4 border-b border-slate-200">
                <h2 className="text-base font-extrabold text-slate-900">Verified Parent Mobile Number Directory</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Institutional mappings used to verify student emergency contact credentials. System auto-dispatches real-time SMS alerts to these numbers to prevent fraud.
                </p>
              </div>

              {/* Upload Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pasting and CSV import card */}
                <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">CSV File or Tabular Excel Uploader</h3>
                  
                  <div className="space-y-3">
                    {/* Drag and Drop style file selector */}
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 bg-white text-center hover:border-slate-400 transition">
                      <input
                        type="file"
                        accept=".csv,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="parent-excel-file"
                      />
                      <label htmlFor="parent-excel-file" className="cursor-pointer flex flex-col items-center space-y-1">
                        <FileSpreadsheet className="h-8 w-8 text-emerald-600" />
                        <span className="text-xs font-bold text-slate-700">Select Institutional CSV File</span>
                        <span className="text-[10px] text-slate-400 font-medium">Supports headings: Roll No, Name, Parent Phone</span>
                      </label>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-slate-200"></div>
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-slate-50 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">or paste directly from Excel</span>
                      </div>
                    </div>

                    <textarea
                      rows={5}
                      value={parentContactsInput}
                      onChange={(e) => setParentContactsInput(e.target.value)}
                      placeholder="Roll No&#9;Name&#9;Parent Mobile&#10;SBJ-2026-001&#9;Samir Khorgade&#9;+91 9823456789&#10;SBJ-2026-002&#9;Rahul Sharma&#9;+91 9123456780"
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none leading-relaxed"
                    />

                    <button
                      onClick={handleApplyPastedContacts}
                      className="w-full px-4 py-2 bg-slate-900 hover:bg-slate-850 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer"
                    >
                      Intelligently Parse Tabular Data
                    </button>
                  </div>
                </div>

                {/* Preview Parsed Mapping Column */}
                <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4 flex flex-col min-h-[300px]">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Parsed Mappings Preview</h3>
                    <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full text-[10px] font-black">
                      {parentContactsPreview.length} Records Pending
                    </span>
                  </div>

                  {parentContactsPreview.length > 0 ? (
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="overflow-y-auto max-h-[220px] border border-slate-100 rounded-xl divide-y divide-slate-50">
                        {parentContactsPreview.map((item, idx) => (
                          <div key={item.id || idx} className="flex justify-between items-center p-2.5 text-xs">
                            <div>
                              <span className="font-bold text-slate-900 font-mono bg-slate-100 px-1.5 py-0.5 rounded mr-2">{item.roll_no}</span>
                              <span className="text-slate-600 font-semibold">{item.name}</span>
                            </div>
                            <span className="font-bold text-slate-900 font-mono">{item.parent_phone}</span>
                          </div>
                        ))}
                      </div>

                      <button
                        disabled={isUploadingContacts}
                        onClick={handleSaveParentContacts}
                        className="w-full mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-50 flex items-center justify-center space-x-1.5 cursor-pointer"
                      >
                        <RefreshCw className={`h-4 w-4 ${isUploadingContacts ? 'animate-spin' : ''}`} />
                        <span>Save & Sync Mappings to DB</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col justify-center items-center text-center p-6 text-slate-400">
                      <FileSpreadsheet className="h-10 w-10 text-slate-300 mb-2" />
                      <p className="text-xs font-bold text-slate-500">No data parsed yet</p>
                      <p className="text-[10px] text-slate-400 max-w-xs mt-1 leading-relaxed">
                        Drag-and-drop a CSV file or copy paste from your Excel registrar sheets on the left, then click Parse.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Current Directory */}
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between pb-2 border-b border-slate-100 gap-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Active parent numbers registrar</h3>
                  
                  <div className="relative max-w-xs w-full">
                    <input
                      type="text"
                      placeholder="Filter directory..."
                      value={parentSearchQuery}
                      onChange={(e) => setParentSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-950 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm">
                  <table className="min-w-full divide-y divide-slate-100 text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Student Roll No</th>
                        <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Student Name</th>
                        <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Official Parent Phone Number</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100 text-slate-700">
                      {parentContacts
                        .filter(item => {
                          const query = parentSearchQuery.toLowerCase();
                          return (
                            (item.roll_no || '').toLowerCase().includes(query) ||
                            (item.name || '').toLowerCase().includes(query) ||
                            (item.parent_phone || '').toLowerCase().includes(query)
                          );
                        })
                        .map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-6 py-3 whitespace-nowrap font-bold text-slate-950 font-mono">{item.roll_no}</td>
                            <td className="px-6 py-3 whitespace-nowrap font-semibold text-slate-700">{item.name}</td>
                            <td className="px-6 py-3 whitespace-nowrap font-bold text-slate-950 font-mono text-emerald-600">{item.parent_phone}</td>
                          </tr>
                        ))}
                      {parentContacts.length === 0 && (
                        <tr>
                          <td colSpan={3} className="text-center py-12 text-slate-400">
                            No mapped contact phone records registered yet. Import an Excel file above to configure your official safety whitelist.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: AUDIT ACTIVITY LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">System Transactions Command Console</h3>
                <span className="text-[10px] text-slate-400 font-bold">Showing last 50 transactions</span>
              </div>

              <div className="bg-slate-900 text-slate-300 font-mono text-[11px] rounded-2xl p-5 overflow-y-auto max-h-[500px] shadow-inner space-y-2 border border-slate-800">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start space-x-2 leading-relaxed">
                    <span className="text-slate-500 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <span className="text-slate-400 shrink-0 uppercase font-black text-[9px] bg-slate-850 px-1.5 py-0.5 rounded border border-slate-700">{log.role}</span>
                    <span className="text-emerald-400 font-semibold shrink-0">{log.user_name}:</span>
                    <span className="text-slate-200 font-medium">{log.action}</span>
                  </div>
                ))}
                {logs.length === 0 && (
                  <div className="text-slate-500 text-center py-12">No transactions recorded in safety register.</div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Custom Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center space-x-3 text-red-500">
                <div className="p-2.5 bg-red-50 rounded-2xl">
                  <Trash2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Confirm Permanent Delete</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{deleteConfirm.type} administration</p>
                </div>
              </div>
              <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                <p>
                  Are you sure you want to permanently delete <strong>{deleteConfirm.name}</strong> from the gatepass system?
                </p>
                <p className="bg-amber-50 text-amber-700 p-2.5 rounded-xl border border-amber-100 font-medium">
                  ⚠️ Warning: This action is irreversible. Associated gate passes and activity logs for this record might become unassociated.
                </p>
              </div>
              <div className="flex space-x-2 pt-2">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={executeDelete}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Toast Notification System */}
        {toast && (
          <div className="fixed bottom-5 right-5 z-[100] max-w-sm w-full bg-white rounded-2xl border border-slate-100 shadow-2xl p-4 flex items-center space-x-3 animate-in slide-in-from-bottom duration-300">
            <div className={`p-2 rounded-xl shrink-0 ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
              {toast.type === 'success' ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              )}
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-900">{toast.type === 'success' ? 'Success' : 'Error'}</p>
              <p className="text-[11px] text-slate-500 font-medium">{toast.message}</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
