/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect } from "react";
import {
  Users,
  Layers,
  FileSpreadsheet,
  Database,
  RefreshCw,
  LogOut,
  Plus,
  Trash2,
  ShieldCheck,
  Mail,
  Phone,
  BookOpen,
  Clock,
  Activity,
  FileText,
  MessageSquare,
  Search,
  Filter,
  Download,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Building2,
  GraduationCap,
  Shield,
  UserCheck,
  ChevronRight,
  Lock,
  Send,
  MapPin,
  BarChart2,
  Home,
  Settings,
  CheckCircle2,
  ChevronDown,
  Sun,
  Moon
} from "lucide-react";
import { apiFetch } from "../lib/api.js";
import { gatepassService } from "../services/gatepassService.js";
import sbjainLogo from "../assets/sbjain-logo.png";

export default function AdminDashboard({ user, onLogout, isDarkMode, onToggleTheme }) {
  const [stats, setStats] = useState(null);
  const [deptList, setDeptList] = useState([]);
  const [studentList, setStudentList] = useState([]);
  const [hodList, setHodList] = useState([]);
  const [guardList, setGuardList] = useState([]);
  const [teacherList, setTeacherList] = useState([]);
  const [gatePassList, setGatePassList] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [parentContacts, setParentContacts] = useState([]);
  const [activeTab, setActiveTab] = useState("analytics");
  const [whatsappStatus, setWhatsappStatus] = useState({ status: 'DISCONNECTED', qr: null });
  const [whatsappLogs, setWhatsappLogs] = useState([]);
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [adminDeptFilter, setAdminDeptFilter] = useState("all");
  const [adminStatusFilter, setAdminStatusFilter] = useState("all");
  const [adminSearch, setAdminSearch] = useState("");
  const [studentDeptFilter, setStudentDeptFilter] = useState("all");
  const [studentSearch, setStudentSearch] = useState("");
  const [hodDeptFilter, setHodDeptFilter] = useState("all");
  const [hodSearch, setHodSearch] = useState("");
  const [teacherDeptFilter, setTeacherDeptFilter] = useState("all");
  const [teacherSearch, setTeacherSearch] = useState("");
  const [newDeptName, setNewDeptName] = useState("");
  const [studCollegeId, setStudCollegeId] = useState("");
  const [studName, setStudName] = useState("");
  const [studRoll, setStudRoll] = useState("");
  const [studDept, setStudDept] = useState("");
  const [studEmail, setStudEmail] = useState("");
  const [studPhone, setStudPhone] = useState("");
  const [studPass, setStudPass] = useState("");
  const [hodName, setHodName] = useState("");
  const [hodDept, setHodDept] = useState("");
  const [hodEmail, setHodEmail] = useState("");
  const [hodPass, setHodPass] = useState("");
  const [guardName, setGuardName] = useState("");
  const [guardEmail, setGuardEmail] = useState("");
  const [guardPass, setGuardPass] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [teacherClassName, setTeacherClassName] = useState("");
  const [teacherDept, setTeacherDept] = useState("");
  const [teacherEmail, setTeacherEmail] = useState("");
  const [teacherPass, setTeacherPass] = useState("");
  const [principalList, setPrincipalList] = useState([]);
  const [principalName, setPrincipalName] = useState("");
  const [principalEmail, setPrincipalEmail] = useState("");
  const [principalPass, setPrincipalPass] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);
  const [parentContactsInput, setParentContactsInput] = useState("");
  const [parentContactsPreview, setParentContactsPreview] = useState([]);
  const [parentSearchQuery, setParentSearchQuery] = useState("");
  const [isUploadingContacts, setIsUploadingContacts] = useState(false);
  const [exportMonthFilter, setExportMonthFilter] = useState("");

  const showToast = (message, type = "success") => {
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
      const principals = await gatepassService.getAdminPrincipals();
      setPrincipalList(principals || []);
      const passes = await gatepassService.getAdminGatePasses();
      setGatePassList(passes || []);
      const contacts = await gatepassService.getAdminParentContacts();
      setParentContacts(contacts || []);
    } catch (err) {
      alert(err.message || "Failed to fetch admin statistics.");
    } finally {
      setLoading(false);
    }
  };

  const fetchParentContacts = async () => {
    try {
      const contacts = await gatepassService.getAdminParentContacts();
      setParentContacts(contacts || []);
    } catch (err) {
      console.error("Failed to reload parent contacts:", err);
    }
  };

  const fetchWhatsappInfo = async () => {
    setWhatsappLoading(true);
    try {
      const statusData = await gatepassService.getWhatsappStatus();
      setWhatsappStatus(statusData);
      const logsData = await gatepassService.getWhatsappLogs();
      setWhatsappLogs(logsData || []);
    } catch (err) {
      console.error("Failed to fetch WhatsApp details:", err);
    } finally {
      setWhatsappLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  useEffect(() => {
    if (activeTab === "whatsapp") {
      fetchWhatsappInfo();
      const interval = setInterval(fetchWhatsappInfo, 3000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const downloadCSVReport = async () => {
    try {
      const csvContent = await apiFetch("/api/admin/reports");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `gatepass_college_report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert("Failed to download report.");
    }
  };

  const downloadSQLDump = async () => {
    try {
      const sqlContent = await apiFetch("/api/admin/sql-dump");
      const blob = new Blob([sqlContent], { type: "text/sql;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `gatepass_mysql_dump_${Date.now()}.sql`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert("Failed to download SQL dump.");
    }
  };

  const parseTabularContacts = (text) => {
    if (!text.trim()) return [];
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return [];
    const firstLine = lines[0];
    const delimiter = firstLine.includes("\t") ? "\t" : firstLine.includes(",") ? "," : ";";
    const rows = lines.map((line) => {
      let parts = [];
      if (delimiter === ",") {
        let current = "";
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === "," && !inQuotes) {
            parts.push(current.trim());
            current = "";
          } else {
            current += char;
          }
        }
        parts.push(current.trim());
      } else {
        parts = line.split(delimiter).map((p) => p.trim());
      }
      return parts;
    });
    if (rows.length < 2) {
      showToast("No records found. Make sure you have at least a header row and one data row.", "error");
      return [];
    }
    const headers = rows[0].map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
    let rollIdx = headers.findIndex((h) => h.includes("roll") || h.includes("id") || h.includes("number"));
    let nameIdx = headers.findIndex((h) => h.includes("name") || h.includes("student"));
    let phoneIdx = headers.findIndex((h) => h.includes("parentphone") || h.includes("parentmobile") || h.includes("mobile") || h.includes("phone") || h.includes("contact"));
    if (rollIdx === -1) rollIdx = 0;
    if (nameIdx === -1) nameIdx = 1 < headers.length ? 1 : 0;
    if (phoneIdx === -1) phoneIdx = 2 < headers.length ? 2 : headers.length - 1;
    const parsed = rows.slice(1).map((row, idx) => {
      const roll_no = row[rollIdx] || "";
      const name = row[nameIdx] || "";
      const parent_phone = row[phoneIdx] || "";
      return { id: `parsed-${idx}-${Date.now()}`, roll_no, name, parent_phone };
    }).filter((item) => item.roll_no && item.parent_phone);
    return parsed;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
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
      showToast("Failed to parse any valid records. Check your columns.", "error");
      return;
    }
    setParentContactsPreview(parsed);
    showToast(`Intelligently parsed ${parsed.length} records from copy-paste! Check the preview below.`);
  };

  const handleSaveParentContacts = async () => {
    if (parentContactsPreview.length === 0) {
      showToast("No parsed contacts available to save.", "error");
      return;
    }
    setIsUploadingContacts(true);
    try {
      const payload = parentContactsPreview.map((p) => ({
        roll_no: p.roll_no.trim(),
        name: p.name.trim(),
        parent_phone: p.parent_phone.trim()
      }));
      const res = await gatepassService.uploadAdminParentContacts(payload);
      showToast(res.message || "Parent contact mappings updated successfully!");
      setParentContactsPreview([]);
      setParentContactsInput("");
      fetchParentContacts();
    } catch (err) {
      showToast(err.message || "Failed to update parent contacts.", "error");
    } finally {
      setIsUploadingContacts(false);
    }
  };

  const exportMonthlyGatePasses = () => {
    let list = [...gatePassList];
    let fileName = "all_gatepasses_report.csv";
    if (exportMonthFilter) {
      list = list.filter((p) => {
        const date = new Date(p.created_at);
        const yyyymm = date.toISOString().substring(0, 7);
        return yyyymm === exportMonthFilter;
      });
      fileName = `gatepass_report_${exportMonthFilter}.csv`;
    }
    const headers = ["Pass ID", "Student Name", "Roll No", "Department", "Reason", "Destination", "Status", "Risk Level", "Exit Expected", "Return Expected", "Actual Exit", "Actual Return", "Approved By", "Remarks", "Applied At"];
    const rows = list.map((p) => [
      p.id,
      p.student_name,
      p.student_roll_no,
      p.student_department,
      `"${(p.reason || "").replace(/"/g, '""')}"`,
      `"${(p.destination || "").replace(/"/g, '""')}"`,
      p.status,
      p.risk_level || "N/A",
      p.exit_time,
      p.return_time,
      p.exit_marked_at || "N/A",
      p.return_marked_at || "N/A",
      p.approved_by || "N/A",
      `"${(p.remarks || "").replace(/"/g, '""')}"`,
      p.created_at
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Successfully downloaded ${list.length} monthly gatepass reports!`);
  };

  const exportMonthlyLogs = () => {
    let list = [...logs];
    let fileName = "all_system_activity_logs.csv";
    if (exportMonthFilter) {
      list = list.filter((l) => {
        const date = new Date(l.timestamp);
        const yyyymm = date.toISOString().substring(0, 7);
        return yyyymm === exportMonthFilter;
      });
      fileName = `system_activity_logs_${exportMonthFilter}.csv`;
    }
    const headers = ["Transaction ID", "Timestamp", "Operator Role", "Operator Name", "Action Executed"];
    const rows = list.map((l) => [
      l.id,
      l.timestamp,
      l.role,
      l.user_name,
      `"${(l.action || "").replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Successfully downloaded ${list.length} monthly activity log transactions!`);
  };

  const handleAddDept = async (e) => {
    e.preventDefault();
    if (!newDeptName) return;
    try {
      await gatepassService.addAdminDepartment(newDeptName);
      setNewDeptName("");
      fetchAdminData();
    } catch (err) {
      alert(err.message || "Failed to create department.");
    }
  };

  const handleDeleteDept = (id) => {
    const dept = deptList.find((d) => d.id === id);
    setDeleteConfirm({ type: "dept", id, name: dept?.department_name || "Department" });
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!studCollegeId || !studName || !studRoll || !studDept || !studEmail || !studPhone || !studPass) {
      showToast("Please fill in all student details.", "error");
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
        password: studPass
      });
      setStudCollegeId("");
      setStudName("");
      setStudRoll("");
      setStudDept("");
      setStudEmail("");
      setStudPhone("");
      setStudPass("");
      showToast(`Student "${studName}" registered successfully.`);
      fetchAdminData();
    } catch (err) {
      showToast(err.message || "Failed to register student.", "error");
    }
  };

  const handleDeleteStudent = (id) => {
    const stud = studentList.find((s) => s.id === id);
    setDeleteConfirm({ type: "student", id, name: stud?.name || "Student" });
  };

  const handleAddHOD = async (e) => {
    e.preventDefault();
    if (!hodName || !hodDept || !hodEmail || !hodPass) {
      showToast("Please fill out all HOD credentials.", "error");
      return;
    }
    try {
      await gatepassService.registerAdminHOD({
        name: hodName,
        department: hodDept,
        email: hodEmail,
        password: hodPass
      });
      setHodName("");
      setHodDept("");
      setHodEmail("");
      setHodPass("");
      showToast(`HOD Dr./Prof. "${hodName}" registered successfully.`);
      fetchAdminData();
    } catch (err) {
      showToast(err.message || "Failed to register HOD.", "error");
    }
  };

  const handleDeleteHOD = (id) => {
    const hod = hodList.find((h) => h.id === id);
    setDeleteConfirm({ type: "hod", id, name: hod?.name || "HOD" });
  };

  const handleAddGuard = async (e) => {
    e.preventDefault();
    if (!guardName || !guardEmail || !guardPass) {
      showToast("Please fill out all guard details.", "error");
      return;
    }
    try {
      await gatepassService.registerAdminGuard({
        name: guardName,
        email: guardEmail,
        password: guardPass
      });
      setGuardName("");
      setGuardEmail("");
      setGuardPass("");
      showToast(`Security Guard "${guardName}" registered successfully.`);
      fetchAdminData();
    } catch (err) {
      showToast(err.message || "Failed to register guard.", "error");
    }
  };

  const handleDeleteGuard = (id) => {
    const guard = guardList.find((g) => g.id === id);
    setDeleteConfirm({ type: "guard", id, name: guard?.name || "Guard" });
  };

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    if (!teacherName || !teacherClassName || !teacherDept || !teacherEmail || !teacherPass) {
      showToast("Please fill out all Class Teacher details.", "error");
      return;
    }
    try {
      await gatepassService.registerAdminTeacher({
        name: teacherName,
        class_name: teacherClassName,
        department: teacherDept,
        email: teacherEmail,
        password: teacherPass
      });
      setTeacherName("");
      setTeacherClassName("");
      setTeacherDept("");
      setTeacherEmail("");
      setTeacherPass("");
      showToast(`Class Teacher "${teacherName}" registered successfully.`);
      fetchAdminData();
    } catch (err) {
      showToast(err.message || "Failed to register class teacher.", "error");
    }
  };

  const handleDeleteTeacher = (id) => {
    const teacher = teacherList.find((t) => t.id === id);
    setDeleteConfirm({ type: "teacher", id, name: teacher?.name || "Class Teacher" });
  };

  const handleAddPrincipal = async (e) => {
    e.preventDefault();
    const name = principalName.trim();
    const email = principalEmail.trim();
    const password = principalPass;

    if (!name || !email || !password) {
      showToast("Please fill out all Principal credentials.", "error");
      return;
    }
    try {
      await gatepassService.registerAdminPrincipal({
        name,
        email,
        password
      });
      setPrincipalName("");
      setPrincipalEmail("");
      setPrincipalPass("");
      showToast(`Principal "${name}" account registered successfully.`);
      fetchAdminData();
    } catch (err) {
      showToast(err.message || "Failed to register Principal account.", "error");
    }
  };

  const handleDeletePrincipal = (id) => {
    const principal = principalList.find((p) => p.id === id);
    setDeleteConfirm({ type: "principal", id, name: principal?.name || "Principal" });
  };

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    const { type, id, name } = deleteConfirm;
    try {
      if (type === "dept") {
        await gatepassService.deleteAdminDepartment(id);
        showToast(`Department "${name}" deleted successfully.`);
      } else if (type === "student") {
        await gatepassService.deleteAdminStudent(id);
        showToast(`Student "${name}" deleted successfully.`);
      } else if (type === "hod") {
        await gatepassService.deleteAdminHOD(id);
        showToast(`HOD "${name}" deleted successfully.`);
      } else if (type === "guard") {
        await gatepassService.deleteAdminGuard(id);
        showToast(`Security Guard "${name}" deleted successfully.`);
      } else if (type === "teacher") {
        await gatepassService.deleteAdminTeacher(id);
        showToast(`Class Teacher "${name}" deleted successfully.`);
      } else if (type === "principal") {
        await gatepassService.deleteAdminPrincipal(id);
        showToast(`Principal account "${name}" deleted successfully.`);
      }
      setDeleteConfirm(null);
      fetchAdminData();
    } catch (err) {
      showToast(err.message || `Failed to delete ${type}.`, "error");
    }
  };

  // Real Department counts calculation
  const standardDepartments = [
    { id: "aiml", name: "AIML", color: "bg-blue-600" },
    { id: "aids", name: "AIDS", color: "bg-emerald-500" },
    { id: "cse", name: "CSE", color: "bg-purple-600" },
    { id: "etc", name: "ETC", color: "bg-amber-500" },
    { id: "elec", name: "Electrical", color: "bg-cyan-500" },
    { id: "mech", name: "Mechanical", color: "bg-slate-500" }
  ];

  // Combine standard departments with any dynamic ones from deptList
  const allDepartments = [
    ...standardDepartments,
    ...deptList
      .filter((d) => !standardDepartments.some((sd) => sd.name.toLowerCase() === d.department_name.toLowerCase()))
      .map((d) => ({
        id: `dept-${d.id}`,
        name: d.department_name,
        color: "bg-indigo-500"
      }))
  ];

  const totalRequestsCount = stats?.total_requests || gatePassList.length || 0;
  const completedPasses = Math.max(0, (stats?.total_requests || 0) - (stats?.pending_requests || 0) - (stats?.active_outside || 0));
  const activeCurfewPasses = stats?.active_outside || 0;
  const approvedPendingPasses = Math.max(0, (stats?.approved_requests || 0) - (stats?.active_outside || 0));
  const pendingHODPasses = stats?.pending_requests || 0;

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-800 font-sans antialiased flex flex-col">
      {/* 1. TOP HEADER (INSTITUTIONAL NAVY) */}
      <header className="bg-[#0a1e33] border-b border-[#081726] sticky top-0 z-30 shadow-md">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* College Identity */}
            <div className="flex items-center space-x-3.5 min-w-0">
              <img
                src={sbjainLogo}
                alt="SBJITMR Logo"
                className="h-10 w-10 object-contain rounded-md border border-white/20 p-0.5 bg-white shrink-0"
              />
              <div className="min-w-0">
                <h1 className="text-xs sm:text-sm font-bold text-white leading-tight truncate">
                  S. B. Jain Institute of Technology, Management and Research
                </h1>
                <p className="text-[11px] text-slate-400 font-medium">Nagpur</p>
              </div>
            </div>

            {/* Header Badge: Gate Pass Administration */}
            <div className="hidden lg:flex items-center space-x-3 pl-8 pr-4 border-l border-white/10">
              <div className="p-1.5 bg-white/10 rounded-lg text-white">
                <ShieldCheck className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
                    Gate Pass Administration
                  </span>
                  <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider">
                    ADMIN
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Monitor student gate-pass activity, approvals and campus movement.
                </p>
              </div>
            </div>

            {/* Admin Account Profile & Logout */}
            <div className="flex items-center space-x-3 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="h-8 w-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white">
                  <UserCheck className="h-4 w-4 text-blue-300" />
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-bold text-white leading-tight">
                    {user?.name || "System Administrator"}
                  </span>
                  <span className="text-[10px] text-slate-300">
                    {user?.email || "admin@sbitm.edu.in"}
                  </span>
                </div>
              </div>

              <div className="h-6 w-px bg-white/15 hidden sm:block" />

              {/* Theme Toggle Button */}
              <button
                type="button"
                onClick={onToggleTheme || (() => {
                  const isDark = document.documentElement.classList.toggle("dark");
                  localStorage.setItem("theme", isDark ? "dark" : "light");
                })}
                className="p-1.5 sm:p-2 rounded-lg border border-white/15 text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                aria-label="Toggle theme"
              >
                {isDarkMode ? <Sun className="h-4 w-4 text-amber-300" /> : <Moon className="h-4 w-4 text-slate-200" />}
              </button>

              <button
                onClick={onLogout}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-white/20 hover:border-white/40 text-xs font-semibold rounded-md text-white bg-white/5 hover:bg-white/15 transition shadow-xs cursor-pointer"
                title="Sign out of Admin Session"
              >
                <LogOut className="h-3.5 w-3.5 text-slate-300" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 2. BODY LAYOUT: LEFT SIDEBAR + MAIN CONTENT AREA */}
      <div className="flex flex-1 w-full min-h-[calc(100vh-64px)]">
        
        {/* LEFT STATIC/STICKY SIDEBAR */}
        <aside className="w-64 bg-[#0a1e33] text-slate-300 border-r border-[#081726] shrink-0 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto flex flex-col justify-between p-3.5 z-20 select-none">
          <div className="space-y-1">
            {/* Primary Section */}
            {[
              { id: "analytics", label: "Dashboard", icon: Home },
              { id: "gatepasses", label: "Gate Pass Applications", icon: FileText },
              { id: "students", label: "Students", icon: Users },
              { id: "hods", label: "HODs", icon: Layers },
              { id: "teachers", label: "Class Teachers", icon: GraduationCap },
              { id: "principals", label: "Principals", icon: UserCheck },
              { id: "guards", label: "Guards", icon: ShieldCheck },
              { id: "depts", label: "Departments", icon: Building2 }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer text-left ${
                    isActive
                      ? "bg-[#1e60d5] text-white font-bold shadow-sm"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}

            {/* Sidebar Divider */}
            <div className="pt-3 pb-2">
              <div className="border-t border-slate-700/60" />
            </div>

            {/* Secondary Section */}
            {[
              { id: "parent_contacts", label: "Parent Contacts", icon: Phone },
              { id: "whatsapp", label: "WhatsApp Gateway", icon: MessageSquare },
              { id: "monthly_export", label: "Monthly Analytics", icon: BarChart2 },
              { id: "logs", label: "Logs & Reports", icon: Clock }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id || (item.id === "monthly_export" && activeTab === "analytics");
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === "monthly_export") {
                      setActiveTab("analytics");
                      setTimeout(() => {
                        const el = document.getElementById("monthly-analytics-console");
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                      }, 100);
                    } else {
                      setActiveTab(item.id);
                    }
                  }}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer text-left ${
                    activeTab === item.id
                      ? "bg-[#1e60d5] text-white font-bold shadow-sm"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${activeTab === item.id ? "text-white" : "text-slate-400"}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sidebar Footer Artwork */}
          <div className="pt-4 border-t border-slate-800/80 mt-4 space-y-2">
            <div className="flex items-center space-x-2 px-2 text-slate-400">
              <Shield className="h-4 w-4 text-blue-400 shrink-0" />
              <div>
                <p className="text-[11px] font-bold text-slate-200">Secure Campus</p>
                <p className="text-[10px] text-slate-400">Safer Tomorrow</p>
              </div>
            </div>
            {/* Subtle Campus Graphic */}
            <div className="opacity-20 px-2 pt-1 text-center">
              <Building2 className="h-12 w-12 mx-auto text-blue-300" />
            </div>
          </div>
        </aside>

        {/* 3. MAIN DASHBOARD CONTENT */}
        <main className="flex-1 min-w-0 p-6 sm:p-8 space-y-6 overflow-y-auto">
          
          {/* TAB 1: OVERVIEW ANALYTICS (MAIN DASHBOARD) */}
          {activeTab === "analytics" && (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* PAGE TITLE & ACTION BUTTONS */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                    Dashboard
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Welcome back, Admin! Here's an overview of the campus gate pass system.
                  </p>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <button
                    onClick={downloadCSVReport}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold transition shadow-sm cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export CSV Logs</span>
                  </button>

                  <button
                    onClick={fetchAdminData}
                    disabled={loading}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 border border-slate-300 rounded-md bg-white hover:bg-slate-50 text-slate-700 transition shadow-sm text-xs font-semibold cursor-pointer"
                    title="Refresh Dashboard Data"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-blue-700" : "text-slate-600"}`} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* 4 TOP STATISTICS CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: Total Registered Students */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs border-t-4 border-t-blue-500 transition hover:shadow-md">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-blue-50 rounded-full text-blue-600 shrink-0">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        TOTAL REGISTERED STUDENTS
                      </span>
                      <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5">
                        {studentList.length}
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-100">
                    Enrolled with pass profiles
                  </p>
                </div>

                {/* Card 2: Total Gate Passes Applied */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs border-t-4 border-t-emerald-500 transition hover:shadow-md">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-emerald-50 rounded-full text-emerald-600 shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        TOTAL GATE PASSES APPLIED
                      </span>
                      <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5">
                        {totalRequestsCount}
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-100">
                    Cumulative safety applications
                  </p>
                </div>

                {/* Card 3: Pending HOD Review */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs border-t-4 border-t-amber-500 transition hover:shadow-md">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-amber-50 rounded-full text-amber-600 shrink-0">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        PENDING HOD REVIEW
                      </span>
                      <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5">
                        {pendingHODPasses}
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-100">
                    Awaiting active decision
                  </p>
                </div>

                {/* Card 4: Students Outside Campus */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs border-t-4 border-t-rose-500 transition hover:shadow-md">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-rose-50 rounded-full text-rose-600 shrink-0">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        STUDENTS OUTSIDE CAMPUS
                      </span>
                      <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5">
                        {activeCurfewPasses}
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-100">
                    Currently out (Active curfew checks)
                  </p>
                </div>
              </div>

              {/* HORIZONTAL QUICK NAVIGATION BAR */}
              <div className="bg-white border border-slate-200 rounded-xl p-1.5 shadow-xs flex items-center overflow-x-auto space-x-1.5 text-xs font-semibold text-slate-600">
                <button
                  onClick={() => setActiveTab("analytics")}
                  className="px-4 py-2 rounded-lg bg-[#0a1e33] text-white font-bold flex items-center space-x-2 shadow-xs cursor-pointer"
                >
                  <BarChart2 className="h-3.5 w-3.5" />
                  <span>Overview Analytics</span>
                </button>
                <button
                  onClick={() => setActiveTab("gatepasses")}
                  className="px-4 py-2 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center space-x-2 transition cursor-pointer"
                >
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  <span>GatePass Traffic Console</span>
                </button>
                <button
                  onClick={() => setActiveTab("students")}
                  className="px-4 py-2 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center space-x-2 transition cursor-pointer"
                >
                  <Users className="h-3.5 w-3.5 text-slate-400" />
                  <span>Manage Students</span>
                </button>
                <button
                  onClick={() => setActiveTab("hods")}
                  className="px-4 py-2 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center space-x-2 transition cursor-pointer"
                >
                  <Layers className="h-3.5 w-3.5 text-slate-400" />
                  <span>Manage HODs</span>
                </button>
                <button
                  onClick={() => setActiveTab("teachers")}
                  className="px-4 py-2 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center space-x-2 transition cursor-pointer"
                >
                  <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
                  <span>Manage Class Teachers</span>
                </button>
                <button
                  onClick={() => setActiveTab("principals")}
                  className="px-4 py-2 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center space-x-2 transition cursor-pointer"
                >
                  <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                  <span>Manage Principals</span>
                </button>
                <button
                  onClick={() => setActiveTab("guards")}
                  className="px-4 py-2 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center space-x-2 transition cursor-pointer"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                  <span>Manage Guards</span>
                </button>
              </div>

              {/* TWO-COLUMN ANALYTICS AREA */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* LEFT: GATE PASS APPLICATIONS BY DEPARTMENT */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center space-x-2.5">
                        <BarChart2 className="h-5 w-5 text-blue-600" />
                        <h3 className="text-sm font-bold text-slate-900">
                          Gate Pass Applications by Department
                        </h3>
                      </div>
                      <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-md border border-slate-200">
                        Total Requests: {totalRequestsCount}
                      </span>
                    </div>

                    {/* Table Header */}
                    <div className="grid grid-cols-12 text-[11px] font-bold text-slate-400 uppercase tracking-wider pt-4 pb-2 border-b border-slate-100">
                      <div className="col-span-4">Department</div>
                      <div className="col-span-3 text-left">Requests</div>
                      <div className="col-span-5 text-left">Progress</div>
                    </div>

                    {/* Department Rows with FIX for Zero Requests */}
                    <div className="divide-y divide-slate-100">
                      {allDepartments.map((dept) => {
                        // Calculate real requests for this department
                        const deptPassCount = gatePassList.filter((p) => {
                          const pDept = (p.student_department || p.department || "").trim().toLowerCase();
                          return pDept === dept.name.trim().toLowerCase();
                        }).length;

                        // Percentage of total requests
                        const pct = totalRequestsCount > 0 && deptPassCount > 0
                          ? Math.round((deptPassCount / totalRequestsCount) * 100)
                          : 0;

                        return (
                          <div key={dept.id} className="grid grid-cols-12 items-center py-3 text-xs">
                            <div className="col-span-4 flex items-center space-x-2 font-bold text-slate-800">
                              <span className={`h-2.5 w-2.5 rounded-full ${dept.color}`} />
                              <span>{dept.name}</span>
                            </div>

                            <div className="col-span-3 font-semibold text-slate-700">
                              {deptPassCount}
                            </div>

                            <div className="col-span-5 flex items-center space-x-3">
                              {/* Progress Track */}
                              <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                                {deptPassCount > 0 ? (
                                  <div
                                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${pct}%` }}
                                  />
                                ) : (
                                  <div className="h-full" style={{ width: "0%" }} />
                                )}
                              </div>
                              <span className="text-[11px] font-semibold text-slate-500 w-8 text-right">
                                {pct}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {allDepartments.length === 0 && (
                    <div className="text-center py-8 text-xs text-slate-400 font-medium">
                      No gate-pass applications yet.
                    </div>
                  )}
                </div>

                {/* RIGHT: GATE PASS TRAFFIC FLOW STATUS */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
                      <ShieldCheck className="h-5 w-5 text-blue-600" />
                      <h3 className="text-sm font-bold text-slate-900">
                        Gate Pass Traffic Flow Status
                      </h3>
                    </div>

                    <div className="space-y-3 pt-3">
                      {/* Row 1: Completed (Returned) */}
                      <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50/70 transition">
                        <div className="flex items-center space-x-3.5">
                          <div className="p-2 bg-emerald-500 text-white rounded-full shrink-0">
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900">
                              Completed (Returned)
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Students have returned to campus
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="bg-slate-100 text-slate-800 text-xs font-bold px-3 py-1 rounded-full border border-slate-200">
                            {completedPasses} Passes
                          </span>
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        </div>
                      </div>

                      {/* Row 2: Active Curfew (Out) */}
                      <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50/70 transition">
                        <div className="flex items-center space-x-3.5">
                          <div className="p-2 bg-rose-500 text-white rounded-full shrink-0">
                            <Lock className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900">
                              Active Curfew (Out)
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Students currently outside during curfew
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="bg-slate-100 text-slate-800 text-xs font-bold px-3 py-1 rounded-full border border-slate-200">
                            {activeCurfewPasses} Passes
                          </span>
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        </div>
                      </div>

                      {/* Row 3: Approved (Pending Exit) */}
                      <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50/70 transition">
                        <div className="flex items-center space-x-3.5">
                          <div className="p-2 bg-cyan-600 text-white rounded-full shrink-0">
                            <Send className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900">
                              Approved (Pending Exit)
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Approved and waiting to exit
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="bg-slate-100 text-slate-800 text-xs font-bold px-3 py-1 rounded-full border border-slate-200">
                            {approvedPendingPasses} Pass{approvedPendingPasses !== 1 ? "es" : ""}
                          </span>
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        </div>
                      </div>

                      {/* Row 4: Awaiting HOD Review */}
                      <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50/70 transition">
                        <div className="flex items-center space-x-3.5">
                          <div className="p-2 bg-amber-500 text-white rounded-full shrink-0">
                            <Clock className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900">
                              Awaiting HOD Review
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Pending approval from HOD
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="bg-slate-100 text-slate-800 text-xs font-bold px-3 py-1 rounded-full border border-slate-200">
                            {pendingHODPasses} Passes
                          </span>
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* DATABASE & SYSTEM INFORMATION BAR */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0 mt-0.5">
                    <Database className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Database & System Information
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      The system is connected to MySQL database. You can export the logs in CSV format or download the database schema if needed.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <div className="text-right pr-2">
                    <div className="text-xs font-bold text-slate-800">Database: MySQL</div>
                    <div className="flex items-center space-x-1 text-[11px] text-emerald-600 font-medium">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                      <span>Connected</span>
                    </div>
                  </div>

                  <button
                    onClick={downloadCSVReport}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 border border-slate-300 text-xs font-semibold rounded-md text-slate-700 bg-white hover:bg-slate-50 transition shadow-xs cursor-pointer"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-slate-500" />
                    <span>Export CSV Logs</span>
                  </button>

                  <button
                    onClick={downloadSQLDump}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 border border-slate-300 text-xs font-semibold rounded-md text-slate-700 bg-white hover:bg-slate-50 transition shadow-xs cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5 text-slate-500" />
                    <span>Download Schema</span>
                  </button>
                </div>
              </div>

              {/* MONTHLY ANALYTICS & LOG EXPORT CONSOLE */}
              <div id="monthly-analytics-console" className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0 mt-0.5">
                      <BarChart2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Monthly Analytics & Log Export Console
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        View monthly gate pass data and export logs for reporting and analysis.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-slate-600">Select Month</span>
                      <select
                        value={exportMonthFilter}
                        onChange={(e) => setExportMonthFilter(e.target.value)}
                        className="bg-white border border-slate-300 text-xs font-medium rounded-md px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="">All Months (Cumulative)</option>
                        <option value="2026-09">September 2026</option>
                        <option value="2026-08">August 2026</option>
                        <option value="2026-07">July 2026</option>
                        <option value="2026-06">June 2026</option>
                      </select>
                    </div>

                    <button
                      onClick={exportMonthlyGatePasses}
                      className="px-4 py-2 bg-[#0a1e33] hover:bg-[#112d4a] text-white text-xs font-semibold rounded-md shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Export Monthly CSV</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("logs")}
                      className="px-3.5 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-md shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <FileText className="h-3.5 w-3.5 text-slate-500" />
                      <span>View Logs</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GATE PASS TRAFFIC CONSOLE */}
          {activeTab === "gatepasses" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Institutional Gate Pass Traffic Register
                  </h3>
                  <p className="text-xs text-slate-500">
                    Real-time verification, student status, and parent alert delivery audits.
                  </p>
                </div>
                <button
                  onClick={fetchAdminData}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-md shadow-sm transition cursor-pointer self-start sm:self-auto"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                  <span>Sync Records</span>
                </button>
              </div>

              {/* Filter Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Search Student / Roll No
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Type name or roll number..."
                      value={adminSearch}
                      onChange={(e) => setAdminSearch(e.target.value)}
                      className="block w-full pl-8 pr-3 py-1.5 border border-slate-300 bg-white text-xs rounded-md focus:ring-2 focus:ring-blue-800 focus:outline-none"
                    />
                    <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Department Filter
                  </label>
                  <select
                    value={adminDeptFilter}
                    onChange={(e) => setAdminDeptFilter(e.target.value)}
                    className="block w-full px-3 py-1.5 border border-slate-300 bg-white text-xs rounded-md font-medium text-slate-800 focus:ring-2 focus:ring-blue-800 focus:outline-none"
                  >
                    <option value="all">All Departments</option>
                    {deptList.map((dept) => (
                      <option key={dept.id} value={dept.department_name}>
                        {dept.department_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Gate Pass Status
                  </label>
                  <select
                    value={adminStatusFilter}
                    onChange={(e) => setAdminStatusFilter(e.target.value)}
                    className="block w-full px-3 py-1.5 border border-slate-300 bg-white text-xs rounded-md font-medium text-slate-800 focus:ring-2 focus:ring-blue-800 focus:outline-none"
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

              {/* Table of Gate Passes */}
              {(() => {
                const filtered = gatePassList.filter((p) => {
                  const studentName = p.student_name?.toLowerCase() || "";
                  const studentRoll = p.student_roll_no?.toLowerCase() || "";
                  const query = adminSearch.toLowerCase();
                  const matchesSearch = studentName.includes(query) || studentRoll.includes(query);
                  const matchesDept = adminDeptFilter === "all" || p.student_department === adminDeptFilter;
                  const matchesStatus = adminStatusFilter === "all" || p.status === adminStatusFilter;
                  return matchesSearch && matchesDept && matchesStatus;
                });

                return (
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                      <span>Showing {filtered.length} gate pass entries</span>
                      {adminDeptFilter !== "all" && (
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          Dept: {adminDeptFilter}
                        </span>
                      )}
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="min-w-full divide-y divide-slate-200 text-xs">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-2.5 text-left font-semibold text-slate-600 uppercase tracking-wider">
                              Student Details
                            </th>
                            <th className="px-4 py-2.5 text-left font-semibold text-slate-600 uppercase tracking-wider">
                              HOD Authority
                            </th>
                            <th className="px-4 py-2.5 text-left font-semibold text-slate-600 uppercase tracking-wider">
                              Reason & Destination
                            </th>
                            <th className="px-4 py-2.5 text-left font-semibold text-slate-600 uppercase tracking-wider">
                              Timings
                            </th>
                            <th className="px-4 py-2.5 text-left font-semibold text-slate-600 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-4 py-2.5 text-left font-semibold text-slate-600 uppercase tracking-wider">
                              Parent Alert
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100 text-slate-700">
                          {filtered.map((pass) => {
                            const parentNumber = pass.student_parent_phone || "Not Set";
                            const hasSmsFired = ["approved", "exited", "closed"].includes(pass.status);
                            const badgeColors = {
                              pending: "bg-amber-50 text-amber-800 border-amber-200",
                              approved: "bg-emerald-50 text-emerald-800 border-emerald-200",
                              rejected: "bg-rose-50 text-rose-800 border-rose-200",
                              exited: "bg-blue-50 text-blue-900 border-blue-200",
                              closed: "bg-slate-100 text-slate-700 border-slate-200",
                              cancelled: "bg-slate-50 text-slate-500 border-slate-200"
                            };

                            return (
                              <tr key={pass.id} className="hover:bg-slate-50 transition">
                                <td className="px-4 py-3">
                                  <div className="font-bold text-slate-900">{pass.student_name}</div>
                                  <div className="text-[11px] text-slate-500">Roll: {pass.student_roll_no}</div>
                                  <div className="text-[10px] font-semibold text-slate-600 uppercase mt-0.5">{pass.student_department}</div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="font-medium text-slate-800">{pass.approved_by || pass.selected_hod_name || "Department HOD"}</div>
                                  <div className="text-[10px] text-slate-400">ID: {pass.selected_hod_id || "System"}</div>
                                </td>
                                <td className="px-4 py-3 max-w-xs">
                                  <div className="font-medium text-slate-800">{pass.reason}</div>
                                  {pass.destination && (
                                    <div className="text-[11px] text-slate-500 mt-0.5">Dest: {pass.destination}</div>
                                  )}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                                  <div>
                                    <span className="text-[10px] text-slate-400 uppercase">Exit: </span>
                                    <span className="font-semibold">{new Date(pass.exit_time).toLocaleDateString()} {new Date(pass.exit_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                                  </div>
                                  {pass.return_time && (
                                    <div className="text-[11px] text-slate-500">
                                      <span className="text-[10px] text-slate-400 uppercase">Return: </span>
                                      {new Date(pass.return_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${badgeColors[pass.status] || "bg-slate-50 border-slate-200"}`}>
                                    {pass.status.toUpperCase()}
                                  </span>
                                  {pass.risk_level && (
                                    <div className="mt-1">
                                      <span className={`inline-block text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                                        pass.risk_level === "high"
                                          ? "bg-rose-50 text-rose-700 border-rose-200"
                                          : pass.risk_level === "medium"
                                          ? "bg-amber-50 text-amber-700 border-amber-200"
                                          : "bg-blue-50 text-blue-700 border-blue-200"
                                      }`}>
                                        Risk: {pass.risk_level}
                                      </span>
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  {hasSmsFired ? (
                                    <div className="space-y-0.5">
                                      <span className="inline-flex items-center space-x-1 text-emerald-800 text-[11px] font-semibold">
                                        <CheckCircle className="h-3 w-3 text-emerald-600" />
                                        <span>Delivered</span>
                                      </span>
                                      <div className="text-[10px] text-slate-500 font-mono">{parentNumber}</div>
                                    </div>
                                  ) : (
                                    <div className="space-y-0.5">
                                      <span className="inline-flex items-center space-x-1 text-slate-400 text-[11px] font-semibold">
                                        <Clock className="h-3 w-3" />
                                        <span>Pending Approval</span>
                                      </span>
                                      <div className="text-[10px] text-slate-400 font-mono">{parentNumber}</div>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                          {filtered.length === 0 && (
                            <tr>
                              <td colSpan={6} className="px-4 py-8 text-center text-slate-400 font-medium">
                                No gate passes found matching the current search criteria.
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

          {/* TAB 3: MANAGE STUDENTS */}
          {activeTab === "students" && (
            <div className="space-y-6">
              {/* Registration Form */}
              <form onSubmit={handleAddStudent} className="border border-slate-200 bg-slate-50 p-4 sm:p-5 rounded-lg">
                <div className="pb-3 mb-3 border-b border-slate-200">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Register New Student Account
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">College ID</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. C-202611"
                      value={studCollegeId}
                      onChange={(e) => setStudCollegeId(e.target.value)}
                      className="block w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white text-xs text-slate-800 focus:ring-2 focus:ring-blue-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Full Name</label>
                    <input
                      required
                      type="text"
                      placeholder="Student Full Name"
                      value={studName}
                      onChange={(e) => setStudName(e.target.value)}
                      className="block w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white text-xs text-slate-800 focus:ring-2 focus:ring-blue-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Roll Number</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. CS202611"
                      value={studRoll}
                      onChange={(e) => setStudRoll(e.target.value)}
                      className="block w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white text-xs text-slate-800 focus:ring-2 focus:ring-blue-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Department</label>
                    <select
                      required
                      value={studDept}
                      onChange={(e) => setStudDept(e.target.value)}
                      className="block w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white text-xs text-slate-800 focus:ring-2 focus:ring-blue-800 focus:outline-none"
                    >
                      <option value="">Select Department</option>
                      {deptList.map((d) => (
                        <option key={d.id} value={d.department_name}>
                          {d.department_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Institutional Email</label>
                    <input
                      required
                      type="email"
                      placeholder="student@sbjit.edu.in"
                      value={studEmail}
                      onChange={(e) => setStudEmail(e.target.value)}
                      className="block w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white text-xs text-slate-800 focus:ring-2 focus:ring-blue-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Student Phone</label>
                    <input
                      required
                      type="text"
                      placeholder="+91 9876543210"
                      value={studPhone}
                      onChange={(e) => setStudPhone(e.target.value)}
                      className="block w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white text-xs text-slate-800 focus:ring-2 focus:ring-blue-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Account Password</label>
                    <input
                      required
                      type="password"
                      placeholder="••••••••"
                      value={studPass}
                      onChange={(e) => setStudPass(e.target.value)}
                      className="block w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white text-xs text-slate-800 focus:ring-2 focus:ring-blue-800 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-end justify-end pt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-900 hover:bg-blue-850 text-white rounded-md text-xs font-semibold transition shadow-sm flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Register Student</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Student Filter Toolbar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Search student name, roll..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="block w-full pl-8 pr-3 py-1.5 border border-slate-300 bg-white text-xs rounded-md focus:ring-2 focus:ring-blue-800 focus:outline-none"
                  />
                  <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <span className="text-xs font-semibold text-slate-600 shrink-0">Department:</span>
                  <select
                    value={studentDeptFilter}
                    onChange={(e) => setStudentDeptFilter(e.target.value)}
                    className="px-3 py-1.5 border border-slate-300 bg-white text-xs rounded-md font-medium text-slate-800 focus:ring-2 focus:ring-blue-800 focus:outline-none cursor-pointer w-full sm:w-auto"
                  >
                    <option value="all">All Departments</option>
                    {deptList.map((d) => (
                      <option key={d.id} value={d.department_name}>
                        {d.department_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Student Table */}
              {(() => {
                const filteredStudents = studentList.filter((stud) => {
                  const name = (stud.name || "").toLowerCase();
                  const roll = (stud.roll_no || "").toLowerCase();
                  const query = studentSearch.toLowerCase();
                  const matchesSearch = name.includes(query) || roll.includes(query);
                  const matchesDept = studentDeptFilter === "all" || stud.department === studentDeptFilter;
                  return matchesSearch && matchesDept;
                });

                return (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs text-slate-500 font-medium px-1">
                      <span>Showing {filteredStudents.length} of {studentList.length} students</span>
                      {studentDeptFilter !== "all" && (
                        <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200 font-semibold">
                          Dept: {studentDeptFilter}
                        </span>
                      )}
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="min-w-full divide-y divide-slate-200 text-xs">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-2.5 text-left font-semibold text-slate-600 uppercase">Student Name</th>
                            <th className="px-4 py-2.5 text-left font-semibold text-slate-600 uppercase">Roll No & ID</th>
                            <th className="px-4 py-2.5 text-left font-semibold text-slate-600 uppercase">Department</th>
                            <th className="px-4 py-2.5 text-left font-semibold text-slate-600 uppercase">Contact Information</th>
                            <th className="px-4 py-2.5 text-right font-semibold text-slate-600 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100 text-slate-700">
                          {filteredStudents.map((stud) => (
                            <tr key={stud.id} className="hover:bg-slate-50 transition">
                              <td className="px-4 py-3 whitespace-nowrap font-bold text-slate-900">{stud.name}</td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="font-semibold text-slate-800 font-mono">{stud.roll_no}</div>
                                <div className="text-[10px] text-slate-400">ID: {stud.college_id}</div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-700">{stud.department}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                                <div className="flex items-center space-x-1">
                                  <Mail className="h-3 w-3 text-slate-400" />
                                  <span>{stud.email}</span>
                                </div>
                                <div className="flex items-center space-x-1 mt-0.5">
                                  <Phone className="h-3 w-3 text-slate-400" />
                                  <span>{stud.phone}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right">
                                <button
                                  onClick={() => handleDeleteStudent(stud.id)}
                                  className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                                  title="Delete Student"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {filteredStudents.length === 0 && (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-slate-400">
                                No students found matching the selected filter.
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

          {/* TAB 4: MANAGE HODS */}
          {activeTab === "hods" && (
            <div className="space-y-6">
              <form onSubmit={handleAddHOD} className="border border-slate-200 bg-slate-50 p-4 sm:p-5 rounded-lg">
                <div className="pb-3 mb-3 border-b border-slate-200">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Register Department Head of Department (HOD)
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Full Name</label>
                    <input
                      required
                      type="text"
                      placeholder="Dr. / Prof. Name"
                      value={hodName}
                      onChange={(e) => setHodName(e.target.value)}
                      className="block w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white text-xs text-slate-800 focus:ring-2 focus:ring-blue-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Assigned Department</label>
                    <select
                      required
                      value={hodDept}
                      onChange={(e) => setHodDept(e.target.value)}
                      className="block w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white text-xs text-slate-800 focus:ring-2 focus:ring-blue-800 focus:outline-none"
                    >
                      <option value="">Select Department</option>
                      {deptList.map((d) => (
                        <option key={d.id} value={d.department_name}>
                          {d.department_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Institutional Email</label>
                    <input
                      required
                      type="email"
                      placeholder="hod@sbjit.edu.in"
                      value={hodEmail}
                      onChange={(e) => setHodEmail(e.target.value)}
                      className="block w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white text-xs text-slate-800 focus:ring-2 focus:ring-blue-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Password</label>
                    <input
                      required
                      type="password"
                      placeholder="••••••••"
                      value={hodPass}
                      onChange={(e) => setHodPass(e.target.value)}
                      className="block w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white text-xs text-slate-800 focus:ring-2 focus:ring-blue-800 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-4 flex justify-end pt-1">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-900 hover:bg-blue-850 text-white rounded-md text-xs font-semibold transition shadow-sm flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Register HOD</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* HOD Filter Toolbar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Search HOD name, email..."
                    value={hodSearch}
                    onChange={(e) => setHodSearch(e.target.value)}
                    className="block w-full pl-8 pr-3 py-1.5 border border-slate-300 bg-white text-xs rounded-md focus:ring-2 focus:ring-blue-800 focus:outline-none"
                  />
                  <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <span className="text-xs font-semibold text-slate-600 shrink-0">Department:</span>
                  <select
                    value={hodDeptFilter}
                    onChange={(e) => setHodDeptFilter(e.target.value)}
                    className="px-3 py-1.5 border border-slate-300 bg-white text-xs rounded-md font-medium text-slate-800 focus:ring-2 focus:ring-blue-800 focus:outline-none cursor-pointer w-full sm:w-auto"
                  >
                    <option value="all">All Departments</option>
                    {deptList.map((d) => (
                      <option key={d.id} value={d.department_name}>
                        {d.department_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* HOD Table */}
              {(() => {
                const filteredHods = hodList.filter((hod) => {
                  const name = (hod.name || "").toLowerCase();
                  const email = (hod.email || "").toLowerCase();
                  const query = hodSearch.toLowerCase();
                  const matchesSearch = name.includes(query) || email.includes(query);
                  const matchesDept = hodDeptFilter === "all" || hod.department === hodDeptFilter;
                  return matchesSearch && matchesDept;
                });

                return (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs text-slate-500 font-medium px-1">
                      <span>Showing {filteredHods.length} of {hodList.length} HODs</span>
                      {hodDeptFilter !== "all" && (
                        <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200 font-semibold">
                          Dept: {hodDeptFilter}
                        </span>
                      )}
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="min-w-full divide-y divide-slate-200 text-xs">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-2.5 text-left font-semibold text-slate-600 uppercase">HOD Name</th>
                            <th className="px-4 py-2.5 text-left font-semibold text-slate-600 uppercase">Department Assigned</th>
                            <th className="px-4 py-2.5 text-left font-semibold text-slate-600 uppercase">Institutional Email</th>
                            <th className="px-4 py-2.5 text-right font-semibold text-slate-600 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100 text-slate-700">
                          {filteredHods.map((hod) => (
                            <tr key={hod.id} className="hover:bg-slate-50 transition">
                              <td className="px-4 py-3 whitespace-nowrap font-bold text-slate-900">{hod.name}</td>
                              <td className="px-4 py-3 whitespace-nowrap font-semibold text-slate-800">{hod.department}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-slate-600 font-mono">{hod.email}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-right">
                                <button
                                  onClick={() => handleDeleteHOD(hod.id)}
                                  className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                                  title="Delete HOD"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {filteredHods.length === 0 && (
                            <tr>
                              <td colSpan={4} className="py-8 text-center text-slate-400">
                                No HODs found matching the selected filter.
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

          {/* TAB 5: MANAGE CLASS TEACHERS */}
          {activeTab === "teachers" && (
            <div className="space-y-6">
              <form onSubmit={handleAddTeacher} className="border border-slate-200 bg-slate-50 p-4 sm:p-5 rounded-lg">
                <div className="pb-3 mb-3 border-b border-slate-200">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Register Class Teacher Profile
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Teacher Full Name</label>
                    <input
                      required
                      type="text"
                      placeholder="Prof. Teacher Name"
                      value={teacherName}
                      onChange={(e) => setTeacherName(e.target.value)}
                      className="block w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white text-xs text-slate-800 focus:ring-2 focus:ring-blue-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Class Assigned</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. CSE 5th Sem Sec-A"
                      value={teacherClassName}
                      onChange={(e) => setTeacherClassName(e.target.value)}
                      className="block w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white text-xs text-slate-800 focus:ring-2 focus:ring-blue-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Department</label>
                    <select
                      required
                      value={teacherDept}
                      onChange={(e) => setTeacherDept(e.target.value)}
                      className="block w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white text-xs text-slate-800 focus:ring-2 focus:ring-blue-800 focus:outline-none"
                    >
                      <option value="">Select Department</option>
                      {deptList.map((d) => (
                        <option key={d.id} value={d.department_name}>
                          {d.department_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Institutional Email</label>
                    <input
                      required
                      type="email"
                      placeholder="teacher@sbjit.edu.in"
                      value={teacherEmail}
                      onChange={(e) => setTeacherEmail(e.target.value)}
                      className="block w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white text-xs text-slate-800 focus:ring-2 focus:ring-blue-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Password</label>
                    <input
                      required
                      type="password"
                      placeholder="••••••••"
                      value={teacherPass}
                      onChange={(e) => setTeacherPass(e.target.value)}
                      className="block w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white text-xs text-slate-800 focus:ring-2 focus:ring-blue-800 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-end justify-end pt-1">
                    <button
                      type="submit"
                      className="w-full px-4 py-2 bg-blue-900 hover:bg-blue-850 text-white rounded-md text-xs font-semibold transition shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Register Teacher</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Teacher Filter Toolbar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Search teacher name, email..."
                    value={teacherSearch}
                    onChange={(e) => setTeacherSearch(e.target.value)}
                    className="block w-full pl-8 pr-3 py-1.5 border border-slate-300 bg-white text-xs rounded-md focus:ring-2 focus:ring-blue-800 focus:outline-none"
                  />
                  <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <span className="text-xs font-semibold text-slate-600 shrink-0">Department:</span>
                  <select
                    value={teacherDeptFilter}
                    onChange={(e) => setTeacherDeptFilter(e.target.value)}
                    className="px-3 py-1.5 border border-slate-300 bg-white text-xs rounded-md font-medium text-slate-800 focus:ring-2 focus:ring-blue-800 focus:outline-none cursor-pointer w-full sm:w-auto"
                  >
                    <option value="all">All Departments</option>
                    {deptList.map((d) => (
                      <option key={d.id} value={d.department_name}>
                        {d.department_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Teacher Table */}
              {(() => {
                const filteredTeachers = teacherList.filter((teacher) => {
                  const name = (teacher.name || "").toLowerCase();
                  const email = (teacher.email || "").toLowerCase();
                  const className = (teacher.class_name || "").toLowerCase();
                  const query = teacherSearch.toLowerCase();
                  const matchesSearch = name.includes(query) || email.includes(query) || className.includes(query);
                  const matchesDept = teacherDeptFilter === "all" || teacher.department === teacherDeptFilter;
                  return matchesSearch && matchesDept;
                });

                return (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs text-slate-500 font-medium px-1">
                      <span>Showing {filteredTeachers.length} of {teacherList.length} Class Teachers</span>
                      {teacherDeptFilter !== "all" && (
                        <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200 font-semibold">
                          Dept: {teacherDeptFilter}
                        </span>
                      )}
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="min-w-full divide-y divide-slate-200 text-xs">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-2.5 text-left font-semibold text-slate-600 uppercase">Teacher Name</th>
                            <th className="px-4 py-2.5 text-left font-semibold text-slate-600 uppercase">Class Section</th>
                            <th className="px-4 py-2.5 text-left font-semibold text-slate-600 uppercase">Department</th>
                            <th className="px-4 py-2.5 text-left font-semibold text-slate-600 uppercase">Email</th>
                            <th className="px-4 py-2.5 text-right font-semibold text-slate-600 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100 text-slate-700">
                          {filteredTeachers.map((teacher) => (
                            <tr key={teacher.id} className="hover:bg-slate-50 transition">
                              <td className="px-4 py-3 whitespace-nowrap font-bold text-slate-900">{teacher.name}</td>
                              <td className="px-4 py-3 whitespace-nowrap font-semibold text-slate-800">{teacher.class_name}</td>
                              <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-600">{teacher.department}</td>
                              <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-600">{teacher.email}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-right">
                                <button
                                  onClick={() => handleDeleteTeacher(teacher.id)}
                                  className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                                  title="Delete Teacher"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {filteredTeachers.length === 0 && (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-slate-400">
                                No class teachers found matching the selected filter.
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

          {/* TAB 6: MANAGE PRINCIPALS */}
          {activeTab === "principals" && (
            <div className="space-y-6">
              <form onSubmit={handleAddPrincipal} className="border border-slate-200 bg-slate-50 p-4 sm:p-5 rounded-lg">
                <div className="pb-3 mb-3 border-b border-slate-200">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Register Principal / Executive Account
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Principal Name</label>
                    <input
                      required
                      type="text"
                      placeholder="Dr. S. B. Jain"
                      value={principalName}
                      onChange={(e) => setPrincipalName(e.target.value)}
                      className="block w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white text-xs text-slate-800 focus:ring-2 focus:ring-blue-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Institutional Email</label>
                    <input
                      required
                      type="email"
                      placeholder="principal@sbjit.edu.in"
                      value={principalEmail}
                      onChange={(e) => setPrincipalEmail(e.target.value)}
                      className="block w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white text-xs text-slate-800 focus:ring-2 focus:ring-blue-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Password</label>
                    <input
                      required
                      type="password"
                      placeholder="••••••••"
                      value={principalPass}
                      onChange={(e) => setPrincipalPass(e.target.value)}
                      className="block w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white text-xs text-slate-800 focus:ring-2 focus:ring-blue-800 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-3 flex justify-end pt-1">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-900 hover:bg-blue-850 text-white rounded-md text-xs font-semibold transition shadow-sm flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Create Principal Account</span>
                    </button>
                  </div>
                </div>
              </form>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-semibold text-slate-600 uppercase">Principal Name</th>
                      <th className="px-4 py-2.5 text-left font-semibold text-slate-600 uppercase">Email</th>
                      <th className="px-4 py-2.5 text-left font-semibold text-slate-600 uppercase">Authority Level</th>
                      <th className="px-4 py-2.5 text-right font-semibold text-slate-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100 text-slate-700">
                    {principalList.map((principal) => (
                      <tr key={principal.id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3 whitespace-nowrap font-bold text-slate-900">{principal.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-600">{principal.email}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            Executive Principal
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <button
                            onClick={() => handleDeletePrincipal(principal.id)}
                            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                            title="Delete Principal Account"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {principalList.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400">
                          No registered Principal accounts found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: MANAGE GUARDS */}
          {activeTab === "guards" && (
            <div className="space-y-6">
              <form onSubmit={handleAddGuard} className="border border-slate-200 bg-slate-50 p-4 sm:p-5 rounded-lg">
                <div className="pb-3 mb-3 border-b border-slate-200">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Register Security Guard Profile
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Guard Name</label>
                    <input
                      required
                      type="text"
                      placeholder="Officer Name"
                      value={guardName}
                      onChange={(e) => setGuardName(e.target.value)}
                      className="block w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white text-xs text-slate-800 focus:ring-2 focus:ring-blue-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Authorized Station Email</label>
                    <input
                      required
                      type="email"
                      placeholder="guard@sbjit.edu.in"
                      value={guardEmail}
                      onChange={(e) => setGuardEmail(e.target.value)}
                      className="block w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white text-xs text-slate-800 focus:ring-2 focus:ring-blue-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Security Password</label>
                    <input
                      required
                      type="password"
                      placeholder="••••••••"
                      value={guardPass}
                      onChange={(e) => setGuardPass(e.target.value)}
                      className="block w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white text-xs text-slate-800 focus:ring-2 focus:ring-blue-800 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-3 flex justify-end pt-1">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-900 hover:bg-blue-850 text-white rounded-md text-xs font-semibold transition shadow-sm flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Register Guard</span>
                    </button>
                  </div>
                </div>
              </form>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-semibold text-slate-600 uppercase">Guard Name</th>
                      <th className="px-4 py-2.5 text-left font-semibold text-slate-600 uppercase">Station Email</th>
                      <th className="px-4 py-2.5 text-right font-semibold text-slate-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100 text-slate-700">
                    {guardList.map((g) => (
                      <tr key={g.id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3 whitespace-nowrap font-bold text-slate-900">{g.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-600">{g.email}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <button
                            onClick={() => handleDeleteGuard(g.id)}
                            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                            title="Delete Guard"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {guardList.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-slate-400">
                          No registered security guards found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 8: MANAGE DEPARTMENTS */}
          {activeTab === "depts" && (
            <div className="space-y-5 max-w-xl">
              <form onSubmit={handleAddDept} className="flex gap-2.5">
                <input
                  required
                  type="text"
                  placeholder="e.g. Civil Engineering"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-800 text-xs text-slate-800 font-medium"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-850 text-white font-semibold text-xs rounded-md shadow-sm transition cursor-pointer shrink-0"
                >
                  Add Department
                </button>
              </form>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-semibold text-slate-600 uppercase">Dept ID</th>
                      <th className="px-4 py-2.5 text-left font-semibold text-slate-600 uppercase">Department Name</th>
                      <th className="px-4 py-2.5 text-right font-semibold text-slate-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100 text-slate-700">
                    {deptList.map((dept) => (
                      <tr key={dept.id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-500">{dept.id}</td>
                        <td className="px-4 py-3 whitespace-nowrap font-bold text-slate-900">{dept.department_name}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <button
                            onClick={() => handleDeleteDept(dept.id)}
                            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                            title="Delete Department"
                          >
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

          {/* TAB 9: PARENT PHONE MAPPINGS DIRECTORY */}
          {activeTab === "parent_contacts" && (
            <div className="space-y-6">
              <div className="pb-3 border-b border-slate-200">
                <h3 className="text-base font-bold text-slate-900">
                  Verified Parent Emergency Contact Directory
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Institutional mappings used for automatic real-time WhatsApp parent alerts upon student campus exit.
                </p>
              </div>

              {/* Upload Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Uploader Card */}
                <div className="border border-slate-200 rounded-lg p-4 sm:p-5 bg-slate-50 space-y-3.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    CSV / Excel Batch Importer
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 bg-white text-center hover:border-slate-400 transition">
                      <input
                        type="file"
                        accept=".csv,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="parent-excel-file"
                      />
                      <label htmlFor="parent-excel-file" className="cursor-pointer flex flex-col items-center space-y-1">
                        <FileSpreadsheet className="h-7 w-7 text-emerald-700" />
                        <span className="text-xs font-bold text-slate-800">Select Institutional CSV File</span>
                        <span className="text-[11px] text-slate-500">Columns: Roll No, Name, Parent Phone</span>
                      </label>
                    </div>

                    <div className="relative flex justify-center text-xs">
                      <span className="bg-slate-50 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        or paste spreadsheet text directly
                      </span>
                    </div>

                    <textarea
                      rows={4}
                      value={parentContactsInput}
                      onChange={(e) => setParentContactsInput(e.target.value)}
                      placeholder="Roll No&#9;Name&#9;Parent Mobile&#10;SBJ-2026-001&#9;Samir Khorgade&#9;+91 9823456789"
                      className="w-full bg-white border border-slate-300 rounded-md p-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-800 resize-none"
                    />

                    <button
                      onClick={handleApplyPastedContacts}
                      className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-md shadow-sm transition cursor-pointer"
                    >
                      Parse Tabular Data
                    </button>
                  </div>
                </div>

                {/* Preview Card */}
                <div className="border border-slate-200 rounded-lg p-4 sm:p-5 bg-white space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                        Parsed Records Preview
                      </h4>
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-bold">
                        {parentContactsPreview.length} Ready
                      </span>
                    </div>

                    {parentContactsPreview.length > 0 ? (
                      <div className="overflow-y-auto max-h-[190px] border border-slate-200 rounded-md divide-y divide-slate-100">
                        {parentContactsPreview.map((item, idx) => (
                          <div key={item.id || idx} className="flex justify-between items-center p-2 text-xs">
                            <div>
                              <span className="font-bold text-slate-900 font-mono bg-slate-100 px-1.5 py-0.5 rounded mr-2">
                                {item.roll_no}
                              </span>
                              <span className="text-slate-700 font-medium">{item.name}</span>
                            </div>
                            <span className="font-bold text-slate-900 font-mono">{item.parent_phone}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 text-slate-400">
                        <FileSpreadsheet className="h-8 w-8 text-slate-300 mx-auto mb-1.5" />
                        <p className="text-xs font-semibold text-slate-500">No records parsed yet</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Upload a CSV or paste tabular text on the left.</p>
                      </div>
                    )}
                  </div>

                  {parentContactsPreview.length > 0 && (
                    <button
                      disabled={isUploadingContacts}
                      onClick={handleSaveParentContacts}
                      className="w-full mt-3 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-md shadow-sm transition disabled:opacity-50 flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <RefreshCw className={`h-4 w-4 ${isUploadingContacts ? "animate-spin" : ""}`} />
                      <span>Save & Sync Mappings to DB</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Active Directory Table */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200 gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Active Parent Numbers Directory
                  </h4>
                  <div className="max-w-xs w-full">
                    <input
                      type="text"
                      placeholder="Filter directory..."
                      value={parentSearchQuery}
                      onChange={(e) => setParentSearchQuery(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-800"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="min-w-full divide-y divide-slate-200 text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2.5 text-left font-semibold text-slate-600 uppercase">Roll No</th>
                        <th className="px-4 py-2.5 text-left font-semibold text-slate-600 uppercase">Student Name</th>
                        <th className="px-4 py-2.5 text-left font-semibold text-slate-600 uppercase">Parent Mobile Number</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100 text-slate-700">
                      {parentContacts
                        .filter((item) => {
                          const query = parentSearchQuery.toLowerCase();
                          return (
                            (item.roll_no || "").toLowerCase().includes(query) ||
                            (item.name || "").toLowerCase().includes(query) ||
                            (item.parent_phone || "").toLowerCase().includes(query)
                          );
                        })
                        .map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition">
                            <td className="px-4 py-2.5 whitespace-nowrap font-bold text-slate-900 font-mono">
                              {item.roll_no}
                            </td>
                            <td className="px-4 py-2.5 whitespace-nowrap font-semibold text-slate-800">
                              {item.name}
                            </td>
                            <td className="px-4 py-2.5 whitespace-nowrap font-mono font-bold text-emerald-800">
                              {item.parent_phone}
                            </td>
                          </tr>
                        ))}
                      {parentContacts.length === 0 && (
                        <tr>
                          <td colSpan={3} className="text-center py-8 text-slate-400">
                            No mapped parent contact records registered.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: WHATSAPP ALERT ENGINE */}
          {activeTab === "whatsapp" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    WhatsApp Alert Gateway & Dispatch Audit
                  </h3>
                  <p className="text-xs text-slate-500">
                    Monitor active Green-API connection status and instant parent notifications.
                  </p>
                </div>
                <button
                  onClick={fetchWhatsappInfo}
                  disabled={whatsappLoading}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-md shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${whatsappLoading ? "animate-spin" : ""}`} />
                  <span>Refresh Gateway</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Gateway Status Card */}
                <div className="lg:col-span-1 border border-slate-200 rounded-lg p-5 bg-slate-50 flex flex-col items-center justify-center text-center min-h-[260px]">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 self-start">
                    Connection State
                  </h4>
                  
                  {whatsappStatus.status === "CONNECTED" ? (
                    <div className="space-y-3">
                      <div className="mx-auto h-12 w-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center">
                        <MessageSquare className="h-6 w-6" />
                      </div>
                      <div className="inline-flex items-center px-3 py-1 rounded text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        GATEWAY ACTIVE
                      </div>
                      <p className="text-xs text-slate-600 px-2 leading-relaxed">
                        Green API Cloud Gateway (Instance {whatsappStatus.idInstance || "710722683037"}) is active & authorized. Alerts trigger automatically at student exit scan.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="mx-auto h-12 w-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center">
                        <AlertCircle className="h-6 w-6" />
                      </div>
                      <div className="inline-flex items-center px-3 py-1 rounded text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        GATEWAY DISCONNECTED
                      </div>
                      <p className="text-xs text-slate-600 px-2 leading-relaxed">
                        {whatsappStatus.error || "Gateway instance unreachable. Ensure GREEN_API credentials in your .env file are configured."}
                      </p>
                      <button
                        disabled={whatsappLoading}
                        onClick={fetchWhatsappInfo}
                        className="mt-2 inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-md shadow-sm transition cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${whatsappLoading ? "animate-spin" : ""}`} />
                        <span>Recheck Status</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Audit Logs Table */}
                <div className="lg:col-span-2 border border-slate-200 rounded-lg p-5 bg-white flex flex-col">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Recent Dispatches Audit
                  </h4>
                  
                  <div className="overflow-x-auto flex-1 border border-slate-200 rounded-md">
                    <table className="min-w-full divide-y divide-slate-200 text-xs">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-3.5 py-2 text-left font-semibold text-slate-600 uppercase">Student</th>
                          <th className="px-3.5 py-2 text-left font-semibold text-slate-600 uppercase">Parent Phone</th>
                          <th className="px-3.5 py-2 text-left font-semibold text-slate-600 uppercase">Timestamp</th>
                          <th className="px-3.5 py-2 text-left font-semibold text-slate-600 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {whatsappLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50 transition">
                            <td className="px-3.5 py-2.5">
                              <div className="font-bold text-slate-900">{log.studentName}</div>
                              <div className="text-[10px] text-slate-400">Roll: {log.rollNo}</div>
                            </td>
                            <td className="px-3.5 py-2.5 font-mono font-semibold">{log.parentPhone}</td>
                            <td className="px-3.5 py-2.5 text-slate-500">
                              {new Date(log.sent_at).toLocaleDateString()} {new Date(log.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </td>
                            <td className="px-3.5 py-2.5 whitespace-nowrap">
                              {log.status === "success" ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                                  DELIVERED
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-bold" title={log.error}>
                                  FAILED
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {whatsappLogs.length === 0 && (
                          <tr>
                            <td colSpan={4} className="text-center py-8 text-slate-400 font-medium">
                              No WhatsApp notifications recorded yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 11: AUDIT ACTIVITY LOGS */}
          {activeTab === "logs" && (
            <div className="space-y-3.5">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <h3 className="text-sm font-bold text-slate-900">
                  System Audit Trail & Security Logs
                </h3>
                <span className="text-xs text-slate-500 font-medium">Recent 50 transactions</span>
              </div>

              <div className="bg-slate-900 text-slate-200 font-mono text-xs rounded-lg p-4 overflow-y-auto max-h-[480px] space-y-2 border border-slate-800">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start space-x-2 leading-relaxed">
                    <span className="text-slate-400 shrink-0">
                      [{new Date(log.timestamp).toLocaleTimeString()}]
                    </span>
                    <span className="text-slate-300 shrink-0 uppercase font-bold text-[10px] bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                      {log.role}
                    </span>
                    <span className="text-emerald-400 font-semibold shrink-0">{log.user_name}:</span>
                    <span className="text-slate-100">{log.action}</span>
                  </div>
                ))}
                {logs.length === 0 && (
                  <div className="text-slate-500 text-center py-8">
                    No transactions recorded in safety register.
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* 6. DELETE CONFIRMATION MODAL */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-2 bg-rose-50 rounded-md border border-rose-100">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Confirm Deletion</h3>
                <p className="text-[11px] text-slate-500 uppercase font-semibold">
                  {deleteConfirm.type} administration
                </p>
              </div>
            </div>
            
            <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
              <p>
                Are you sure you want to permanently delete <strong className="text-slate-900">{deleteConfirm.name}</strong> from the system?
              </p>
              <div className="bg-amber-50 text-amber-800 p-2.5 rounded-md border border-amber-200 font-medium flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                <span>Warning: This action cannot be undone. Associated gate pass records may be affected.</span>
              </div>
            </div>

            <div className="flex justify-end space-x-2.5 pt-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs rounded-md transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-semibold text-xs rounded-md transition cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-white rounded-lg border border-slate-200 shadow-lg p-3.5 flex items-start space-x-3">
          <div className={`p-1.5 rounded-md shrink-0 ${toast.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
            {toast.type === "success" ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-900">
              {toast.type === "success" ? "Success" : "Notice"}
            </p>
            <p className="text-[11px] text-slate-600 mt-0.5">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
