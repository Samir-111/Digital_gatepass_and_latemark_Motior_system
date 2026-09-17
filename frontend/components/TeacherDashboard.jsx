/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect } from "react";
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  Calendar,
  Clock,
  LogOut,
  CheckCircle,
  Download,
  ShieldAlert,
  Check,
  X,
  FileText,
  QrCode,
  PlusCircle,
  Award,
  Sun,
  Moon,
  Sparkles,
  GraduationCap,
  Building2,
  Phone,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Send,
  AlertTriangle,
  UserCheck
} from "lucide-react";
import { gatepassService } from "../services/gatepassService.js";
import sbjainLogo from "../assets/sbjain-logo.png";

export default function TeacherDashboard({ user, onLogout, isDarkMode, onToggleTheme }) {
  const [activeTab, setActiveTab] = useState("gatepasses");
  const [lateEntries, setLateEntries] = useState([]);
  const [gatePasses, setGatePasses] = useState([]);
  const [myStudents, setMyStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toLocaleString("default", { month: "long" })
  );
  const [smsSending, setSmsSending] = useState({});
  const [smsSent, setSmsSent] = useState({});
  const [smsLogs, setSmsLogs] = useState([]);
  const [teacherRemarks, setTeacherRemarks] = useState({});
  const [processingPassId, setProcessingPassId] = useState(null);

  // Faculty Gatepass State
  const getTodayLocalDateStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const [myFacultyPasses, setMyFacultyPasses] = useState([]);
  const [applyReason, setApplyReason] = useState("");
  const [applyDestination, setApplyDestination] = useState("");
  const [applyExitDate, setApplyExitDate] = useState(getTodayLocalDateStr());
  const [applyExitTimeOnly, setApplyExitTimeOnly] = useState("10:00");
  const [applyExitTime, setApplyExitTime] = useState("");
  const [applyReturnTime, setApplyReturnTime] = useState("");
  const [applyVehicleNo, setApplyVehicleNo] = useState("");
  const [applyRemarks, setApplyRemarks] = useState("");
  const [applying, setApplying] = useState(false);
  const [applyMsg, setApplyMsg] = useState(null);
  const [applyErr, setApplyErr] = useState(null);
  const [qrModalPass, setQrModalPass] = useState(null);

  // Teacher Staff Late Mark State
  const [staffLateDate, setStaffLateDate] = useState(getTodayLocalDateStr());
  const [staffLateTimeOnly, setStaffLateTimeOnly] = useState("09:30");
  const [staffLateReason, setStaffLateReason] = useState("");
  const [staffLateRemarks, setStaffLateRemarks] = useState("");
  const [submittingStaffLate, setSubmittingStaffLate] = useState(false);
  const [staffLateMsg, setStaffLateMsg] = useState(null);
  const [staffLateErr, setStaffLateErr] = useState(null);

  const months = [
    "All Months",
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const entries = await gatepassService.getLateComeEntries();
      setLateEntries(entries || []);
      const students = await gatepassService.getTeacherStudents();
      setMyStudents(students || []);
      const passes = await gatepassService.getTeacherGatePasses();
      setGatePasses(passes || []);
      const facPasses = await gatepassService.getFacultyGatePasses().catch(() => []);
      setMyFacultyPasses(facPasses || []);
    } catch (err) {
      console.error("Failed to load teacher dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFacultyPass = async (e) => {
    e.preventDefault();
    const fullExitTime = applyExitDate && applyExitTimeOnly ? `${applyExitDate}T${applyExitTimeOnly}` : applyExitTime;
    if (!applyReason || !fullExitTime) {
      setApplyErr("Reason for outing and leaving date & time are required.");
      return;
    }
    setApplying(true);
    setApplyErr(null);
    setApplyMsg(null);
    try {
      await gatepassService.applyFacultyGatePass({
        reason: applyReason,
        destination: applyDestination,
        exit_time: fullExitTime,
        return_time: applyReturnTime,
        vehicle_no: applyVehicleNo,
        remarks: applyRemarks
      });
      setApplyMsg("Faculty Gate Pass request submitted! Sent to Principal for authorization.");
      setApplyReason("");
      setApplyDestination("");
      setApplyExitDate(getTodayLocalDateStr());
      setApplyExitTimeOnly("10:00");
      setApplyExitTime("");
      setApplyReturnTime("");
      setApplyVehicleNo("");
      setApplyRemarks("");
      fetchData();
    } catch (err) {
      setApplyErr(err.message || "Failed to submit faculty gate pass request.");
    } finally {
      setApplying(false);
    }
  };

  const handleApplyStaffLateMark = async (e) => {
    e.preventDefault();
    if (!staffLateReason || staffLateReason.trim() === "") {
      setStaffLateErr("Reason for late arrival is required.");
      return;
    }
    setSubmittingStaffLate(true);
    setStaffLateErr(null);
    setStaffLateMsg(null);
    try {
      const currentTimestamp = new Date().toISOString();
      await gatepassService.applyFacultyGatePass({
        reason: `[TEACHER LATE MARK] ${staffLateReason.trim()}`,
        destination: "Late Arrival at College",
        exit_time: currentTimestamp,
        remarks: staffLateRemarks ? `Teacher Late Entry: ${staffLateRemarks.trim()}` : "Teacher Staff Late Arrival Mark",
      });
      setStaffLateMsg("Teacher Staff Late Mark recorded successfully with live timestamp!");
      setStaffLateReason("");
      setStaffLateRemarks("");
      fetchData();
    } catch (err) {
      setStaffLateErr(err.message || "Failed to submit late mark request.");
    } finally {
      setSubmittingStaffLate(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSendSMS = async (entryId, parentPhone, studentName, arrivalTime) => {
    setSmsSending((prev) => ({ ...prev, [entryId]: true }));
    try {
      await gatepassService.sendWarningSMS({
        entryId,
        parentPhone,
        studentName,
        arrivalTime,
        teacherName: user.name,
        className: user.class_name
      });
      setSmsSent((prev) => ({ ...prev, [entryId]: true }));
      setSmsLogs((prev) => [
        {
          id: entryId + Date.now(),
          studentName,
          parentPhone,
          sentAt: new Date().toLocaleTimeString(),
          status: "Delivered"
        },
        ...prev
      ]);
    } catch (err) {
      alert(err.message || "Failed to dispatch warning SMS.");
    } finally {
      setSmsSending((prev) => ({ ...prev, [entryId]: false }));
    }
  };

  const handleApprovePass = async (passId) => {
    setProcessingPassId(passId);
    try {
      const remarks = teacherRemarks[passId] || "Approved by Class Teacher";
      await gatepassService.approveGatePassTeacher(passId, remarks);
      setGatePasses((prev) => prev.map((p) => p.id === passId ? { ...p, status: "pending_hod", remarks } : p));
      await fetchData();
      alert("GatePass approved successfully and forwarded to HOD!");
    } catch (err) {
      alert(err.message || "Failed to approve gatepass.");
      await fetchData();
    } finally {
      setProcessingPassId(null);
    }
  };

  const handleRejectPass = async (passId) => {
    const remarks = teacherRemarks[passId];
    if (!remarks || remarks.trim() === "") {
      alert("Please provide a reason / remarks for rejecting the gate pass.");
      return;
    }
    setProcessingPassId(passId);
    try {
      await gatepassService.rejectGatePassTeacher(passId, remarks);
      setGatePasses((prev) => prev.map((p) => p.id === passId ? { ...p, status: "rejected", remarks } : p));
      await fetchData();
      alert("GatePass rejected.");
    } catch (err) {
      alert(err.message || "Failed to reject gatepass.");
      await fetchData();
    } finally {
      setProcessingPassId(null);
    }
  };

  const matchMonth = (dateStr, monthName) => {
    if (monthName === "All Months") return true;
    try {
      const entryDate = new Date(dateStr);
      const entryMonth = entryDate.toLocaleString("default", { month: "long" });
      return entryMonth.toLowerCase() === monthName.toLowerCase();
    } catch {
      return false;
    }
  };

  const filteredEntries = lateEntries.filter((entry) => {
    const sName = entry.student_name?.toLowerCase() || "";
    const sRoll = entry.student_roll_no?.toLowerCase() || "";
    const sDept = entry.student_department?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();
    const matchesSearch = sName.includes(query) || sRoll.includes(query) || sDept.includes(query);
    const matchesMonth = matchMonth(entry.arrival_time, selectedMonth);
    return matchesSearch && matchesMonth;
  });

  const filteredGatePasses = gatePasses.filter((pass) => {
    const sName = pass.student_name?.toLowerCase() || "";
    const sRoll = pass.student_roll_no?.toLowerCase() || "";
    const reason = pass.reason?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();
    return sName.includes(query) || sRoll.includes(query) || reason.includes(query);
  });

  const todayStr = new Date().toDateString();
  const todayLateCount = lateEntries.filter((e) => {
    try {
      return new Date(e.arrival_time).toDateString() === todayStr;
    } catch {
      return false;
    }
  }).length;
  const monthLateCount = lateEntries.filter((e) => matchMonth(e.arrival_time, selectedMonth)).length;

  const handleExportCSV = () => {
    if (filteredEntries.length === 0) {
      alert("No records available to export for the selected filters.");
      return;
    }
    const headers = ["Roll Number", "Student Name", "Department", "Date of Entry", "Arrival Time", "Reason", "Parent Mobile No.", "SMS Warning Status"];
    const rows = filteredEntries.map((entry) => {
      const entryDate = new Date(entry.arrival_time);
      return [
        `"${entry.student_roll_no || ""}"`,
        `"${entry.student_name || ""}"`,
        `"${entry.student_department || ""}"`,
        `"${entryDate.toLocaleDateString()}"`,
        `"${entryDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}"`,
        `"${entry.reason || ""}"`,
        `"${entry.parent_phone || "Not Available"}"`,
        `"${smsSent[entry.id] ? "Sent" : "Pending"}"`
      ];
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const fileName = `Late_Arrivals_${selectedMonth.replace(" ", "_")}_Report.csv`;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const pendingPasses = filteredGatePasses.filter((p) => p.status === "pending");
  const activeGatePassKPI = gatePasses.filter((p) => p.status === "pending").length;
  const forwardedGatePassKPI = gatePasses.filter((p) => p.status === "pending_hod").length;
  const historicalPasses = filteredGatePasses.filter((p) => p.status !== "pending");
  const isClassIncharge = true;

  return (
    <div className="min-h-screen bg-[#f0f5fa] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans pb-20 sm:pb-12 transition-colors">
      {/* 1. Upper Navigation Bar (Dark Navy Header matching Admin & Student portals) */}
      <header className="bg-[#0a1e33] border-b border-[#081726] sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center min-h-[3.75rem] sm:min-h-16 py-2.5 sm:py-3 gap-2 sm:gap-4">
            {/* Branding Identity */}
            <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0">
              <div className="h-9 w-9 sm:h-11 sm:w-11 bg-white rounded-xl p-1 border border-white/20 shadow-xs flex items-center justify-center shrink-0">
                <img src={sbjainLogo} alt="SB Jain Logo" className="h-7 w-7 sm:h-9 sm:w-9 object-contain" />
              </div>
              <div className="min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <h1 className="text-xs sm:text-sm md:text-base font-extrabold text-white tracking-tight leading-tight truncate drop-shadow-xs">
                    S. B. Jain Institute of Technology
                  </h1>
                  <span className="hidden sm:inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border shrink-0 bg-emerald-500/20 text-emerald-300 border-emerald-400/30">
                    CLASS INCHARGE &amp; FACULTY PORTAL
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-300 font-medium truncate mt-0.5">
                  <span className="sm:hidden text-emerald-300 font-semibold">Teacher Portal • </span>Nagpur
                </p>
              </div>
            </div>

            {/* Right Controls: User Profile + Theme Toggle + Logout */}
            <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
              {/* User preview */}
              <div className="hidden md:flex items-center space-x-2.5 pl-2 pr-1">
                <div className="h-8 w-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-emerald-300">
                  <UserCheck className="h-4 w-4" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-white leading-tight flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{user?.name}</span>
                  </span>
                  <span className="text-[10px] text-slate-300 font-medium">
                    {user?.class_name ? `Class Incharge • ${user?.class_name}` : `Faculty • ${user?.department || "Academics"}`}
                  </span>
                </div>
              </div>

              <div className="h-6 w-px bg-white/15 hidden md:block" />

              {/* Theme Toggle Button */}
              {onToggleTheme && (
                <button
                  type="button"
                  onClick={onToggleTheme}
                  title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                  className="p-1.5 sm:p-2 rounded-lg border border-white/15 text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
                  aria-label="Toggle theme"
                >
                  {isDarkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-300" />}
                </button>
              )}

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="inline-flex items-center p-1.5 sm:px-3 sm:py-1.5 border border-white/20 text-xs font-semibold rounded-lg text-white bg-white/10 hover:bg-white/20 transition cursor-pointer gap-1.5"
                title="Sign out of Session"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-20 sm:pb-12">
        {/* 2. Faculty / Class Incharge Profile Card */}
        <div className="bg-white dark:bg-[#0b132b] border border-slate-200/80 dark:border-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4 transition-all">
          <div className="flex items-start sm:items-center gap-3.5 sm:gap-4">
            <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[#0a1e33] dark:text-blue-400 shrink-0 shadow-xs">
              <Award className="h-6 w-6 sm:h-7 sm:w-7 text-[#0a1e33] dark:text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Welcome back, {user?.name}!
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                  <ShieldCheck className="h-3 w-3" />
                  <span>Class Incharge &amp; Faculty</span>
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  <span>Department: <strong className="text-slate-700 dark:text-slate-200">{user?.department || "Engineering & Technology"}</strong></span>
                </span>
                {user?.class_name && (
                  <span className="flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Assigned Class: <strong className="text-emerald-700 dark:text-emerald-300">{user?.class_name}</strong></span>
                  </span>
                )}
                {user?.email && (
                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span>{user.email}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 transition cursor-pointer shadow-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh Records</span>
            </button>
          </div>
        </div>

        {/* 3. Modern Tab Navigation Header */}
        <div className="flex items-center overflow-x-auto no-scrollbar border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0b132b] p-1.5 rounded-2xl shadow-sm gap-1.5 whitespace-nowrap max-w-full">
          <button
            onClick={() => setActiveTab("gatepasses")}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === "gatepasses"
                ? "bg-[#0a1e33] dark:bg-blue-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Student GatePass Approvals</span>
            {activeGatePassKPI > 0 ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold bg-amber-500 text-white animate-pulse">
                {activeGatePassKPI} Pending
              </span>
            ) : (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                activeTab === "gatepasses" ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              }`}>
                0
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("faculty")}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === "faculty"
                ? "bg-[#0a1e33] dark:bg-blue-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60"
            }`}
          >
            <Award className="h-4 w-4" />
            <span>Staff Outing &amp; Late Mark</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
              activeTab === "faculty" ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            }`}>
              {myFacultyPasses.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("late")}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === "late"
                ? "bg-[#0a1e33] dark:bg-blue-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60"
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Student Late Logs</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
              activeTab === "late" ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            }`}>
              {lateEntries.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("students")}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === "students"
                ? "bg-[#0a1e33] dark:bg-blue-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Class Roll Registry</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
              activeTab === "students" ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            }`}>
              {myStudents.length}
            </span>
          </button>
        </div>

        {/* 4. Analytics KPI Grid for GatePasses */}
        {activeTab === "gatepasses" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-5 animate-fade-in">
            <div className="bg-white dark:bg-[#0b132b] border border-slate-200/80 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] sm:text-[11px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider block">
                  Pending My Clearance
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5 sm:mt-1">
                  {activeGatePassKPI}
                </h2>
                <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                  Awaiting review
                </p>
              </div>
              <div className="p-2 sm:p-3.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl sm:rounded-2xl border border-amber-100 dark:border-amber-800/60 shrink-0">
                <FileText className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-[#0b132b] border border-slate-200/80 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] sm:text-[11px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider block">
                  Forwarded to HOD
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 mt-0.5 sm:mt-1">
                  {forwardedGatePassKPI}
                </h2>
                <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                  Sent for HOD sign-off
                </p>
              </div>
              <div className="p-2 sm:p-3.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl sm:rounded-2xl border border-blue-100 dark:border-blue-800/60 shrink-0">
                <Users className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-white dark:bg-[#0b132b] border border-slate-200/80 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] sm:text-[11px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider block">
                  Total Applications
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5 sm:mt-1">
                  {gatePasses.length}
                </h2>
                <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                  Total student outing requests
                </p>
              </div>
              <div className="p-2 sm:p-3.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-700 shrink-0">
                <CheckCircle className="h-4 w-4 sm:h-6 sm:w-6 text-emerald-500" />
              </div>
            </div>
          </div>
        )}

        {/* Analytics KPI Grid for Late Comers */}
        {activeTab === "late" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-fade-in">
            <div className="bg-white dark:bg-[#0b132b] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider block">
                  Today's Late Comers
                </span>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{todayLateCount}</h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  First lecture late entries logged today
                </p>
              </div>
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-100 dark:border-emerald-800/60">
                <Clock className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-[#0b132b] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider block">
                  Monthly Late Entries ({selectedMonth})
                </span>
                <h2 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{monthLateCount}</h2>
                <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-0.5 font-semibold">
                  Total filtered logs for {selectedMonth}
                </p>
              </div>
              <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-indigo-800/60">
                <Calendar className="h-6 w-6" />
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: FACULTY STAFF GATEPASS & LATE MARK */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "faculty" && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Form 1: Faculty Outing Pass */}
              <div className="bg-white dark:bg-[#0b132b] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
                      Apply for Faculty Gate Pass
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Submit official outing or campus exit request for Principal authorization.
                    </p>
                  </div>
                </div>

                {applyMsg && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>{applyMsg}</span>
                  </div>
                )}

                {applyErr && (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                    <span>{applyErr}</span>
                  </div>
                )}

                <form onSubmit={handleApplyFacultyPass} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Reason for Outing / Gate Pass <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Official Meeting, Personal Work, University Exam Duty"
                      value={applyReason}
                      onChange={(e) => setApplyReason(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Exit Date <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        min={getTodayLocalDateStr()}
                        value={applyExitDate}
                        onChange={(e) => setApplyExitDate(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Exit Time <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="time"
                        required
                        value={applyExitTimeOnly}
                        onChange={(e) => setApplyExitTimeOnly(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Vehicle No. (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. MH-31 AB-1234"
                      value={applyVehicleNo}
                      onChange={(e) => setApplyVehicleNo(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Additional Remarks (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Approved adjustment note attached..."
                      value={applyRemarks}
                      onChange={(e) => setApplyRemarks(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={applying}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#0a1e33] hover:bg-[#112d4e] dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {applying ? <RefreshCw className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                      <span>Submit Outing Request</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Form 2: Teacher Staff Late Mark Form */}
              <div className="bg-white dark:bg-[#0b132b] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
                      Log Teacher Staff Late Mark
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Submit late arrival record for institutional attendance register &amp; administrative log.
                    </p>
                  </div>
                </div>

                {staffLateMsg && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>{staffLateMsg}</span>
                  </div>
                )}

                {staffLateErr && (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                    <span>{staffLateErr}</span>
                  </div>
                )}

                <form onSubmit={handleApplyStaffLateMark} className="space-y-4 text-xs">
                  <div className="p-3.5 bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/20 dark:border-indigo-500/30 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                        </span>
                        <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider">
                          Auto-Captured Timestamp
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold bg-indigo-200/60 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 px-2 py-0.5 rounded-md">
                        Live System Time
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono mt-2">
                      📅 {new Date().toLocaleDateString("en-IN", { dateStyle: "medium" })} &nbsp;|&nbsp; ⏰ {new Date().toLocaleTimeString("en-IN", { timeStyle: "short" })}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      System automatically logs your exact date &amp; time upon submission.
                    </p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Reason for Late Arrival <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="e.g. Heavy Traffic, Vehicle Breakdown, University Exam Duty, Emergency..."
                      value={staffLateReason}
                      onChange={(e) => setStaffLateReason(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium leading-relaxed placeholder-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Additional Remarks (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Informed HOD over phone..."
                      value={staffLateRemarks}
                      onChange={(e) => setStaffLateRemarks(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium placeholder-slate-400"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingStaffLate}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {submittingStaffLate ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
                      <span>Submit Late Mark</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* My Faculty GatePasses History List */}
            <div className="bg-white dark:bg-[#0b132b] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100">
                    My Staff GatePass History
                  </h3>
                  <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-full text-xs font-bold border border-blue-100 dark:border-blue-900/50">
                    {myFacultyPasses.length} Total
                  </span>
                </div>
              </div>

              {myFacultyPasses.length === 0 ? (
                <div className="py-12 text-center">
                  <AlertCircle className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    No faculty gate pass records found.
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                    Submit a new request using the form above.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myFacultyPasses.map((pass) => (
                    <div
                      key={pass.id}
                      className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between shadow-xs"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${
                              pass.status === "approved"
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                : pass.status === "pending_principal"
                                ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                                : pass.status === "rejected"
                                ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                                : pass.status === "exited"
                                ? "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            {pass.status === "pending_principal"
                              ? "Pending Principal Approval"
                              : pass.status}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                            {new Date(pass.created_at || pass.exit_time).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                              year: "numeric"
                            })}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{pass.reason}</h4>

                        <div className="mt-3 text-xs space-y-1 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 font-medium">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 dark:text-slate-400">Exit Window:</span>
                            <span className="font-mono text-slate-800 dark:text-slate-100 font-bold">
                              {new Date(pass.exit_time).toLocaleString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true
                              })}
                            </span>
                          </div>
                          {pass.return_time && (
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400 dark:text-slate-400">Expected Return:</span>
                              <span className="font-mono text-slate-800 dark:text-slate-100">
                                {new Date(pass.return_time).toLocaleString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true
                                })}
                              </span>
                            </div>
                          )}
                          {pass.vehicle_no && (
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400 dark:text-slate-400">Vehicle:</span>
                              <span className="font-mono text-slate-800 dark:text-slate-100 uppercase">
                                {pass.vehicle_no}
                              </span>
                            </div>
                          )}
                          {pass.remarks && (
                            <div className="text-slate-500 dark:text-slate-400 italic pt-1.5 border-t border-slate-100 dark:border-slate-700">
                              Remarks: "{pass.remarks}"
                            </div>
                          )}
                        </div>
                      </div>

                      {pass.qr_code && pass.status !== "exited" && (
                        <div className="pt-3">
                          <button
                            onClick={() => setQrModalPass(pass)}
                            className="w-full py-2.5 px-3 rounded-xl bg-[#0a1e33] hover:bg-[#112d4e] dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                          >
                            <QrCode className="h-4 w-4 text-emerald-400" />
                            <span>View Digital QR Pass</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* QR Pass View Modal */}
            {qrModalPass && (
              <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white dark:bg-[#0b132b] rounded-3xl w-full max-w-sm p-6 shadow-2xl text-center space-y-4 relative border border-slate-200 dark:border-slate-800 animate-scale-up">
                  <button
                    onClick={() => setQrModalPass(null)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>

                  <div className="inline-flex p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                    <Award className="h-7 w-7" />
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">Faculty Digital Gate Pass</h3>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                      Authorized &amp; Valid for Campus Exit
                    </p>
                  </div>

                  {qrModalPass.qr_code && (
                    <div className="p-3 bg-white rounded-2xl border-4 border-slate-900 dark:border-slate-700 inline-block mx-auto shadow-inner">
                      <img src={qrModalPass.qr_code} alt="QR Pass" className="w-44 h-44 mx-auto" />
                    </div>
                  )}

                  <div className="text-left bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-1.5 font-medium">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">Faculty Name:</span>
                      <span className="text-slate-900 dark:text-slate-100 font-bold">{qrModalPass.faculty_name || user.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">Department:</span>
                      <span className="text-slate-700 dark:text-slate-300">{qrModalPass.faculty_department || user.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">Reason:</span>
                      <span className="text-blue-700 dark:text-blue-400 font-bold">{qrModalPass.reason}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">Exit Window:</span>
                      <span className="text-slate-800 dark:text-slate-200 font-mono font-bold">
                        {new Date(qrModalPass.exit_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => window.print()}
                    className="w-full py-2.5 rounded-xl bg-[#0a1e33] hover:bg-[#112d4e] dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    <Download className="h-4 w-4 text-emerald-400" />
                    <span>Print / Save Gate Pass</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: STUDENT GATEPASS APPROVALS */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "gatepasses" && (
          <div className="space-y-6 animate-fade-in">
            {/* Protocol Banner */}
            <div className="bg-blue-50 dark:bg-blue-950/40 border-l-4 border-blue-500 p-4 rounded-r-2xl shadow-xs flex items-start space-x-3">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h4 className="text-xs font-black text-blue-900 dark:text-blue-200 uppercase tracking-wider">
                  Tiered Outing Protocol Clearance
                </h4>
                <p className="text-xs text-blue-800 dark:text-blue-300 font-medium leading-relaxed">
                  As the designated <strong>Class Incharge</strong>, your clearance verifies the academic validity of the outing request before forwarding it to the student's selected <strong>Head of Department (HOD)</strong> for final security clearance.
                </p>
              </div>
            </div>

            {/* Pending Requests Section */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100">
                    Pending My Clearance
                  </h3>
                  <span className="px-2.5 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 rounded-full text-xs font-bold border border-amber-200 dark:border-amber-800/60">
                    {pendingPasses.length} Requests
                  </span>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search name, roll, reason..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-1.5 w-full sm:w-64 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#0b132b] text-slate-800 dark:text-slate-100 shadow-xs"
                  />
                </div>
              </div>

              {pendingPasses.length === 0 ? (
                <div className="bg-white dark:bg-[#0b132b] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center shadow-sm">
                  <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
                  <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">
                    All caught up! No pending gate pass requests awaiting your clearance.
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                    When students in your class submit an outing application, it will appear here for verification.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pendingPasses.map((pass) => (
                    <div
                      key={pass.id}
                      className="bg-white dark:bg-[#0b132b] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between"
                    >
                      <div className="p-5 border-b border-slate-100 dark:border-slate-800 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                              Application #{pass.id}
                            </span>
                            <h3 className="text-base font-black text-slate-900 dark:text-slate-100 mt-0.5">
                              {pass.student_name}
                            </h3>
                            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase mt-0.5 block">
                              Roll: <strong className="text-slate-800 dark:text-slate-200">{pass.student_roll_no}</strong> | {pass.student_department}
                            </span>
                          </div>

                          {pass.risk_level && (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${
                                pass.risk_level === "high"
                                  ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                                  : pass.risk_level === "medium"
                                  ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                                  : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                              }`}
                            >
                              <Sparkles className="h-3 w-3" />
                              <span>Risk: {pass.risk_level}</span>
                            </span>
                          )}
                        </div>

                        {pass.risk_remarks && (
                          <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700 font-medium italic">
                            "AI Note: {pass.risk_remarks}"
                          </div>
                        )}

                        <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300 pt-1">
                          <div className="bg-slate-50/50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60">
                            <span className="font-bold text-slate-400 dark:text-slate-400 uppercase text-[10px] block mb-0.5">
                              Reason for Outing
                            </span>
                            <span className="font-semibold text-slate-800 dark:text-slate-100">
                              {pass.reason}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-[11px] pt-1">
                            <span className="text-slate-400">Exit Window Expected:</span>
                            <span className="font-mono text-slate-800 dark:text-slate-200 font-bold">
                              {new Date(pass.exit_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ({new Date(pass.exit_time).toLocaleDateString([], { month: "short", day: "numeric" })})
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-slate-400">Designated HOD:</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400">
                              {pass.selected_hod_name || "Department HOD"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action & Remarks Footer */}
                      <div className="p-4 bg-slate-50/70 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 space-y-3">
                        <div>
                          <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-400 mb-1 block">
                            Clearance Remarks (Mandatory for rejection)
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Add notes, conditions, or reason for decision..."
                            value={teacherRemarks[pass.id] || ""}
                            onChange={(e) =>
                              setTeacherRemarks((prev) => ({ ...prev, [pass.id]: e.target.value }))
                            }
                            className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0b132b] text-slate-800 dark:text-slate-100 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                          />
                        </div>

                        <div className="flex items-center space-x-2 pt-1">
                          <button
                            onClick={() => handleRejectPass(pass.id)}
                            disabled={processingPassId !== null}
                            className="flex-1 py-2.5 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-800 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-center space-x-1.5 shadow-xs"
                          >
                            <X className="h-4 w-4" />
                            <span>Reject Outing</span>
                          </button>

                          <button
                            onClick={() => handleApprovePass(pass.id)}
                            disabled={processingPassId !== null}
                            className="flex-1 py-2.5 bg-[#0a1e33] hover:bg-[#112d4e] dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl text-xs font-extrabold shadow-sm transition cursor-pointer flex items-center justify-center space-x-1.5"
                          >
                            <Check className="h-4 w-4 text-emerald-400" />
                            <span>Approve &amp; Forward</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Clearances History / Archive */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100">
                  Clearances History &amp; Decisions Archive
                </h3>
                <span className="text-xs text-slate-400 font-medium">
                  {historicalPasses.length} Processed
                </span>
              </div>

              {historicalPasses.length === 0 ? (
                <div className="bg-white dark:bg-[#0b132b] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-8 text-center shadow-sm">
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                    No historical gatepass application clearances found.
                  </p>
                </div>
              ) : (
                <div className="bg-white dark:bg-[#0b132b] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                  {/* Mobile Card Layout (block sm:hidden) */}
                  <div className="block sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
                    {historicalPasses.map((pass) => (
                      <div key={pass.id} className="p-3.5 space-y-2 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="font-extrabold text-xs text-slate-900 dark:text-white block leading-tight truncate">
                              {pass.student_name}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase">
                              Roll: <strong className="text-slate-700 dark:text-slate-300">{pass.student_roll_no}</strong>
                            </span>
                          </div>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase border shrink-0 ${
                              pass.status === "approved"
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                : pass.status === "pending_hod"
                                ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                                : pass.status === "rejected"
                                ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            {pass.status === "pending_hod" ? "Forwarded to HOD" : pass.status}
                          </span>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 text-xs text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700/60">
                          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 block mb-0.5">
                            Reason
                          </span>
                          <p className="leading-snug">{pass.reason}</p>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-400 pt-0.5">
                          <span>
                            Outing: <strong className="text-slate-700 dark:text-slate-300 font-mono">{new Date(pass.exit_time).toLocaleDateString([], { month: "short", day: "numeric" })} {new Date(pass.exit_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</strong>
                          </span>
                          {pass.remarks && (
                            <span className="italic truncate max-w-[130px]" title={pass.remarks}>
                              "{pass.remarks}"
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View (hidden sm:block) */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/70 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                        <tr>
                          <th className="px-6 py-3.5 text-left">Student Info</th>
                          <th className="px-6 py-3.5 text-left">Reason</th>
                          <th className="px-6 py-3.5 text-left">Expected Outing</th>
                          <th className="px-6 py-3.5 text-left">Status</th>
                          <th className="px-6 py-3.5 text-left">My Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-[#0b132b]">
                        {historicalPasses.map((pass) => (
                          <tr key={pass.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900 dark:text-slate-100">
                                  {pass.student_name}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase">
                                  {pass.student_roll_no}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 max-w-xs truncate">{pass.reason}</td>
                            <td className="px-6 py-4 font-mono text-slate-500 dark:text-slate-400">
                              {new Date(pass.exit_time).toLocaleDateString([], { month: "short", day: "numeric" })} at {new Date(pass.exit_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${
                                  pass.status === "approved"
                                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                    : pass.status === "pending_hod"
                                    ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                                    : pass.status === "rejected"
                                    ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                                }`}
                              >
                                {pass.status === "pending_hod" ? "Forwarded to HOD" : pass.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 italic text-slate-500 dark:text-slate-400">
                              "{pass.remarks || "None"}"
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: STUDENT LATE COMERS MONITORING */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "late" && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white dark:bg-[#0b132b] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col">
                  <h3 className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100">
                    Late Attendance Monitoring Center
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    Filter late come records by month and search by student name or roll number.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search name, roll..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-1.5 w-44 sm:w-48 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-xs"
                    />
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <Filter className="h-3.5 w-3.5 text-slate-400" />
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="border border-slate-200 dark:border-slate-700 rounded-xl py-1.5 px-3 text-xs font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                    >
                      {months.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleExportCSV}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#0a1e33] hover:bg-[#112d4e] dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-blue-400" />
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Querying late student records...
                  </p>
                </div>
              ) : filteredEntries.length === 0 ? (
                <div className="py-16 text-center">
                  <AlertCircle className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="mt-3 text-xs font-bold text-slate-600 dark:text-slate-300">
                    No late come entries found matching current parameters.
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                    Try selecting another month or clearing the search query.
                  </p>
                </div>
              ) : (
                <div>
                  {/* Mobile Card Layout (block sm:hidden) */}
                  <div className="block sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredEntries.map((entry) => {
                      const entryDate = new Date(entry.arrival_time);
                      const formattedDate = entryDate.toLocaleDateString("default", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      });
                      const formattedTime = entryDate.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit"
                      });
                      return (
                        <div key={entry.id} className="p-3.5 space-y-2 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="font-extrabold text-xs text-slate-900 dark:text-white block leading-tight">
                                {entry.student_name}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase">
                                Roll: <strong className="text-slate-700 dark:text-slate-300">{entry.student_roll_no}</strong> | {entry.student_department}
                              </span>
                            </div>
                            <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-lg border border-rose-100 dark:border-rose-900/50 shrink-0">
                              <Clock className="h-3 w-3 shrink-0" />
                              <span>{formattedTime}</span>
                            </span>
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 text-xs text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700/60">
                            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 block mb-0.5">
                              Reason
                            </span>
                            <p className="leading-snug">{entry.reason}</p>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 pt-0.5">
                            <span>Date: <strong className="text-slate-700 dark:text-slate-300">{formattedDate}</strong></span>
                            {entry.parent_phone && (
                              <span className="font-mono">Parent: {entry.parent_phone}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop Table View (hidden sm:block) */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                      <thead className="bg-slate-50 dark:bg-slate-800/70 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                        <tr>
                          <th scope="col" className="px-6 py-3.5 text-left">Student Info</th>
                          <th scope="col" className="px-6 py-3.5 text-left">Academic Dept</th>
                          <th scope="col" className="px-6 py-3.5 text-left">Log Date</th>
                          <th scope="col" className="px-6 py-3.5 text-left">Arrival Time</th>
                          <th scope="col" className="px-6 py-3.5 text-left">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-[#0b132b] divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-200">
                        {filteredEntries.map((entry) => {
                          const entryDate = new Date(entry.arrival_time);
                          const formattedDate = entryDate.toLocaleDateString("default", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                          });
                          const formattedTime = entryDate.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit"
                          });
                          return (
                            <tr key={entry.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-col">
                                  <span className="font-bold text-slate-900 dark:text-slate-100">
                                    {entry.student_name}
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase mt-0.5">
                                    {entry.student_roll_no}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-600 dark:text-slate-300">
                                {entry.student_department}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-500 dark:text-slate-400">
                                {formattedDate}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center space-x-1 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-lg border border-rose-100 dark:border-rose-900/50">
                                  <Clock className="h-3.5 w-3.5 shrink-0" />
                                  <span>{formattedTime}</span>
                                </span>
                              </td>
                              <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-300 max-w-xs truncate" title={entry.reason}>
                                {entry.reason}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 4: MY CLASS ROLL REGISTRY */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "students" && (
          <div className="bg-white dark:bg-[#0b132b] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 animate-fade-in">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100">
                  My Class Roll Registry
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  Official registered student profiles enrolled under your designated class.
                </p>
              </div>
              <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-full text-xs font-black border border-blue-100 dark:border-blue-900/50">
                {myStudents.length} Students
              </span>
            </div>

            {myStudents.length === 0 ? (
              <div className="py-12 text-center">
                <Users className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                  No student registration profiles found for your class yet.
                </p>
              </div>
            ) : (
              <div>
                {/* Mobile Card Layout (block sm:hidden) */}
                <div className="block sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
                  {myStudents.map((student) => (
                    <div key={student.id} className="p-3.5 space-y-1.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                          {student.name}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 font-mono font-bold text-[10px] rounded-md text-slate-800 dark:text-slate-200">
                          {student.roll_no}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {student.email}
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono pt-1 text-slate-500 dark:text-slate-400">
                        <span>Ph: {student.phone || "N/A"}</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">Parent: {student.parent_phone || "N/A"}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View (hidden sm:block) */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/70 text-[10px] text-slate-500 dark:text-slate-400 font-bold text-left uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3.5">Roll No</th>
                        <th className="px-6 py-3.5">Student Name</th>
                        <th className="px-6 py-3.5">Institutional Email</th>
                        <th className="px-6 py-3.5">Student Mobile</th>
                        <th className="px-6 py-3.5">Verified Parent Mobile</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-[#0b132b]">
                      {myStudents.map((student) => (
                        <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                          <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                            {student.roll_no}
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">
                            {student.name}
                          </td>
                          <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium">
                            {student.email}
                          </td>
                          <td className="px-6 py-4 font-mono text-slate-500 dark:text-slate-400">
                            {student.phone}
                          </td>
                          <td className="px-6 py-4 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                            {student.parent_phone || "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* MOBILE FIXED BOTTOM NAVIGATION BAR */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0a1e33]/95 backdrop-blur-md border-t border-[#081726] px-2 py-1.5 flex items-center justify-around shadow-2xl">
        {[
          { id: "gatepasses", label: "Approvals", icon: FileText, badge: activeGatePassKPI || null },
          { id: "faculty", label: "My Outing", icon: Award, badge: myFacultyPasses.length || null },
          { id: "late", label: "Late Logs", icon: Clock, badge: lateEntries.length || null },
          { id: "students", label: "Roll Call", icon: Users, badge: myStudents.length || null }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-bold transition relative cursor-pointer ${
                isActive ? "text-emerald-400 font-extrabold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="relative">
                <Icon className={`h-5 w-5 ${isActive ? "text-emerald-400 scale-110" : "text-slate-400"}`} />
                {tab.badge && (
                  <span className="absolute -top-1 -right-2 h-3.5 min-w-[14px] px-1 bg-amber-500 text-slate-950 font-black text-[8px] rounded-full flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="mt-0.5 leading-tight">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
