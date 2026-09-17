/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect } from "react";
import {
  FileText,
  Check,
  X,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  Clock,
  LogOut,
  CheckCircle2,
  CheckCircle,
  Sparkles,
  Sun,
  Moon,
  Users,
  Award,
  ShieldCheck,
  Building2,
  AlertTriangle,
  AlertCircle,
  UserCheck,
  GraduationCap
} from "lucide-react";
import { gatepassService } from "../services/gatepassService.js";
import NotificationCenter from "./NotificationCenter";
import sbjainLogo from "../assets/sbjain-logo.png";

export default function HODDashboard({ user, onLogout, isDarkMode, onToggleTheme }) {
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [remarksMap, setRemarksMap] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("pending");
  const [lateEntries, setLateEntries] = useState([]);

  const studentHistory = history.filter(
    (p) => !p.faculty_id && p.user_type !== "faculty" && !p.faculty_name
  );
  const facultyHistory = history.filter(
    (p) =>
      p.faculty_id ||
      p.user_type === "faculty" ||
      p.faculty_name ||
      (p.reason && p.reason.includes("[TEACHER LATE MARK]"))
  );

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const pendingData = await gatepassService.getHODPendingPasses();
      const historyData = await gatepassService.getHODHistoryPasses();
      setPending(pendingData || []);
      setHistory(historyData || []);
      const lateData = await gatepassService.getLateComeEntries();
      setLateEntries(lateData || []);
    } catch (err) {
      alert(err.message || "Failed to fetch HOD records.");
    } finally {
      setLoading(false);
    }
  };

  const fetchLateEntries = async () => {
    try {
      const data = await gatepassService.getLateComeEntries();
      setLateEntries(data || []);
    } catch (err) {
      console.error("Failed to fetch late come entries:", err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleApprove = async (passId) => {
    const remarks = remarksMap[passId] || "Approved by HOD";
    try {
      await gatepassService.approveGatePassHOD(passId, remarks);
      setRemarksMap((prev) => {
        const copy = { ...prev };
        delete copy[passId];
        return copy;
      });
      fetchDashboardData();
    } catch (err) {
      alert(err.message || "Failed to approve gate pass.");
    }
  };

  const handleReject = async (passId) => {
    const remarks = remarksMap[passId];
    if (!remarks || remarks.trim() === "") {
      alert("Please provide a remark / reason for rejection first.");
      return;
    }
    try {
      await gatepassService.rejectGatePassHOD(passId, remarks);
      setRemarksMap((prev) => {
        const copy = { ...prev };
        delete copy[passId];
        return copy;
      });
      fetchDashboardData();
    } catch (err) {
      alert(err.message || "Failed to reject gate pass.");
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
      pending_hod: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
      approved: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
      rejected: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30",
      exited: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/30",
      closed: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
      cancelled: "bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
    };
    const labels = {
      pending: "Pending Clearance",
      pending_hod: "Awaiting HOD Review",
      approved: "Approved & Authorized",
      rejected: "Rejected",
      exited: "Active Out-Of-Campus",
      closed: "Returned & Closed",
      cancelled: "Cancelled"
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getRiskIndicator = (level) => {
    if (!level) return null;
    const styles = {
      low: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
      medium: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
      high: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30 animate-pulse"
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${styles[level] || styles.low}`}>
        <Sparkles className="h-3 w-3" />
        <span>Frequency Risk: {level}</span>
      </span>
    );
  };

  const today = new Date().toDateString();
  const approvedToday = history.filter(
    (h) => h.approved_by && h.status !== "rejected" && new Date(h.created_at || h.exit_time).toDateString() === today
  ).length;
  const rejectedToday = history.filter(
    (h) => h.status === "rejected" && new Date(h.created_at || h.exit_time).toDateString() === today
  ).length;

  const filteredPending = pending.filter((p) => {
    const studentName = (p.student_name || p.faculty_name || "").toLowerCase();
    const studentRoll = (p.student_roll_no || "").toLowerCase();
    const reason = (p.reason || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = studentName.includes(query) || studentRoll.includes(query) || reason.includes(query);
    const matchesRisk = riskFilter === "all" || p.risk_level === riskFilter;
    return matchesSearch && matchesRisk;
  });

  return (
    <div className="min-h-screen bg-[#f0f5fa] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors pb-20 sm:pb-12">
      {/* 1. Upper Navigation Bar (Institutional Navy #0a1e33) */}
      <header className="bg-[#0a1e33] border-b border-[#081726] sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Branding Identity */}
            <div className="flex items-center space-x-3.5 min-w-0">
              <div className="h-11 w-11 bg-white rounded-xl p-1 border border-white/20 shadow-xs flex items-center justify-center shrink-0">
                <img
                  src={sbjainLogo}
                  alt="SBJITMR Logo"
                  className="h-9 w-9 object-contain"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xs sm:text-sm md:text-base font-bold text-white tracking-tight leading-tight truncate">
                    S. B. Jain Institute of Technology, Management and Research
                  </h1>
                  <span className="hidden sm:inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border shrink-0 bg-purple-500/20 text-purple-300 border-purple-400/30">
                    HOD PORTAL
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-medium tracking-wide">
                  Nagpur • Departmental Outing Clearance &amp; Gate Pass System
                </p>
              </div>
            </div>

            {/* Actions: User Profile + Notifications + Theme Toggle + Logout */}
            <div className="flex items-center space-x-3 shrink-0">
              {/* User preview */}
              <div className="hidden sm:flex items-center space-x-2.5 pl-2 pr-1">
                <div className="h-8 w-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-purple-300">
                  <UserCheck className="h-4 w-4" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-white leading-tight flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{user?.name}</span>
                  </span>
                  <span className="text-[10px] text-purple-300 font-semibold uppercase">
                    HOD • {user?.department || "Academic Department"}
                  </span>
                </div>
              </div>

              <NotificationCenter />

              <div className="h-6 w-px bg-white/15 hidden sm:block" />

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
                className="inline-flex items-center px-3 py-1.5 border border-white/20 text-xs font-semibold rounded-lg text-white bg-white/10 hover:bg-white/20 transition cursor-pointer gap-1.5"
                title="Sign out of HOD Session"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* 2. HOD Welcome & Profile Card */}
        <div className="bg-white dark:bg-[#0b132b] border border-slate-200/80 dark:border-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4 transition-all">
          <div className="flex items-start sm:items-center gap-3.5 sm:gap-4">
            <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0 shadow-xs">
              <ShieldCheck className="h-6 w-6 sm:h-7 sm:w-7 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Welcome back, {user?.name}!
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                  <Award className="h-3 w-3" />
                  <span>Head of Department</span>
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 text-purple-500" />
                  <span>Department: <strong className="text-slate-700 dark:text-slate-200">{user?.department}</strong></span>
                </span>
                <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
                <span className="text-slate-500 dark:text-slate-400">
                  Tier-2 Outing Authorization &amp; Student/Faculty Outing Clearance Center
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 transition cursor-pointer shadow-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-purple-500" : ""}`} />
              <span>Refresh Queue</span>
            </button>
          </div>
        </div>

        {/* 3. Analytics KPI Grid (4 High-Contrast Metric Cards - Compact 2-Col Mobile) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 animate-fade-in">
          {/* Awaiting Review */}
          <div className="bg-white dark:bg-[#0b132b] border border-slate-200/80 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-xs sm:shadow-sm flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[11px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider block truncate">
                Awaiting Clearance
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5 sm:mt-1">
                {pending.length}
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium truncate hidden sm:block">
                Pending HOD decision
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl sm:rounded-2xl border border-amber-100 dark:border-amber-800/60 shrink-0 ml-2">
              <Clock className="h-4 w-4 sm:h-6 sm:w-6" />
            </div>
          </div>

          {/* Approved Today */}
          <div className="bg-white dark:bg-[#0b132b] border border-slate-200/80 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-xs sm:shadow-sm flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[11px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider block truncate">
                Approved Today
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 sm:mt-1">
                {approvedToday}
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium truncate hidden sm:block">
                Authorized QR passes
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl sm:rounded-2xl border border-emerald-100 dark:border-emerald-800/60 shrink-0 ml-2">
              <CheckCircle2 className="h-4 w-4 sm:h-6 sm:w-6" />
            </div>
          </div>

          {/* Rejected Today */}
          <div className="bg-white dark:bg-[#0b132b] border border-slate-200/80 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-xs sm:shadow-sm flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[11px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider block truncate">
                Disallowed Today
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5 sm:mt-1">
                {rejectedToday}
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium truncate hidden sm:block">
                Flagged / denied outings
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl sm:rounded-2xl border border-rose-100 dark:border-rose-800/60 shrink-0 ml-2">
              <AlertTriangle className="h-4 w-4 sm:h-6 sm:w-6" />
            </div>
          </div>

          {/* Total History */}
          <div className="bg-white dark:bg-[#0b132b] border border-slate-200/80 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-xs sm:shadow-sm flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[11px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider block truncate">
                Department Logs
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5 sm:mt-1">
                {history.length}
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium truncate hidden sm:block">
                Departmental applications
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl sm:rounded-2xl border border-purple-100 dark:border-purple-800/60 shrink-0 ml-2">
              <FileText className="h-4 w-4 sm:h-6 sm:w-6" />
            </div>
          </div>
        </div>

        {/* 4. Tab Navigation & Filter Toolbar */}
        <div className="bg-white dark:bg-[#0b132b] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 dark:border-slate-800 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Tabs List */}
            <div className="flex items-center overflow-x-auto no-scrollbar gap-1.5 p-1 bg-slate-50/70 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 whitespace-nowrap max-w-full">
              <button
                onClick={() => setActiveTab("pending")}
                className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeTab === "pending"
                    ? "bg-[#0a1e33] dark:bg-purple-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Approval Queue</span>
                {pending.length > 0 ? (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500 text-white animate-pulse">
                    {pending.length}
                  </span>
                ) : (
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    activeTab === "pending" ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                  }`}>
                    0
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("student_history")}
                className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeTab === "student_history" || activeTab === "history"
                    ? "bg-[#0a1e33] dark:bg-purple-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                <span>Student History</span>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  activeTab === "student_history" || activeTab === "history"
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                }`}>
                  {studentHistory.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("faculty_history")}
                className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeTab === "faculty_history"
                    ? "bg-[#0a1e33] dark:bg-purple-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Award className="h-3.5 w-3.5" />
                <span>Faculty &amp; Staff History</span>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  activeTab === "faculty_history"
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                }`}>
                  {facultyHistory.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("late_come");
                  fetchLateEntries();
                }}
                className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeTab === "late_come"
                    ? "bg-[#0a1e33] dark:bg-purple-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Late-Comers Directory</span>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  activeTab === "late_come"
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                }`}>
                  {lateEntries.length}
                </span>
              </button>
            </div>

            {/* Filter controls: Visible on Pending tab */}
            {activeTab === "pending" && (
              <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto">
                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search name, roll, reason..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-xs"
                  />
                </div>

                <div className="flex items-center space-x-1.5">
                  <Filter className="h-3.5 w-3.5 text-slate-400" />
                  <select
                    value={riskFilter}
                    onChange={(e) => setRiskFilter(e.target.value)}
                    className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-xs"
                  >
                    <option value="all">All AI Risks</option>
                    <option value="low">Low Risk Only</option>
                    <option value="medium">Medium Risk Only</option>
                    <option value="high">High Risk Only</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* ------------------------------------------------------------- */}
          {/* TAB 1: PENDING APPROVAL QUEUE */}
          {/* ------------------------------------------------------------- */}
          {activeTab === "pending" && (
            <div className="p-5 sm:p-6 animate-fade-in">
              {loading ? (
                <div className="text-center py-16 space-y-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto" />
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Loading departmental approval queue...
                  </p>
                </div>
              ) : filteredPending.length === 0 ? (
                <div className="text-center py-16 text-slate-400 dark:text-slate-500 space-y-3">
                  <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
                  <h3 className="text-slate-800 dark:text-white font-bold text-sm sm:text-base">
                    Clear Approval Queue
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                    No pending gate pass requests matched your search criteria. All student and staff applications for <strong>{user.department}</strong> have been reviewed.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredPending.map((pass) => (
                    <div
                      key={pass.id}
                      className="border border-slate-200/80 dark:border-slate-800 shadow-sm rounded-2xl bg-white dark:bg-[#0b132b] p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-3.5">
                        {/* Dossier Header */}
                        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-3">
                          <div className="flex items-center space-x-3 min-w-0">
                            <div
                              className={`h-11 w-11 rounded-xl border flex items-center justify-center font-bold text-xs shrink-0 ${
                                pass.user_type === "faculty"
                                  ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                                  : "bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800"
                              }`}
                            >
                              {(pass.faculty_name || pass.student_name || "US").slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 truncate">
                                  {pass.faculty_name || pass.student_name}
                                </h3>
                                {pass.user_type === "faculty" ? (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                    FACULTY PASS
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                    STUDENT OUTING
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                Dept: <span className="font-semibold text-slate-700 dark:text-slate-300">{pass.faculty_department || pass.student_department || user.department}</span>
                                {pass.student_roll_no && pass.student_roll_no !== "FACULTY" && ` • Roll: ${pass.student_roll_no}`}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0">{getRiskIndicator(pass.risk_level)}</div>
                        </div>

                        {/* AI Risk Remark Banner */}
                        {pass.risk_level && (
                          <div
                            className={`p-3 rounded-xl border text-xs font-semibold leading-relaxed flex items-start space-x-2.5 ${
                              pass.risk_level === "high"
                                ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300"
                                : pass.risk_level === "medium"
                                ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300"
                                : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300"
                            }`}
                          >
                            <Sparkles className="h-4 w-4 text-current shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold">AI Frequency Assessment: </span>
                              {pass.risk_remarks || "Frequency pattern verified within normal limits."}
                            </div>
                          </div>
                        )}

                        {/* Schedule & Reason Detail Box */}
                        <div className="bg-slate-50/70 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-400 uppercase text-[10px]">Leave Scheduled</span>
                            <span className="font-mono text-slate-800 dark:text-slate-200 font-bold">
                              {new Date(pass.exit_time).toLocaleDateString([], { month: "short", day: "numeric" })} at {new Date(pass.exit_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>

                          <div className="pt-1 border-t border-slate-100 dark:border-slate-700/60">
                            <span className="font-bold text-slate-400 uppercase text-[10px] block mb-0.5">Reason Submitted</span>
                            <p className="text-slate-800 dark:text-slate-200 font-medium italic">
                              "{pass.reason}"
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Clearance Remarks & Action Buttons */}
                      <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                        <div>
                          <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-400 mb-1 block">
                            HOD Clearance Remarks (Mandatory for rejection)
                          </label>
                          <input
                            type="text"
                            placeholder="Add approval comments or rejection reason here..."
                            value={remarksMap[pass.id] || ""}
                            onChange={(e) => setRemarksMap({ ...remarksMap, [pass.id]: e.target.value })}
                            className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 shadow-xs"
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleReject(pass.id)}
                            className="flex-1 py-2.5 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-800 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-center space-x-1.5 shadow-xs"
                          >
                            <X className="h-4 w-4" />
                            <span>Reject</span>
                          </button>

                          <button
                            onClick={() => handleApprove(pass.id)}
                            className="flex-1 py-2.5 bg-[#0a1e33] hover:bg-[#112d4e] dark:bg-purple-600 dark:hover:bg-purple-500 text-white rounded-xl text-xs font-extrabold shadow-sm transition cursor-pointer flex items-center justify-center space-x-1.5"
                          >
                            <Check className="h-4 w-4 text-emerald-400" />
                            <span>
                              {pass.user_type === "faculty"
                                ? "Clear & Forward"
                                : "Authorize Pass"}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB 2: STUDENT HISTORICAL LOGS */}
          {/* ------------------------------------------------------------- */}
          {(activeTab === "student_history" || activeTab === "history") && (
            <div className="animate-fade-in">
              {studentHistory.length === 0 ? (
                <div className="text-center py-16 text-slate-400 dark:text-slate-500 space-y-2">
                  <FileText className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    No student gate pass records found in this department.
                  </p>
                </div>
              ) : (
                <div>
                  {/* Mobile Card Layout (block sm:hidden) */}
                  <div className="block sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
                    {studentHistory.map((pass) => (
                      <div key={pass.id} className="p-3.5 space-y-2 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-extrabold text-xs text-slate-900 dark:text-white block leading-tight">
                              {pass.student_name}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase">
                              Pass #{pass.id} | Roll: <strong className="text-slate-700 dark:text-slate-300">{pass.student_roll_no}</strong>
                            </span>
                          </div>
                          <span className="shrink-0">{getStatusBadge(pass.status)}</span>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 text-xs text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700/60">
                          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 block mb-0.5">Reason</span>
                          <p className="leading-snug">{pass.reason}</p>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-400 pt-0.5">
                          <span>
                            Outing: <strong className="text-slate-700 dark:text-slate-300 font-mono">{new Date(pass.exit_time).toLocaleDateString("en-IN", { day: '2-digit', month: 'short' })} {new Date(pass.exit_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
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
                          <th className="px-6 py-3.5 text-left">Pass ID</th>
                          <th className="px-6 py-3.5 text-left">Student Info</th>
                          <th className="px-6 py-3.5 text-left">Reason for Outing</th>
                          <th className="px-6 py-3.5 text-left">Leave Scheduled</th>
                          <th className="px-6 py-3.5 text-left">Status</th>
                          <th className="px-6 py-3.5 text-left">HOD Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-[#0b132b] divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-600 dark:text-slate-300">
                        {studentHistory.map((pass) => (
                          <tr key={pass.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                            <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-slate-900 dark:text-slate-200">
                              #{pass.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-bold text-slate-900 dark:text-white">{pass.student_name}</div>
                              <div className="text-[10px] font-mono text-slate-400 font-medium">Roll: {pass.student_roll_no}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-semibold text-slate-800 dark:text-slate-200 max-w-xs truncate">
                                {pass.reason}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-300 font-mono">
                              {new Date(pass.exit_time).toLocaleString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true
                              })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(pass.status)}</td>
                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400 italic max-w-xs truncate">
                              "{pass.remarks || "No HOD remarks"}"
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

          {/* ------------------------------------------------------------- */}
          {/* TAB 3: FACULTY & STAFF HISTORICAL LOGS */}
          {/* ------------------------------------------------------------- */}
          {activeTab === "faculty_history" && (
            <div className="animate-fade-in">
              {facultyHistory.length === 0 ? (
                <div className="text-center py-16 text-slate-400 dark:text-slate-500 space-y-2">
                  <Award className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    No faculty or teacher staff history found in this department.
                  </p>
                </div>
              ) : (
                <div>
                  {/* Mobile Card Layout (block sm:hidden) */}
                  <div className="block sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
                    {facultyHistory.map((pass) => (
                      <div key={pass.id} className="p-3.5 space-y-2 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-extrabold text-xs text-slate-900 dark:text-white block leading-tight">
                              {pass.faculty_name || pass.student_name || "Faculty Member"}
                            </span>
                            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                              Pass #{pass.id} • {pass.faculty_department || user.department}
                            </span>
                          </div>
                          <span className="shrink-0">{getStatusBadge(pass.status)}</span>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 text-xs text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700/60">
                          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 block mb-0.5">Type / Reason</span>
                          <p className="leading-snug">{pass.reason}</p>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-400 pt-0.5">
                          <span>
                            Date: <strong className="text-slate-700 dark:text-slate-300 font-mono">{new Date(pass.exit_time).toLocaleDateString("en-IN", { day: '2-digit', month: 'short' })} {new Date(pass.exit_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
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
                          <th className="px-6 py-3.5 text-left">Pass ID</th>
                          <th className="px-6 py-3.5 text-left">Faculty / Staff Member</th>
                          <th className="px-6 py-3.5 text-left">Type / Reason</th>
                          <th className="px-6 py-3.5 text-left">Date &amp; Time</th>
                          <th className="px-6 py-3.5 text-left">Status</th>
                          <th className="px-6 py-3.5 text-left">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-[#0b132b] divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-600 dark:text-slate-300">
                        {facultyHistory.map((pass) => (
                          <tr key={pass.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                            <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-slate-900 dark:text-slate-200">
                              #{pass.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-bold text-slate-900 dark:text-white">
                                {pass.faculty_name || pass.student_name || "Faculty Member"}
                              </div>
                              <div className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                                {pass.faculty_department || user.department}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-semibold text-slate-800 dark:text-slate-200 max-w-xs truncate">
                                {pass.reason}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-300 font-mono">
                              {new Date(pass.exit_time).toLocaleString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true
                              })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(pass.status)}</td>
                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400 italic max-w-xs truncate">
                              "{pass.remarks || "No remarks"}"
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

          {/* ------------------------------------------------------------- */}
          {/* TAB 4: LATE COMERS REGISTER */}
          {/* ------------------------------------------------------------- */}
          {activeTab === "late_come" && (
            <div className="p-5 sm:p-6 space-y-6 animate-fade-in">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    Departmental Late Come Register
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Self-reported and gate-captured arrival timestamps for students in the {user.department} department.
                  </p>
                </div>
              </div>

              {/* Stats Mini Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Incidents</span>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-1">{lateEntries.length}</div>
                </div>

                <div className="bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active This Month</span>
                  <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
                    {(() => {
                      const currentMonth = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
                      return lateEntries.filter((e) => {
                        const date = new Date(e.arrival_time);
                        return date.toLocaleString("en-US", { month: "long", year: "numeric" }) === currentMonth;
                      }).length;
                    })()}
                  </div>
                </div>

                <div className="bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Unique Students</span>
                  <div className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1">
                    {new Set(lateEntries.map((e) => e.student_id)).size}
                  </div>
                </div>
              </div>

              {/* Grouped Monthwise Register */}
              {lateEntries.length === 0 ? (
                <div className="text-center py-16 text-slate-400 dark:text-slate-500 space-y-2">
                  <Clock className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    No late-comers recorded in your department yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {(() => {
                    const groups = {};
                    lateEntries.forEach((entry) => {
                      const date = new Date(entry.arrival_time);
                      const monthYear = date.toLocaleString("en-US", { month: "long", year: "numeric" });
                      if (!groups[monthYear]) {
                        groups[monthYear] = [];
                      }
                      groups[monthYear].push(entry);
                    });
                    const sortedMonths = Object.keys(groups).sort((a, b) => {
                      return new Date(b).getTime() - new Date(a).getTime();
                    });
                    return sortedMonths.map((month) => (
                      <div key={month} className="space-y-3">
                        <div className="flex items-center space-x-3 bg-slate-100/80 dark:bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                          <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          <span className="text-xs font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">
                            {month}
                          </span>
                          <span className="bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {groups[month].length} late arrival{groups[month].length > 1 ? "s" : ""}
                          </span>
                        </div>

                        <div className="bg-white dark:bg-[#0b132b] rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
                          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                            <thead className="bg-slate-50 dark:bg-slate-800/70 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                              <tr>
                                <th className="px-6 py-3.5 text-left">Student Name</th>
                                <th className="px-6 py-3.5 text-left">Roll No</th>
                                <th className="px-6 py-3.5 text-left">Arrival Time</th>
                                <th className="px-6 py-3.5 text-left">Stated Reason</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-[#0b132b] divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                              {groups[month].map((entry) => (
                                <tr key={entry.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                                  <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-white">
                                    {entry.student_name}
                                  </td>
                                  <td className="px-6 py-3.5 font-mono text-slate-500 dark:text-slate-400">
                                    {entry.student_roll_no}
                                  </td>
                                  <td className="px-6 py-3.5 font-semibold text-rose-600 dark:text-rose-400">
                                    {new Date(entry.arrival_time).toLocaleString(void 0, {
                                      dateStyle: "medium",
                                      timeStyle: "short"
                                    })}
                                  </td>
                                  <td className="px-6 py-3.5 max-w-xs truncate italic text-slate-600 dark:text-slate-300">
                                    "{entry.reason}"
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar (Fixed 1-Tap Access for Mobile) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0a1e33]/95 dark:bg-[#060e18]/95 backdrop-blur-md border-t border-white/10 px-2 py-1.5 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => {
            setActiveTab("pending");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer relative ${
            activeTab === "pending"
              ? "text-purple-400 font-bold"
              : "text-slate-400 hover:text-slate-200 font-medium"
          }`}
        >
          <div className="relative">
            <Clock className="h-5 w-5" />
            {pending.length > 0 && (
              <span className="absolute -top-1 -right-2 bg-amber-500 text-white font-black text-[9px] h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center animate-pulse">
                {pending.length}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Approvals</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("history");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer ${
            activeTab === "history"
              ? "text-purple-400 font-bold"
              : "text-slate-400 hover:text-slate-200 font-medium"
          }`}
        >
          <FileText className="h-5 w-5" />
          <span className="text-[10px] tracking-tight mt-0.5">Student Logs</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("faculty_history");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer ${
            activeTab === "faculty_history"
              ? "text-purple-400 font-bold"
              : "text-slate-400 hover:text-slate-200 font-medium"
          }`}
        >
          <Users className="h-5 w-5" />
          <span className="text-[10px] tracking-tight mt-0.5">Faculty Logs</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("latecomers");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer ${
            activeTab === "latecomers"
              ? "text-purple-400 font-bold"
              : "text-slate-400 hover:text-slate-200 font-medium"
          }`}
        >
          <AlertTriangle className="h-5 w-5" />
          <span className="text-[10px] tracking-tight mt-0.5">Late Marks</span>
        </button>
      </nav>
    </div>
  );
}
