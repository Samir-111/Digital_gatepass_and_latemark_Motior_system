/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect, useMemo } from "react";
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
  Moon,
  Key,
  Check,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Eye,
  EyeOff,
  Menu,
  X,
  Calendar,
  TrendingUp,
  PieChart,
  ArrowUpRight
} from "lucide-react";
import { apiFetch } from "../lib/api.js";
import { gatepassService } from "../services/gatepassService.js";
import sbjainLogo from "../assets/sbjain-logo.png";
import campusImg from "../assets/campus.png";

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
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState({ status: 'DISCONNECTED', qr: null });
  const [whatsappLogs, setWhatsappLogs] = useState([]);
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [whatsappConfig, setWhatsappConfig] = useState(null);
  const [waInstanceId, setWaInstanceId] = useState("");
  const [waApiUrl, setWaApiUrl] = useState("");
  const [waApiToken1, setWaApiToken1] = useState("");
  const [waApiToken2, setWaApiToken2] = useState("");
  const [waApiToken3, setWaApiToken3] = useState("");
  const [showToken1, setShowToken1] = useState(false);
  const [showToken2, setShowToken2] = useState(false);
  const [showToken3, setShowToken3] = useState(false);
  const [updatingWaConfig, setUpdatingWaConfig] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [testWaPhone, setTestWaPhone] = useState("");
  const [testWaMsg, setTestWaMsg] = useState("");
  const [sendingTestWa, setSendingTestWa] = useState(false);
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
  const [exportDeptFilter, setExportDeptFilter] = useState("all");
  const [exportStatusFilter, setExportStatusFilter] = useState("all");
  const [exportSearchQuery, setExportSearchQuery] = useState("");

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
      const configData = await gatepassService.getWhatsappConfig();
      setWhatsappConfig(configData);
      if (configData && !waInstanceId) {
        setWaInstanceId(configData.instanceId || "");
        setWaApiUrl(configData.apiUrl || "https://api.green-api.com");
      }
    } catch (err) {
      console.error("Failed to fetch WhatsApp details:", err);
    } finally {
      setWhatsappLoading(false);
    }
  };

  const handleUpdateWhatsappConfig = async (e) => {
    if (e) e.preventDefault();
    if (!waInstanceId.trim()) {
      showToast("Instance ID is required", "error");
      return;
    }
    if (!waApiToken1.trim() || !waApiToken2.trim() || !waApiToken3.trim()) {
      showToast("Please enter the new API token in all 3 verification fields", "error");
      return;
    }
    if (waApiToken1 !== waApiToken2 || waApiToken1 !== waApiToken3) {
      showToast("Token mismatch! All 3 token entries must match exactly.", "error");
      return;
    }

    setUpdatingWaConfig(true);
    try {
      const res = await gatepassService.updateWhatsappConfig({
        instanceId: waInstanceId.trim(),
        apiUrl: waApiUrl.trim() || "https://api.green-api.com",
        apiToken1: waApiToken1.trim(),
        apiToken2: waApiToken2.trim(),
        apiToken3: waApiToken3.trim(),
      });
      showToast(res.message || "WhatsApp gateway credentials updated successfully!");
      setWaApiToken1("");
      setWaApiToken2("");
      setWaApiToken3("");
      setShowConfigModal(false);
      fetchWhatsappInfo();
    } catch (err) {
      showToast(err.message || "Failed to update WhatsApp configuration", "error");
    } finally {
      setUpdatingWaConfig(false);
    }
  };

  const handleResetWhatsappConfig = async () => {
    if (!window.confirm("Are you sure you want to reset WhatsApp settings to default .env configuration?")) {
      return;
    }
    setUpdatingWaConfig(true);
    try {
      const res = await gatepassService.resetWhatsappConfig();
      showToast(res.message || "WhatsApp gateway reset to default .env settings");
      setWaInstanceId("");
      setWaApiToken1("");
      setWaApiToken2("");
      setWaApiToken3("");
      fetchWhatsappInfo();
    } catch (err) {
      showToast(err.message || "Failed to reset WhatsApp configuration", "error");
    } finally {
      setUpdatingWaConfig(false);
    }
  };

  const handleSendTestWhatsapp = async (e) => {
    if (e) e.preventDefault();
    if (!testWaPhone.trim()) {
      showToast("Please enter a valid 10-digit mobile number", "error");
      return;
    }
    setSendingTestWa(true);
    try {
      const res = await gatepassService.testWhatsappMessage({
        phone: testWaPhone.trim(),
        message: testWaMsg.trim() || undefined,
      });
      showToast(res.message || "Test WhatsApp message sent successfully!");
      setTestWaPhone("");
      setTestWaMsg("");
      fetchWhatsappInfo();
    } catch (err) {
      showToast(err.message || "Failed to send test WhatsApp message", "error");
    } finally {
      setSendingTestWa(false);
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

  // Available departments list (merging registered depts + defaults + records)
  const availableDepts = useMemo(() => {
    const set = new Set();
    ["AIML", "AIDS", "CSE", "ETC", "Electrical", "Mechanical"].forEach((d) => set.add(d));
    deptList.forEach((d) => {
      if (d.department_name && d.department_name.trim()) set.add(d.department_name.trim());
    });
    gatePassList.forEach((p) => {
      const d = p.student_department || p.department;
      if (d && d.trim()) set.add(d.trim());
    });
    return Array.from(set).sort();
  }, [deptList, gatePassList]);

  // Dynamic available months list generated from pass timestamps + rolling recent months
  const availableMonths = useMemo(() => {
    const monthMap = new Map();
    const formatMonthLabel = (yyyymm) => {
      const [yearStr, monthStr] = yyyymm.split("-");
      const d = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, 1);
      return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    };

    // Include recent 6 months to current month
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const yyyymm = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthMap.set(yyyymm, formatMonthLabel(yyyymm));
    }

    // Include all historical months present in gatePassList
    gatePassList.forEach((p) => {
      const dateVal = p.created_at || p.exit_time || p.exit_marked_at;
      if (dateVal) {
        const d = new Date(dateVal);
        if (!isNaN(d.getTime())) {
          const yyyymm = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          if (!monthMap.has(yyyymm)) {
            monthMap.set(yyyymm, formatMonthLabel(yyyymm));
          }
        }
      }
    });

    return Array.from(monthMap.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => b.value.localeCompare(a.value));
  }, [gatePassList]);

  // Filtered passes calculation based on selected department, month, status, and search query
  const filteredExportPasses = useMemo(() => {
    return gatePassList.filter((p) => {
      // 1. Department filter
      const pDept = (p.student_department || p.department || "").trim().toLowerCase();
      const matchesDept =
        exportDeptFilter === "all" || pDept === exportDeptFilter.trim().toLowerCase();

      // 2. Month filter
      let matchesMonth = true;
      if (exportMonthFilter) {
        const dateVal = p.created_at || p.exit_time || p.exit_marked_at;
        if (dateVal) {
          const d = new Date(dateVal);
          if (!isNaN(d.getTime())) {
            const yyyymm = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            matchesMonth = yyyymm === exportMonthFilter;
          } else {
            matchesMonth = String(dateVal).startsWith(exportMonthFilter);
          }
        } else {
          matchesMonth = false;
        }
      }

      // 3. Status filter
      const pStatus = (p.status || "").toLowerCase();
      const matchesStatus =
        exportStatusFilter === "all" || pStatus === exportStatusFilter.toLowerCase();

      // 4. Search filter
      const q = (exportSearchQuery || "").toLowerCase().trim();
      const matchesSearch =
        !q ||
        (p.student_name || "").toLowerCase().includes(q) ||
        (p.student_roll_no || "").toLowerCase().includes(q) ||
        (p.reason || "").toLowerCase().includes(q);

      return matchesDept && matchesMonth && matchesStatus && matchesSearch;
    });
  }, [gatePassList, exportDeptFilter, exportMonthFilter, exportStatusFilter, exportSearchQuery]);

  // Aggregated Department-wise analytics matrix for the selected month
  const deptAnalyticsSummary = useMemo(() => {
    const monthFiltered = gatePassList.filter((p) => {
      if (!exportMonthFilter) return true;
      const dateVal = p.created_at || p.exit_time || p.exit_marked_at;
      if (dateVal) {
        const d = new Date(dateVal);
        if (!isNaN(d.getTime())) {
          const yyyymm = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          return yyyymm === exportMonthFilter;
        }
        return String(dateVal).startsWith(exportMonthFilter);
      }
      return false;
    });

    const summaryMap = {};
    availableDepts.forEach((d) => {
      summaryMap[d.toLowerCase()] = {
        name: d,
        total: 0,
        pending: 0,
        approved: 0,
        exited: 0,
        closed: 0,
        rejected: 0,
        highRisk: 0,
      };
    });

    monthFiltered.forEach((p) => {
      const deptName = (p.student_department || p.department || "Other").trim();
      const key = deptName.toLowerCase();
      if (!summaryMap[key]) {
        summaryMap[key] = {
          name: deptName,
          total: 0,
          pending: 0,
          approved: 0,
          exited: 0,
          closed: 0,
          rejected: 0,
          highRisk: 0,
        };
      }
      summaryMap[key].total += 1;
      const st = (p.status || "").toLowerCase();
      if (st === "pending") summaryMap[key].pending += 1;
      else if (st === "approved") summaryMap[key].approved += 1;
      else if (st === "exited") summaryMap[key].exited += 1;
      else if (st === "closed" || st === "returned") summaryMap[key].closed += 1;
      else if (st === "rejected" || st === "cancelled") summaryMap[key].rejected += 1;

      if ((p.risk_level || "").toLowerCase() === "high") {
        summaryMap[key].highRisk += 1;
      }
    });

    return Object.values(summaryMap).sort((a, b) => b.total - a.total);
  }, [gatePassList, availableDepts, exportMonthFilter]);

  const exportMonthlyGatePasses = () => {
    const list = filteredExportPasses;
    if (list.length === 0) {
      showToast("No gate pass records match the selected Department and Month filters.", "error");
      return;
    }
    const deptTag = exportDeptFilter === "all" ? "all_departments" : exportDeptFilter.replace(/[^a-zA-Z0-9_-]/g, "_");
    const monthTag = exportMonthFilter ? exportMonthFilter : "all_months";
    const fileName = `gatepass_report_${deptTag}_${monthTag}.csv`;

    const headers = [
      "Pass ID",
      "Student Name",
      "Roll No",
      "Department",
      "Reason",
      "Status",
      "Risk Level",
      "Exit Time",
      "Actual Exit Marked",
      "Actual Return Marked",
      "Approved By",
      "Remarks",
      "Applied At"
    ];

    const rows = list.map((p) => [
      p.id,
      `"${(p.student_name || "").replace(/"/g, '""')}"`,
      `"${(p.student_roll_no || "").replace(/"/g, '""')}"`,
      `"${(p.student_department || p.department || "").replace(/"/g, '""')}"`,
      `"${(p.reason || "").replace(/"/g, '""')}"`,
      p.status,
      p.risk_level || "Normal",
      p.exit_time || "N/A",
      p.exit_marked_at || "N/A",
      p.return_marked_at || "N/A",
      `"${(p.approved_by || "N/A").replace(/"/g, '""')}"`,
      `"${(p.remarks || "").replace(/"/g, '""')}"`,
      p.created_at || "N/A"
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${list.length} gate pass records for ${exportDeptFilter === 'all' ? 'All Departments' : exportDeptFilter} (${monthTag})!`);
  };

  const exportDeptSummaryCSV = () => {
    const list = deptAnalyticsSummary;
    const monthTag = exportMonthFilter ? exportMonthFilter : "all_months";
    const fileName = `department_summary_${monthTag}.csv`;

    const headers = [
      "Department",
      "Total Applications",
      "Approved Passes",
      "Currently Outside (Exited)",
      "Safely Returned (Closed)",
      "Pending Review",
      "Rejected",
      "High Risk Flags",
      "Approval Rate (%)"
    ];

    const rows = list.map((d) => {
      const processed = d.approved + d.exited + d.closed + d.rejected;
      const rate = processed > 0 ? Math.round(((d.approved + d.exited + d.closed) / processed) * 100) : 0;
      return [
        `"${d.name}"`,
        d.total,
        d.approved,
        d.exited,
        d.closed,
        d.pending,
        d.rejected,
        d.highRisk,
        `${rate}%`
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Downloaded Department Breakdown Summary for ${monthTag}!`);
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
            {/* College Identity & Mobile Toggle */}
            <div className="flex items-center space-x-2 sm:space-x-3.5 min-w-0">
              {/* Mobile Drawer Hamburger Button */}
              <button
                type="button"
                onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
                className="lg:hidden p-1.5 -ml-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer shrink-0"
                aria-label="Toggle Navigation Menu"
                title="Open navigation menu"
              >
                {isMobileNavOpen ? <X className="h-5 w-5 text-white" /> : <Menu className="h-5 w-5 text-white" />}
              </button>

              <img
                src={sbjainLogo}
                alt="SBJITMR Logo"
                className="h-8 w-8 sm:h-10 sm:w-10 object-contain rounded-md border border-white/20 p-0.5 bg-white shrink-0"
              />
              <div className="min-w-0">
                <h1 className="text-xs sm:text-sm font-bold text-white leading-tight truncate">
                  S. B. Jain Institute of Technology
                </h1>
                <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">Nagpur • Admin Console</p>
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
            <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white">
                  <UserCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-300" />
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
                {isDarkMode ? <Sun className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-300" /> : <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-200" />}
              </button>

              <button
                onClick={onLogout}
                className="inline-flex items-center space-x-1 sm:space-x-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 border border-white/20 hover:border-white/40 text-xs font-semibold rounded-md text-white bg-white/5 hover:bg-white/15 transition shadow-xs cursor-pointer"
                title="Sign out of Admin Session"
              >
                <LogOut className="h-3.5 w-3.5 text-slate-300" />
                <span className="hidden xs:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 2. BODY LAYOUT: LEFT SIDEBAR + MAIN CONTENT AREA */}
      <div className="flex flex-1 w-full min-h-[calc(100vh-64px)] relative">
        
        {/* Mobile Backdrop Overlay */}
        {isMobileNavOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileNavOpen(false)}
          />
        )}

        {/* SIDEBAR: Slide-over drawer on Mobile, Fixed sticky column on Desktop */}
        <aside
          className={`fixed lg:sticky top-0 lg:top-16 left-0 z-50 lg:z-20 w-72 lg:w-64 bg-[#0a1e33] text-slate-300 border-r border-[#081726] shrink-0 h-full lg:h-[calc(100vh-64px)] overflow-y-auto flex flex-col justify-between p-3.5 select-none transition-transform duration-300 ease-in-out ${
            isMobileNavOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <div>
            {/* Mobile Drawer Header with Close Button */}
            <div className="lg:hidden flex items-center justify-between pb-3 mb-3 border-b border-slate-700/60">
              <div className="flex items-center space-x-2">
                <img src={sbjainLogo} alt="Logo" className="h-7 w-7 rounded p-0.5 bg-white shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white tracking-wide">Admin Portal</p>
                  <p className="text-[10px] text-slate-400">Navigation Menu</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileNavOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                aria-label="Close Navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

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
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileNavOpen(false);
                    }}
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
                { id: "monthly_export", label: "Monthly & Dept Analytics", icon: BarChart2 },
                { id: "parent_contacts", label: "Parent Contacts", icon: Phone },
                { id: "whatsapp", label: "WhatsApp Gateway", icon: MessageSquare },
                { id: "logs", label: "Logs & Reports", icon: Clock }
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setIsMobileNavOpen(false);
                      setActiveTab(item.id);
                    }}
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
            </div>
          </div>

          {/* Sidebar Footer Card with Subtle Blended College Image Background */}
          <div className="relative rounded-xl overflow-hidden mt-3 border border-white/10 bg-[#081726]/80 shadow-xs shrink-0">
            {/* College Campus Faded Background Image */}
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-100 pointer-events-none mix-blend-luminosity"
              style={{ backgroundImage: `url(${campusImg})` }}
            />
            {/* Dark Navy Semi-Transparent Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a1e33] via-[#0a1e33]/85 to-[#0a1e33]/60 pointer-events-none" />

            <div className="relative z-10 p-2.5 space-y-1">
              <div className="flex items-center space-x-2">
                <div className="p-1 rounded-md bg-blue-500/20 text-blue-400 border border-blue-400/30 shrink-0">
                  <Shield className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white tracking-tight truncate">S. B. JITMR</p>
                  <p className="text-[10px] text-slate-300 font-medium truncate">Nagpur </p>
                </div>
              </div>
              <p className="text-[9.5px] text-blue-200/70 font-medium pl-0.5">
                Secure Campus • Safer Tomorrow
              </p>
            </div>
          </div>
        </aside>

        {/* 3. MAIN DASHBOARD CONTENT */}
        <main className="flex-1 min-w-0 max-w-full overflow-x-hidden p-3 sm:p-5 lg:p-8 space-y-4 sm:space-y-6 pb-12">
          
          {/* TAB 1: OVERVIEW ANALYTICS (MAIN DASHBOARD) */}
          {activeTab === "analytics" && (
            <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
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

              {/* 4 TOP STATISTICS CARDS (Compact 2-Col Mobile Grid) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                {/* Card 1: Total Registered Students */}
                <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-5 shadow-xs border-t-4 border-t-blue-500 transition hover:shadow-md">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="p-2 sm:p-2.5 bg-blue-50 rounded-full text-blue-600 shrink-0">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">
                        REGISTERED STUDENTS
                      </span>
                      <div className="text-xl sm:text-3xl font-extrabold text-slate-900 mt-0.5">
                        {studentList.length}
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 mt-2 sm:mt-3 pt-1.5 sm:pt-2 border-t border-slate-100 truncate hidden sm:block">
                    Enrolled with pass profiles
                  </p>
                </div>

                {/* Card 2: Total Gate Passes Applied */}
                <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-5 shadow-xs border-t-4 border-t-emerald-500 transition hover:shadow-md">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="p-2 sm:p-2.5 bg-emerald-50 rounded-full text-emerald-600 shrink-0">
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">
                        PASSES APPLIED
                      </span>
                      <div className="text-xl sm:text-3xl font-extrabold text-slate-900 mt-0.5">
                        {totalRequestsCount}
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 mt-2 sm:mt-3 pt-1.5 sm:pt-2 border-t border-slate-100 truncate hidden sm:block">
                    Cumulative safety applications
                  </p>
                </div>

                {/* Card 3: Pending HOD Review */}
                <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-5 shadow-xs border-t-4 border-t-amber-500 transition hover:shadow-md">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="p-2 sm:p-2.5 bg-amber-50 rounded-full text-amber-600 shrink-0">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">
                        PENDING HOD
                      </span>
                      <div className="text-xl sm:text-3xl font-extrabold text-slate-900 mt-0.5">
                        {pendingHODPasses}
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 mt-2 sm:mt-3 pt-1.5 sm:pt-2 border-t border-slate-100 truncate hidden sm:block">
                    Awaiting active decision
                  </p>
                </div>

                {/* Card 4: Students Outside Campus */}
                <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-5 shadow-xs border-t-4 border-t-rose-500 transition hover:shadow-md">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="p-2 sm:p-2.5 bg-rose-50 rounded-full text-rose-600 shrink-0">
                      <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">
                        OUTSIDE CAMPUS
                      </span>
                      <div className="text-xl sm:text-3xl font-extrabold text-slate-900 mt-0.5">
                        {activeCurfewPasses}
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 mt-2 sm:mt-3 pt-1.5 sm:pt-2 border-t border-slate-100 truncate hidden sm:block">
                    Currently out (Active curfew checks)
                  </p>
                </div>
              </div>

              {/* HORIZONTAL QUICK NAVIGATION BAR */}
              <div className="bg-white border border-slate-200 rounded-xl p-1.5 shadow-xs flex items-center overflow-x-auto no-scrollbar space-x-1.5 text-xs font-semibold text-slate-600 whitespace-nowrap max-w-full">
                <button
                  onClick={() => setActiveTab("analytics")}
                  className="px-4 py-2 rounded-lg bg-[#0a1e33] text-white font-bold flex items-center space-x-2 shadow-xs cursor-pointer shrink-0"
                >
                  <BarChart2 className="h-3.5 w-3.5" />
                  <span>Overview Analytics</span>
                </button>
                <button
                  onClick={() => setActiveTab("gatepasses")}
                  className="px-4 py-2 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center space-x-2 transition cursor-pointer shrink-0"
                >
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  <span>GatePass Traffic Console</span>
                </button>
                <button
                  onClick={() => setActiveTab("students")}
                  className="px-4 py-2 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center space-x-2 transition cursor-pointer shrink-0"
                >
                  <Users className="h-3.5 w-3.5 text-slate-400" />
                  <span>Manage Students</span>
                </button>
                <button
                  onClick={() => setActiveTab("hods")}
                  className="px-4 py-2 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center space-x-2 transition cursor-pointer shrink-0"
                >
                  <Layers className="h-3.5 w-3.5 text-slate-400" />
                  <span>Manage HODs</span>
                </button>
                <button
                  onClick={() => setActiveTab("teachers")}
                  className="px-4 py-2 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center space-x-2 transition cursor-pointer shrink-0"
                >
                  <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
                  <span>Manage Class Teachers</span>
                </button>
                <button
                  onClick={() => setActiveTab("principals")}
                  className="px-4 py-2 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center space-x-2 transition cursor-pointer shrink-0"
                >
                  <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                  <span>Manage Principals</span>
                </button>
                <button
                  onClick={() => setActiveTab("guards")}
                  className="px-4 py-2 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center space-x-2 transition cursor-pointer shrink-0"
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

              {/* MONTHLY & DEPARTMENT ANALYTICS CONSOLE CARD */}
              <div id="monthly-analytics-console" className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 pb-3.5 border-b border-slate-100">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0 mt-0.5">
                      <BarChart2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-bold text-slate-900">
                          Department & Monthly Analytics Center
                        </h4>
                        <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {filteredExportPasses.length} records matching
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Filter and download gate-pass logs sorted precisely by department and month.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setActiveTab("monthly_export")}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <span>Open Full Analytics Portal</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Filter and Quick Action Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Filter by Department
                    </label>
                    <select
                      value={exportDeptFilter}
                      onChange={(e) => setExportDeptFilter(e.target.value)}
                      className="w-full bg-white border border-slate-300 text-xs font-medium rounded-md px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="all">All Departments (Institutional)</option>
                      {availableDepts.map((d) => (
                        <option key={d} value={d}>
                          {d} Department
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Filter by Month
                    </label>
                    <select
                      value={exportMonthFilter}
                      onChange={(e) => setExportMonthFilter(e.target.value)}
                      className="w-full bg-white border border-slate-300 text-xs font-medium rounded-md px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="">All Months (Cumulative)</option>
                      {availableMonths.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={exportMonthlyGatePasses}
                      className="w-full px-3 py-1.5 bg-[#0a1e33] hover:bg-[#112d4a] text-white text-xs font-semibold rounded-md shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download Filtered CSV</span>
                    </button>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={exportDeptSummaryCSV}
                      className="w-full px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-md shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 text-slate-500" />
                      <span>Dept Summary CSV</span>
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
                              Reason
                            </th>
                            <th className="px-4 py-2.5 text-left font-semibold text-slate-600 uppercase tracking-wider">
                              Exit Timing
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
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                                  <div>
                                    <span className="text-[10px] text-slate-400 uppercase">Exit: </span>
                                    <span className="font-semibold">{new Date(pass.exit_time).toLocaleDateString()} {new Date(pass.exit_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                                  </div>
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

          {/* TAB 10: WHATSAPP ALERT ENGINE & GATEWAY CREDENTIALS */}
          {activeTab === "whatsapp" && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                    <span>WhatsApp Alert Gateway & Credentials Engine</span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Green-API Cloud
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Manage active WhatsApp dispatch account, execute 3-step secure key rotation, and audit parent exit alerts.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowConfigModal(true)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-md shadow-sm transition cursor-pointer"
                  >
                    <Key className="h-3.5 w-3.5" />
                    <span>Change WhatsApp Account / Key</span>
                  </button>
                  <button
                    onClick={fetchWhatsappInfo}
                    disabled={whatsappLoading}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-md shadow-sm transition cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${whatsappLoading ? "animate-spin" : ""}`} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* Status & Quick Test Cards Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Active Gateway Details Card */}
                <div className="lg:col-span-1 border border-slate-200 rounded-lg p-5 bg-gradient-to-br from-slate-50 to-white shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Active Gateway Account
                      </h4>
                      {whatsappStatus.status === "CONNECTED" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          ● CONNECTED
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          ● OFFLINE / DISCONNECTED
                        </span>
                      )}
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="p-3 bg-white rounded-md border border-slate-200 shadow-xs space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Instance ID:</span>
                          <span className="font-mono font-bold text-slate-900">
                            {whatsappConfig?.instanceId || whatsappStatus.idInstance || "Not configured"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Active Token:</span>
                          <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                            {whatsappConfig?.maskedToken || "••••••••"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Config Source:</span>
                          <span className={`font-semibold px-1.5 py-0.2 rounded text-[10px] ${whatsappConfig?.isCustom ? "bg-purple-100 text-purple-800" : "bg-slate-100 text-slate-700"}`}>
                            {whatsappConfig?.source === "custom_db" ? "Custom (Admin Dashboard)" : "Default (.env file)"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">API Endpoint:</span>
                          <span className="font-mono text-[11px] text-slate-600 truncate max-w-[170px]" title={whatsappConfig?.apiUrl}>
                            {whatsappConfig?.apiUrl || "https://api.green-api.com"}
                          </span>
                        </div>
                      </div>

                      {whatsappStatus.status !== "CONNECTED" && whatsappStatus.error && (
                        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-700 text-[11px] flex items-start space-x-1.5">
                          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
                          <span>{whatsappStatus.error}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-3">
                    <button
                      onClick={() => setShowConfigModal(true)}
                      className="text-xs text-emerald-700 hover:text-emerald-900 font-bold inline-flex items-center space-x-1 cursor-pointer"
                    >
                      <span>Update Account / Key</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                    {whatsappConfig?.isCustom && (
                      <button
                        onClick={handleResetWhatsappConfig}
                        disabled={updatingWaConfig}
                        className="text-[11px] text-slate-500 hover:text-rose-600 font-semibold underline cursor-pointer disabled:opacity-50"
                      >
                        Reset to .env
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick Live Test Dispatcher */}
                <div className="lg:col-span-2 border border-slate-200 rounded-lg p-5 bg-white shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                        <Send className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Instant Live WhatsApp Delivery Test</span>
                      </h4>
                      <span className="text-[11px] text-slate-400">Verifies recipient delivery in real-time</span>
                    </div>
                    <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                      Send a verification message to any mobile number to confirm that the active Green-API account is delivering parent alerts and 2FA codes without issues.
                    </p>

                    <form onSubmit={handleSendTestWhatsapp} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-1">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Mobile Number *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 9876543210"
                          value={testWaPhone}
                          onChange={(e) => setTestWaPhone(e.target.value)}
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:outline-hidden font-mono"
                          required
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Custom Message (Optional)
                        </label>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            placeholder="Defaults to standard system test message..."
                            value={testWaMsg}
                            onChange={(e) => setTestWaMsg(e.target.value)}
                            className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                          />
                          <button
                            type="submit"
                            disabled={sendingTestWa || !testWaPhone.trim()}
                            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-md shadow-sm transition cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
                          >
                            {sendingTestWa ? (
                              <>
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                <span>Sending...</span>
                              </>
                            ) : (
                              <>
                                <Send className="h-3.5 w-3.5" />
                                <span>Send Test</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center space-x-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Standard Indian mobile format automatically prefixed with +91</span>
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">Green-API REST v2</span>
                  </div>
                </div>
              </div>

              {/* Modal / Dialog: 3-Step Secure Key Verification */}
              {showConfigModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-150">
                    <div className="flex items-start justify-between pb-3 border-b border-slate-200">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                          <Key className="h-5 w-5 text-emerald-600" />
                          <span>Switch WhatsApp Gateway Account</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Change the active Green-API account credentials used for all college gatepass parent alerts.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowConfigModal(false)}
                        className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1 cursor-pointer"
                      >
                        ×
                      </button>
                    </div>

                    {/* Security Notice */}
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-start space-x-2.5">
                      <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        <span className="font-bold">3-Step Key Verification Safeguard:</span>
                        <p className="text-[11px] text-amber-800 mt-0.5">
                          To prevent accidental deletion or typos that could disrupt live parent alerts, please type or paste the new Green-API Token <strong>3 times</strong> below. The system will save only when all 3 entries match identically.
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleUpdateWhatsappConfig} className="space-y-3.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Green-API Instance ID *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 710722683037"
                            value={waInstanceId}
                            onChange={(e) => setWaInstanceId(e.target.value)}
                            className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            API Server URL
                          </label>
                          <input
                            type="text"
                            placeholder="https://api.green-api.com"
                            value={waApiUrl}
                            onChange={(e) => setWaApiUrl(e.target.value)}
                            className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono text-slate-600"
                          />
                        </div>
                      </div>

                      {/* Step 1: New API Token */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-xs font-bold text-slate-700">
                            1. Enter New API Token *
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowToken1(!showToken1)}
                            className="text-[11px] text-slate-500 hover:text-slate-800 inline-flex items-center space-x-1 cursor-pointer"
                          >
                            {showToken1 ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            <span>{showToken1 ? "Hide" : "Show"}</span>
                          </button>
                        </div>
                        <input
                          type={showToken1 ? "text" : "password"}
                          placeholder="Paste new Green-API Token (1st time)"
                          value={waApiToken1}
                          onChange={(e) => setWaApiToken1(e.target.value)}
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                          required
                        />
                      </div>

                      {/* Step 2: Confirm API Token */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-xs font-bold text-slate-700">
                            2. Re-enter API Token (2nd Time) *
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowToken2(!showToken2)}
                            className="text-[11px] text-slate-500 hover:text-slate-800 inline-flex items-center space-x-1 cursor-pointer"
                          >
                            {showToken2 ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            <span>{showToken2 ? "Hide" : "Show"}</span>
                          </button>
                        </div>
                        <input
                          type={showToken2 ? "text" : "password"}
                          placeholder="Paste new Green-API Token (2nd time to confirm)"
                          value={waApiToken2}
                          onChange={(e) => setWaApiToken2(e.target.value)}
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                          required
                        />
                      </div>

                      {/* Step 3: Final Verification */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-xs font-bold text-slate-700">
                            3. Final Verification (3rd Time) *
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowToken3(!showToken3)}
                            className="text-[11px] text-slate-500 hover:text-slate-800 inline-flex items-center space-x-1 cursor-pointer"
                          >
                            {showToken3 ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            <span>{showToken3 ? "Hide" : "Show"}</span>
                          </button>
                        </div>
                        <input
                          type={showToken3 ? "text" : "password"}
                          placeholder="Paste new Green-API Token (3rd time for safety)"
                          value={waApiToken3}
                          onChange={(e) => setWaApiToken3(e.target.value)}
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                          required
                        />
                      </div>

                      {/* Real-time Match Verification Indicator */}
                      <div className="p-3 rounded-lg border text-xs flex items-center justify-between transition">
                        {waApiToken1 && waApiToken2 && waApiToken3 ? (
                          waApiToken1 === waApiToken2 && waApiToken1 === waApiToken3 ? (
                            <div className="flex items-center space-x-2 text-emerald-700 bg-emerald-50 border-emerald-200 w-full p-2 rounded">
                              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                              <span className="font-bold text-[11px]">
                                All 3 token entries match identically! Ready to apply.
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2 text-rose-700 bg-rose-50 border-rose-200 w-full p-2 rounded">
                              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                              <span className="font-bold text-[11px]">
                                Tokens do not match! Please check all 3 entries carefully.
                              </span>
                            </div>
                          )
                        ) : (
                          <div className="flex items-center space-x-2 text-slate-500 bg-slate-50 border-slate-200 w-full p-2 rounded text-[11px]">
                            <Lock className="h-4 w-4 shrink-0 text-slate-400" />
                            <span>Fill all 3 fields with your new Green-API token to unlock verification.</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setShowConfigModal(false)}
                          className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs rounded-md cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={
                            updatingWaConfig ||
                            !waInstanceId.trim() ||
                            !waApiToken1.trim() ||
                            !waApiToken2.trim() ||
                            !waApiToken3.trim() ||
                            waApiToken1 !== waApiToken2 ||
                            waApiToken1 !== waApiToken3
                          }
                          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-md shadow-sm transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {updatingWaConfig ? (
                            <>
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              <span>Validating & Connecting...</span>
                            </>
                          ) : (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              <span>Save & Connect WhatsApp Account</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Audit Logs Table */}
              <div className="border border-slate-200 rounded-lg p-5 bg-white flex flex-col shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-slate-100 gap-2">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Recent Parent WhatsApp Dispatches Audit
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Real-time delivery log of student exit and late-mark parent notifications.
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 self-start sm:self-auto">
                    {whatsappLogs.length} Records Logged
                  </span>
                </div>
                
                <div className="overflow-x-auto flex-1 border border-slate-200 rounded-md">
                  <table className="min-w-full divide-y divide-slate-200 text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3.5 py-2.5 text-left font-semibold text-slate-600 uppercase">Student</th>
                        <th className="px-3.5 py-2.5 text-left font-semibold text-slate-600 uppercase">Parent Phone</th>
                        <th className="px-3.5 py-2.5 text-left font-semibold text-slate-600 uppercase">Timestamp</th>
                        <th className="px-3.5 py-2.5 text-left font-semibold text-slate-600 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {whatsappLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50 transition">
                          <td className="px-3.5 py-2.5">
                            <div className="font-bold text-slate-900">{log.studentName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">Roll: {log.rollNo}</div>
                          </td>
                          <td className="px-3.5 py-2.5 font-mono font-semibold text-slate-800">{log.parentPhone}</td>
                          <td className="px-3.5 py-2.5 text-slate-500 font-mono text-[11px]">
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
          )}

          {/* TAB 10: DEDICATED DEPARTMENT & MONTHLY ANALYTICS PORTAL */}
          {activeTab === "monthly_export" && (
            <div className="space-y-5">
              {/* Header & Quick Action Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                      <BarChart2 className="h-5 w-5" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      Department &amp; Monthly Gate Pass Analytics Center
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Filter by academic department and month, analyze campus movement rates, and download structured CSV reports.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                  <button
                    onClick={exportMonthlyGatePasses}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#0a1e33] hover:bg-[#112d4a] text-white font-semibold text-xs rounded-md shadow-xs transition cursor-pointer"
                    title="Export currently filtered gate pass records to CSV"
                  >
                    <Download className="h-3.5 w-3.5 text-blue-300" />
                    <span>Download Gatepass CSV ({filteredExportPasses.length})</span>
                  </button>

                  <button
                    onClick={exportDeptSummaryCSV}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-semibold text-xs rounded-md shadow-xs transition cursor-pointer"
                    title="Export aggregated department summary table to CSV"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                    <span>Dept Summary CSV</span>
                  </button>

                  <button
                    onClick={fetchAdminData}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-md border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                    <span className="hidden sm:inline">Refresh</span>
                  </button>
                </div>
              </div>

              {/* 1. FILTER CONTROLS TOOLBAR */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <Filter className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span>Data Filter Console</span>
                  </div>
                  {(exportDeptFilter !== "all" || exportMonthFilter !== "" || exportStatusFilter !== "all" || exportSearchQuery.trim() !== "") && (
                    <button
                      onClick={() => {
                        setExportDeptFilter("all");
                        setExportMonthFilter("");
                        setExportStatusFilter("all");
                        setExportSearchQuery("");
                      }}
                      className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      Reset All Filters
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Department Filter */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Academic Department
                    </label>
                    <select
                      value={exportDeptFilter}
                      onChange={(e) => setExportDeptFilter(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold rounded-md px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="all">All Departments (Institutional)</option>
                      {availableDepts.map((d) => (
                        <option key={d} value={d}>
                          {d} Department
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Month Filter */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Reporting Month
                    </label>
                    <select
                      value={exportMonthFilter}
                      onChange={(e) => setExportMonthFilter(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold rounded-md px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="">All Months (Cumulative)</option>
                      {availableMonths.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Pass Status Filter */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Gate Pass Status
                    </label>
                    <select
                      value={exportStatusFilter}
                      onChange={(e) => setExportStatusFilter(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold rounded-md px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="all">All Pass Statuses</option>
                      <option value="pending">Pending Review (Awaiting HOD)</option>
                      <option value="approved">Approved (Awaiting Exit)</option>
                      <option value="exited">Exited (Currently Outside)</option>
                      <option value="closed">Closed / Returned Safely</option>
                      <option value="rejected">Rejected / Cancelled</option>
                    </select>
                  </div>

                  {/* Student Search */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Search Student / Reason
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Name, Roll No, Reason..."
                        value={exportSearchQuery}
                        onChange={(e) => setExportSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs rounded-md pl-8 pr-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                      <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    </div>
                  </div>
                </div>

                {/* Active Filter Chips & Record Count */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Active View:</span>
                    <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800 font-medium">
                      Dept: {exportDeptFilter === "all" ? "All Departments" : exportDeptFilter}
                    </span>
                    <span className="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800 font-medium">
                      Month: {exportMonthFilter ? (availableMonths.find(m => m.value === exportMonthFilter)?.label || exportMonthFilter) : "All Months (Cumulative)"}
                    </span>
                    {exportStatusFilter !== "all" && (
                      <span className="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800 font-medium capitalize">
                        Status: {exportStatusFilter}
                      </span>
                    )}
                    {exportSearchQuery.trim() && (
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-medium">
                        Search: "{exportSearchQuery}"
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    Showing {filteredExportPasses.length} of {gatePassList.length} total passes
                  </div>
                </div>
              </div>

              {/* 2. DYNAMIC LIVE KPI METRICS (FILTERED) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
                {/* Total */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Filtered Total</span>
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1.5">
                    {filteredExportPasses.length}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Total matching applications</div>
                </div>

                {/* Approved */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs">
                  <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Approved</span>
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1.5">
                    {filteredExportPasses.filter(p => (p.status || "").toLowerCase() === "approved").length}
                  </div>
                  <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">Ready for campus exit</div>
                </div>

                {/* Currently Exited */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs">
                  <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Currently Out</span>
                    <Activity className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-300 mt-1.5">
                    {filteredExportPasses.filter(p => (p.status || "").toLowerCase() === "exited").length}
                  </div>
                  <div className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-0.5">Active outside campus</div>
                </div>

                {/* Returned / Closed */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs">
                  <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Returned</span>
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-blue-700 dark:text-blue-300 mt-1.5">
                    {filteredExportPasses.filter(p => ["closed", "returned"].includes((p.status || "").toLowerCase())).length}
                  </div>
                  <div className="text-[10px] text-blue-600/80 dark:text-blue-400/80 mt-0.5">Safely returned &amp; closed</div>
                </div>

                {/* Rejected / Pending */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs col-span-2 sm:col-span-1">
                  <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Rejected</span>
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-rose-700 dark:text-rose-300 mt-1.5">
                    {filteredExportPasses.filter(p => ["rejected", "cancelled"].includes((p.status || "").toLowerCase())).length}
                  </div>
                  <div className="text-[10px] text-rose-600/80 dark:text-rose-400/80 mt-0.5">Declined applications</div>
                </div>
              </div>

              {/* 3. DEPARTMENT-WISE PERFORMANCE MATRIX */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Department-Wise Performance Matrix
                    </h4>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      ({exportMonthFilter ? (availableMonths.find(m => m.value === exportMonthFilter)?.label || exportMonthFilter) : "All Months Cumulative"})
                    </span>
                  </div>
                  <button
                    onClick={exportDeptSummaryCSV}
                    className="inline-flex items-center space-x-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 self-start sm:self-auto cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export Department Matrix (CSV)</span>
                  </button>
                </div>

                {/* Matrix Table */}
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider">
                        <th className="py-2.5 px-3">Department</th>
                        <th className="py-2.5 px-3 text-center">Total Passes</th>
                        <th className="py-2.5 px-3 text-center text-emerald-700 dark:text-emerald-400">Approved</th>
                        <th className="py-2.5 px-3 text-center text-amber-700 dark:text-amber-400">Exited</th>
                        <th className="py-2.5 px-3 text-center text-blue-700 dark:text-blue-400">Returned</th>
                        <th className="py-2.5 px-3 text-center text-rose-700 dark:text-rose-400">Rejected</th>
                        <th className="py-2.5 px-3 text-center text-purple-700 dark:text-purple-400">Pending</th>
                        <th className="py-2.5 px-3 text-center">Approval Rate</th>
                        <th className="py-2.5 px-3 text-right">Quick Filter</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {deptAnalyticsSummary.map((dept) => {
                        const processed = dept.approved + dept.exited + dept.closed + dept.rejected;
                        const approvalRate = processed > 0 ? Math.round(((dept.approved + dept.exited + dept.closed) / processed) * 100) : 0;
                        const isSelected = exportDeptFilter.toLowerCase() === dept.name.toLowerCase();

                        return (
                          <tr
                            key={dept.name}
                            className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                              isSelected ? "bg-blue-50/60 dark:bg-blue-900/20 font-medium" : ""
                            }`}
                          >
                            <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white flex items-center space-x-2">
                              <span className="h-2 w-2 rounded-full bg-blue-600 inline-block" />
                              <span>{dept.name}</span>
                              {isSelected && (
                                <span className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full ml-1">
                                  ACTIVE
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-slate-800 dark:text-slate-200">
                              {dept.total}
                            </td>
                            <td className="py-2.5 px-3 text-center font-semibold text-emerald-600 dark:text-emerald-400">
                              {dept.approved}
                            </td>
                            <td className="py-2.5 px-3 text-center font-semibold text-amber-600 dark:text-amber-400">
                              {dept.exited}
                            </td>
                            <td className="py-2.5 px-3 text-center font-semibold text-blue-600 dark:text-blue-400">
                              {dept.closed}
                            </td>
                            <td className="py-2.5 px-3 text-center font-semibold text-rose-600 dark:text-rose-400">
                              {dept.rejected}
                            </td>
                            <td className="py-2.5 px-3 text-center font-semibold text-slate-500 dark:text-slate-400">
                              {dept.pending}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <div className="flex items-center justify-center space-x-1.5">
                                <div className="w-12 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className="bg-emerald-500 h-1.5 rounded-full"
                                    style={{ width: `${approvalRate}%` }}
                                  />
                                </div>
                                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                  {approvalRate}%
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() => {
                                  setExportDeptFilter(isSelected ? "all" : dept.name);
                                }}
                                className={`px-2.5 py-1 text-[11px] font-semibold rounded transition cursor-pointer ${
                                  isSelected
                                    ? "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300"
                                    : "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100"
                                }`}
                              >
                                {isSelected ? "Show All" : "Filter"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. FILTERED GATE PASS TRANSACTIONS REGISTER */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span>Filtered Gate Pass Transactions ({filteredExportPasses.length})</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Individual gatepass records matching active department and month filter criteria.
                    </p>
                  </div>

                  <button
                    onClick={exportMonthlyGatePasses}
                    disabled={filteredExportPasses.length === 0}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#0a1e33] hover:bg-[#112d4a] text-white font-semibold text-xs rounded-md shadow-xs transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed self-start sm:self-auto"
                  >
                    <Download className="h-3.5 w-3.5 text-blue-300" />
                    <span>Export Filtered Records ({filteredExportPasses.length})</span>
                  </button>
                </div>

                {/* Desktop Data Table */}
                <div className="hidden md:block overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider">
                        <th className="py-2.5 px-3">Pass ID</th>
                        <th className="py-2.5 px-3">Student Details</th>
                        <th className="py-2.5 px-3">Department</th>
                        <th className="py-2.5 px-3">Reason</th>
                        <th className="py-2.5 px-3">Exit Timing</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-center">Risk Level</th>
                        <th className="py-2.5 px-3">Date Applied</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredExportPasses.map((pass) => {
                        const statusStr = (pass.status || "").toLowerCase();
                        const statusBadge =
                          statusStr === "approved"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800"
                            : statusStr === "exited"
                            ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800"
                            : statusStr === "closed" || statusStr === "returned"
                            ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
                            : statusStr === "rejected" || statusStr === "cancelled"
                            ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800"
                            : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300";

                        return (
                          <tr key={pass.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                              #{pass.id}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-900 dark:text-white">
                                {pass.student_name}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                {pass.student_roll_no}
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                {pass.student_department || pass.department || "General"}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 max-w-[240px]">
                              <div className="font-medium text-slate-900 dark:text-slate-200 truncate" title={pass.reason}>
                                {pass.reason || "N/A"}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-[11px] text-slate-600 dark:text-slate-300 font-mono">
                              {pass.exit_marked_at || pass.exit_time || "N/A"}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${statusBadge}`}>
                                {pass.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                (pass.risk_level || "").toLowerCase() === "high"
                                  ? "bg-rose-100 text-rose-700 border border-rose-200"
                                  : "bg-slate-100 text-slate-600"
                              }`}>
                                {pass.risk_level || "Normal"}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                              {pass.created_at ? new Date(pass.created_at).toLocaleDateString() : "N/A"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Responsive Cards */}
                <div className="md:hidden space-y-2.5">
                  {filteredExportPasses.map((pass) => {
                    const statusStr = (pass.status || "").toLowerCase();
                    const statusBadge =
                      statusStr === "approved"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : statusStr === "exited"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : statusStr === "closed" || statusStr === "returned"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : statusStr === "rejected" || statusStr === "cancelled"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-slate-100 text-slate-700 border-slate-200";

                    return (
                      <div
                        key={pass.id}
                        className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                              #{pass.id}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {pass.student_name}
                            </span>
                          </div>
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider ${statusBadge}`}>
                            {pass.status}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="font-mono">{pass.student_roll_no}</span>
                          <span>•</span>
                          <span className="font-semibold text-blue-600 dark:text-blue-400">
                            {pass.student_department || pass.department || "General"}
                          </span>
                        </div>

                        <div className="text-slate-700 dark:text-slate-300">
                          <strong>Reason:</strong> {pass.reason || "N/A"}
                        </div>

                        <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700/60 font-mono">
                          Exit Time: <span className="font-semibold text-slate-700 dark:text-slate-300">{pass.exit_marked_at || pass.exit_time || "N/A"}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredExportPasses.length === 0 && (
                  <div className="text-center py-10 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 space-y-2">
                    <AlertCircle className="h-8 w-8 text-slate-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      No gate pass transactions match the selected Department and Month criteria.
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Try selecting "All Departments" or "All Months" to inspect cumulative institutional records.
                    </p>
                    <button
                      onClick={() => {
                        setExportDeptFilter("all");
                        setExportMonthFilter("");
                        setExportStatusFilter("all");
                        setExportSearchQuery("");
                      }}
                      className="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md transition cursor-pointer"
                    >
                      Clear Active Filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 11: AUDIT ACTIVITY LOGS */}
          {activeTab === "logs" && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span>System Audit Trail &amp; Security Logs</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Live chronological event trace and access transactions
                  </p>
                </div>
                <span className="self-start sm:self-auto text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                  Recent {logs.length} transactions
                </span>
              </div>

              <div className="bg-[#0a1e33] text-slate-200 rounded-xl p-2 sm:p-3.5 overflow-y-auto max-h-[520px] divide-y divide-slate-800/80 border border-slate-800 shadow-sm">
                {logs.map((log) => {
                  const roleStr = (log.role || "").toLowerCase();
                  const roleBadgeClass = roleStr.includes("admin")
                    ? "bg-blue-500/20 text-blue-300 border-blue-400/30"
                    : roleStr.includes("hod")
                    ? "bg-purple-500/20 text-purple-300 border-purple-400/30"
                    : roleStr.includes("teacher")
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
                    : roleStr.includes("guard")
                    ? "bg-amber-500/20 text-amber-300 border-amber-400/30"
                    : roleStr.includes("principal")
                    ? "bg-indigo-500/20 text-indigo-300 border-indigo-400/30"
                    : "bg-slate-800 text-slate-300 border-slate-700";

                  return (
                    <div
                      key={log.id}
                      className="py-2 px-1.5 sm:px-2 hover:bg-white/[0.04] rounded-lg transition-colors flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2.5 text-xs"
                    >
                      {/* Meta header row (Timestamp + Role Badge + User Name) */}
                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                        <span className="text-slate-400 font-mono text-[10px] sm:text-[11px]">
                          [{new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}]
                        </span>
                        <span className={`uppercase font-extrabold text-[9px] px-1.5 py-0.5 rounded border tracking-wider ${roleBadgeClass}`}>
                          {log.role}
                        </span>
                        <span className="text-emerald-400 dark:text-emerald-300 font-bold text-xs">
                          {log.user_name}:
                        </span>
                      </div>

                      {/* Log Action Details */}
                      <div className="flex-1 min-w-0 text-slate-200 text-xs sm:text-[11px] leading-relaxed break-words pl-0.5 sm:pl-0 font-sans">
                        {log.action}
                      </div>
                    </div>
                  );
                })}

                {logs.length === 0 && (
                  <div className="text-slate-400 text-center py-10 text-xs">
                    No audit transactions recorded in system register.
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
