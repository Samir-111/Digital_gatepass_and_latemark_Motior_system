/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect } from "react";
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  LogOut,
  Search,
  Filter,
  RefreshCw,
  User,
  Users,
  Building2,
  Calendar,
  FileText,
  AlertCircle,
  QrCode,
  Award,
  Check,
  X,
  Eye,
  Download,
  Sun,
  Moon
} from "lucide-react";
import { gatepassService } from "../services/gatepassService.js";
import sbjainLogo from "../assets/sbjain-logo.png";

export default function PrincipalDashboard({ user, onLogout, isDarkMode, onToggleTheme }) {
  const [activeTab, setActiveTab] = useState("pending"); // "pending", "history", "all"
  const [pendingPasses, setPendingPasses] = useState([]);
  const [historyPasses, setHistoryPasses] = useState([]);
  const [allCollegePasses, setAllCollegePasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("All");

  // Modal state for Approve / Reject action
  const [selectedPass, setSelectedPass] = useState(null);
  const [modalType, setModalType] = useState(null); // 'approve' | 'reject' | 'view_qr'
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const pending = await gatepassService.getPrincipalPendingPasses();
      setPendingPasses(pending || []);
      const history = await gatepassService.getPrincipalHistoryPasses();
      setHistoryPasses(history || []);
      const allPasses = await gatepassService.getPrincipalAllPasses();
      setAllCollegePasses(allPasses || []);
    } catch (err) {
      console.error("Failed to load principal dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleApprove = async () => {
    if (!selectedPass) return;
    setSubmitting(true);
    setActionError(null);
    try {
      await gatepassService.approveFacultyGatePassPrincipal(selectedPass.id, remarks);
      setSelectedPass(null);
      setModalType(null);
      setRemarks("");
      fetchDashboardData();
    } catch (err) {
      setActionError(err.message || "Failed to approve gate pass.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPass) return;
    if (!remarks.trim()) {
      setActionError("Reason / Remarks for rejection are required.");
      return;
    }
    setSubmitting(true);
    setActionError(null);
    try {
      await gatepassService.rejectFacultyGatePassPrincipal(selectedPass.id, remarks);
      setSelectedPass(null);
      setModalType(null);
      setRemarks("");
      fetchDashboardData();
    } catch (err) {
      setActionError(err.message || "Failed to reject gate pass.");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper for safe date formatting
  const formatDateSafe = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      return d.toLocaleString("en-IN", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) {
      return String(dateStr || 'N/A');
    }
  };

  const formatTimeSafe = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) {
      return String(dateStr || 'N/A');
    }
  };

  // Extract departments list for filter
  const departments = [
    "All",
    ...new Set([
      "Computer Science and Engineering",
      "Information Technology",
      "Electronics and Telecommunication",
      "Electrical Engineering",
      "Mechanical Engineering",
      "Civil Engineering",
      "Artificial Intelligence & Data Science",
      "First Year / Applied Sciences",
      ...(allCollegePasses || []).map((p) => p.faculty_department || p.student_department),
      ...(pendingPasses || []).map((p) => p.faculty_department || p.student_department),
      ...(historyPasses || []).map((p) => p.faculty_department || p.student_department),
    ].filter(Boolean)),
  ];

  // Filtering helper
  const filterPasses = (passesList) => {
    return (passesList || []).filter((pass) => {
      if (!pass) return false;
      const name = (pass.faculty_name || pass.student_name || "").toLowerCase();
      const roll = (pass.student_roll_no || "").toLowerCase();
      const reason = (pass.reason || "").toLowerCase();
      const dept = (
        pass.faculty_department ||
        pass.student_department ||
        ""
      ).toLowerCase();
      const query = (searchQuery || "").toLowerCase().trim();

      const matchesSearch =
        name.includes(query) || roll.includes(query) || reason.includes(query) || dept.includes(query);
      const matchesDept =
        filterDepartment === "All" ||
        (pass.faculty_department || pass.student_department) ===
          filterDepartment;

      return matchesSearch && matchesDept;
    });
  };

  const studentPasses = (allCollegePasses || []).filter(
    (p) => p && !p.faculty_id && p.user_type !== "faculty" && !p.faculty_name
  );
  const pendingFiltered = filterPasses(pendingPasses);
  const historyFiltered = filterPasses(historyPasses);
  const studentFiltered = filterPasses(studentPasses);
  const allFiltered = filterPasses(allCollegePasses);

  // Statistics counters
  const statsApprovedToday = (allCollegePasses || []).filter(
    (p) => p && p.status === "approved"
  ).length;

  const statsOffCampus = (allCollegePasses || []).filter(
    (p) => p && p.status === "exited"
  ).length;

  return (
    <div className="min-h-screen bg-[#f0f5fa] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-20 sm:pb-12 transition-colors">
      {/* Header Bar */}
      <header className="bg-[#0a1e33] border-b border-[#081726] sticky top-0 z-30 shadow-md px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 min-w-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <img
              src={sbjainLogo}
              alt="S.B. Jain Institute Logo"
              className="h-10 w-10 sm:h-12 sm:w-12 object-contain bg-white rounded-xl p-1 shadow-sm border border-white/20 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span className="text-white font-extrabold text-xs sm:text-sm md:text-base tracking-tight drop-shadow-sm truncate">
                  S. B. Jain Institute of Technology
                </span>
                <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 uppercase tracking-wider shrink-0">
                  PRINCIPAL &amp; EXECUTIVE PORTAL
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-300 font-medium truncate">
                Nagpur • Campus-Wide Authorization &amp; Gate Pass Monitoring
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:block text-right">
              <div className="text-xs font-semibold text-white">{user?.name || "Dr. Principal"}</div>
              <div className="text-[11px] text-slate-400">Principal &amp; Executive Approvals</div>
            </div>

            <button
              onClick={onToggleTheme}
              className="p-1.5 sm:p-2 rounded-lg border border-white/15 text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-200" />}
            </button>

            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="p-1.5 sm:p-2 rounded-lg border border-white/15 text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-amber-400" : ""}`} />
            </button>

            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/20 text-white bg-white/10 hover:bg-white/20 transition text-xs font-bold cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3.5 sm:px-6 pt-4 sm:pt-6 space-y-4 sm:space-y-6">
        {/* Metric Cards (Compact 2-Column Mobile Grid) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-4 sm:mb-6">
          <div className="p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs sm:shadow-sm relative overflow-hidden flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider truncate">
                Pending Requests
              </p>
              <h3 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-0.5 sm:mt-1">
                {pendingPasses.length}
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 sm:mt-3 truncate hidden sm:block">Awaiting Principal Sign-Off</p>
            </div>
            <div className="p-2 sm:p-3 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-300 shrink-0 ml-2">
              <Clock className="h-4 w-4 sm:h-6 sm:w-6" />
            </div>
          </div>

          <div className="p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs sm:shadow-sm relative overflow-hidden flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider truncate">
                Approved Passes
              </p>
              <h3 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-0.5 sm:mt-1">
                {statsApprovedToday}
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 sm:mt-3 truncate hidden sm:block">Authorized for Exit</p>
            </div>
            <div className="p-2 sm:p-3 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 shrink-0 ml-2">
              <CheckCircle className="h-4 w-4 sm:h-6 sm:w-6" />
            </div>
          </div>

          <div className="p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs sm:shadow-sm relative overflow-hidden flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider truncate">
                Off-Campus
              </p>
              <h3 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-0.5 sm:mt-1">
                {statsOffCampus}
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 sm:mt-3 truncate hidden sm:block">Active Exits Logged</p>
            </div>
            <div className="p-2 sm:p-3 rounded-xl bg-sky-500/20 text-sky-600 dark:text-sky-300 shrink-0 ml-2">
              <LogOut className="h-4 w-4 sm:h-6 sm:w-6" />
            </div>
          </div>

          <div className="p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs sm:shadow-sm relative overflow-hidden flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider truncate">
                Total Passes
              </p>
              <h3 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-0.5 sm:mt-1">
                {allCollegePasses.length}
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 sm:mt-3 truncate hidden sm:block">Faculty &amp; Student Combined</p>
            </div>
            <div className="p-2 sm:p-3 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 shrink-0 ml-2">
              <FileText className="h-4 w-4 sm:h-6 sm:w-6" />
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center overflow-x-auto no-scrollbar gap-1.5 bg-white dark:bg-slate-900/90 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm whitespace-nowrap max-w-full">
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === "pending"
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Clock className="h-4 w-4" />
              Pending Requests ({pendingPasses.length})
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === "history"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <FileText className="h-4 w-4" />
              Faculty Pass History ({historyPasses.length})
            </button>

            <button
              onClick={() => setActiveTab("student_history")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === "student_history"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Users className="h-4 w-4" />
              Student Pass History ({studentPasses.length})
            </button>

            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === "all"
                  ? "bg-slate-800 dark:bg-slate-700 text-white"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              All College Passes ({allCollegePasses.length})
            </button>
          </div>

          {/* Search & Filters */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by name, roll, reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500/50 w-48 sm:w-64 shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500/50 cursor-pointer shadow-sm"
            >
              {departments.map((d) => (
                <option key={d} value={d} className="dark:bg-slate-900">
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Department / Search Filter Indicator */}
        {(filterDepartment !== "All" || searchQuery) && (
          <div className="flex flex-wrap items-center justify-between gap-2 mb-5 p-3 px-4 bg-amber-500/10 dark:bg-slate-900/90 border border-amber-500/30 rounded-xl text-xs shadow-sm">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-slate-800 dark:text-slate-200">
                Active Filter: {filterDepartment !== "All" && (
                  <span className="font-bold text-amber-700 dark:text-amber-400 mr-2 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                    Dept: {filterDepartment}
                  </span>
                )}
                {searchQuery && (
                  <span className="font-medium text-slate-600 dark:text-slate-400">
                    Search: "{searchQuery}"
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                {activeTab === "pending" && `Showing ${pendingFiltered.length} of ${pendingPasses.length} pending`}
                {activeTab === "history" && `Showing ${historyFiltered.length} of ${historyPasses.length} faculty passes`}
                {activeTab === "student_history" && `Showing ${studentFiltered.length} of ${studentPasses.length} student passes`}
                {activeTab === "all" && `Showing ${allFiltered.length} of ${allCollegePasses.length} total records`}
              </span>
              <button
                onClick={() => {
                  setFilterDepartment("All");
                  setSearchQuery("");
                }}
                className="text-rose-600 hover:text-rose-700 dark:text-rose-400 font-bold hover:underline cursor-pointer text-xs"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Tab 1: Pending Faculty Gatepasses */}
        {activeTab === "pending" && (
          <div>
            {pendingFiltered.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
                <CheckCircle className="h-12 w-12 text-emerald-500 dark:text-emerald-400 mx-auto mb-3 opacity-80" />
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">No Pending Faculty Requests</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  All faculty gate pass requests have been processed.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingFiltered.map((pass) => (
                  <div
                    key={pass.id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-amber-500/30 dark:border-amber-500/30 hover:border-amber-500/60 transition-all shadow-md flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <div className="h-10 w-10 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold flex items-center justify-center border border-amber-500/30 text-sm">
                            {pass.faculty_name ? pass.faculty_name.charAt(0) : "F"}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                              {pass.faculty_name}
                            </h4>
                            <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                              {pass.faculty_department} • Faculty
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-semibold">
                          Awaiting Approval
                        </span>
                      </div>

                      <div className="space-y-2 py-3 border-y border-slate-100 dark:border-slate-800/80 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">Reason:</span>
                          <span className="text-slate-900 dark:text-white font-medium text-right max-w-[180px] truncate">
                            {pass.reason}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">Exit Time:</span>
                          <span className="text-amber-700 dark:text-amber-300 font-semibold">
                            {formatDateSafe(pass.exit_time)}
                          </span>
                        </div>
                        {pass.vehicle_no && (
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Vehicle No:</span>
                            <span className="text-slate-800 dark:text-slate-300 font-mono">{pass.vehicle_no}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedPass(pass);
                          setModalType("approve");
                          setRemarks("");
                          setActionError(null);
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-500/20"
                      >
                        <Check className="h-4 w-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPass(pass);
                          setModalType("reject");
                          setRemarks("");
                          setActionError(null);
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Faculty Pass History */}
        {activeTab === "history" && (
          <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/90 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <th className="p-4">Faculty Member</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">Reason</th>
                    <th className="p-4">Timing</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Remarks</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {historyFiltered.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-500 dark:text-slate-400">
                        No faculty gate pass records found.
                      </td>
                    </tr>
                  ) : (
                    historyFiltered.map((pass) => (
                      <tr key={pass.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-slate-900 dark:text-white">{pass.faculty_name}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">{pass.faculty_phone}</div>
                        </td>
                        <td className="p-4 text-slate-700 dark:text-slate-300 font-medium">{pass.faculty_department}</td>
                        <td className="p-4">
                          <div className="text-slate-900 dark:text-white font-medium">{pass.reason}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-slate-800 dark:text-slate-300">
                            Exit: {formatTimeSafe(pass.exit_time)}
                          </div>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              pass.status === "approved"
                                ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                                : pass.status === "rejected"
                                ? "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30"
                                : pass.status === "exited"
                                ? "bg-sky-500/20 text-sky-700 dark:text-sky-400 border-sky-500/30"
                                : pass.status === "closed"
                                ? "bg-slate-200 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600"
                                : "bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30"
                            }`}
                          >
                            {(pass.status || "pending").toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500 dark:text-slate-400 max-w-[200px] truncate">
                          {pass.remarks || "—"}
                        </td>
                        <td className="p-4 text-center">
                          {pass.qr_code && (
                            <button
                              onClick={() => {
                                setSelectedPass(pass);
                                setModalType("view_qr");
                              }}
                              className="p-2 rounded-xl bg-amber-500/10 dark:bg-slate-800 hover:bg-amber-500/20 dark:hover:bg-slate-700 text-amber-700 dark:text-amber-400 transition-colors inline-flex items-center gap-1 text-[11px] font-semibold cursor-pointer border border-amber-500/20 dark:border-slate-700"
                            >
                              <QrCode className="h-4 w-4" />
                              <span>QR Pass</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Student Pass History */}
        {activeTab === "student_history" && (
          <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/90 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <th className="p-4">Student Name</th>
                    <th className="p-4">Dept / Roll</th>
                    <th className="p-4">Reason</th>
                    <th className="p-4">Timing</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {studentFiltered.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-slate-500 dark:text-slate-400">
                        No student gate pass history records found.
                      </td>
                    </tr>
                  ) : (
                    studentFiltered.map((pass) => (
                      <tr key={pass.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-slate-900 dark:text-white">{pass.student_name}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">{pass.student_phone}</div>
                        </td>
                        <td className="p-4 text-slate-700 dark:text-slate-300 font-medium">
                          <div>{pass.student_department}</div>
                          <div className="text-[10px] text-slate-400 font-mono">Roll: {pass.student_roll_no}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-slate-900 dark:text-white font-medium">{pass.reason}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-slate-800 dark:text-slate-300 font-mono">
                            {formatDateSafe(pass.exit_time)}
                          </div>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              pass.status === "approved"
                                ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                                : pass.status === "rejected"
                                ? "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30"
                                : pass.status === "exited"
                                ? "bg-sky-500/20 text-sky-700 dark:text-sky-400 border-sky-500/30"
                                : "bg-slate-200 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600"
                            }`}
                          >
                            {(pass.status || "pending").toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500 dark:text-slate-400 max-w-[200px] truncate">
                          {pass.remarks || "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeTab === "all" && (
          <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/90 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <th className="p-4">User Type</th>
                    <th className="p-4">Name</th>
                    <th className="p-4">Dept / Roll</th>
                    <th className="p-4">Reason</th>
                    <th className="p-4">Timing</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {allFiltered.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-slate-500 dark:text-slate-400">
                        No passes available.
                      </td>
                    </tr>
                  ) : (
                    allFiltered.map((pass) => (
                      <tr key={pass.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              pass.user_type === "faculty"
                                ? "bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                                : "bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30"
                            }`}
                          >
                            {(pass.user_type || "student").toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-slate-900 dark:text-white">
                          {pass.faculty_name || pass.student_name}
                        </td>
                        <td className="p-4 text-slate-700 dark:text-slate-300">
                          {pass.faculty_department || pass.student_department}
                          {pass.student_roll_no && pass.student_roll_no !== "FACULTY" && (
                            <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                              {pass.student_roll_no}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-slate-800 dark:text-slate-200">{pass.reason}</td>
                        <td className="p-4 text-slate-500 dark:text-slate-400 text-[11px]">
                          {formatTimeSafe(pass.exit_time)} - {formatTimeSafe(pass.return_time)}
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                            {pass.status || "pending"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Approve / Reject Modal */}
      {modalType && (modalType === "approve" || modalType === "reject") && selectedPass && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-slate-900 dark:text-white">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {modalType === "approve" ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      Approve Faculty Gate Pass
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      Reject Faculty Gate Pass
                    </>
                  )}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Faculty: <span className="text-slate-800 dark:text-slate-200 font-semibold">{selectedPass.faculty_name}</span> ({selectedPass.faculty_department})
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedPass(null);
                  setModalType(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1">
              <div>
                <span className="text-slate-500 dark:text-slate-400">Reason: </span>
                <span className="text-slate-900 dark:text-white font-medium">{selectedPass.reason}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Exit Window: </span>
                <span className="text-amber-700 dark:text-amber-400 font-semibold">
                  {new Date(selectedPass.exit_time).toLocaleString()}
                </span>
              </div>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Executive Remarks / Approval Authorization Notes
              </label>
              <textarea
                rows="3"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={
                  modalType === "approve"
                    ? "Optional approval comments..."
                    : "Please state reason for rejection..."
                }
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setSelectedPass(null);
                  setModalType(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={modalType === "approve" ? handleApprove : handleReject}
                disabled={submitting}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                  modalType === "approve"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                    : "bg-red-600 hover:bg-red-700 text-white shadow-red-500/20"
                }`}
              >
                {submitting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : modalType === "approve" ? (
                  "Confirm Authorization"
                ) : (
                  "Confirm Rejection"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Pass Modal */}
      {modalType === "view_qr" && selectedPass && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl text-center space-y-4 relative text-slate-900 dark:text-white">
            <button
              onClick={() => {
                setSelectedPass(null);
                setModalType(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 mb-1">
              <Award className="h-8 w-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Faculty Digital Gate Pass</h3>
              <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold mt-0.5">
                Principal Authorized Pass
              </p>
            </div>

            {selectedPass.qr_code && (
              <div className="p-4 bg-white rounded-2xl shadow-inner inline-block mx-auto border-4 border-slate-200 dark:border-slate-800">
                <img
                  src={selectedPass.qr_code}
                  alt="Faculty Gatepass QR"
                  className="w-48 h-48 mx-auto"
                />
              </div>
            )}

            <div className="text-left bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Faculty:</span>
                <span className="text-slate-900 dark:text-white font-bold">{selectedPass.faculty_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Department:</span>
                <span className="text-slate-800 dark:text-slate-300">{selectedPass.faculty_department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Reason:</span>
                <span className="text-amber-700 dark:text-amber-300 font-semibold">{selectedPass.reason}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Exit Window:</span>
                <span className="text-slate-800 dark:text-slate-300">
                  {new Date(selectedPass.exit_time).toLocaleTimeString()}
                </span>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Download className="h-4 w-4" />
              Print / Save Gate Pass
            </button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (Fixed 1-Tap Access for Mobile) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0a1e33]/95 dark:bg-[#060e18]/95 backdrop-blur-md border-t border-white/10 px-2 py-1.5 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => {
            setActiveTab("pending");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer relative ${
            activeTab === "pending"
              ? "text-amber-400 font-bold"
              : "text-slate-400 hover:text-slate-200 font-medium"
          }`}
        >
          <div className="relative">
            <Clock className="h-5 w-5" />
            {pendingPasses.length > 0 && (
              <span className="absolute -top-1 -right-2 bg-amber-500 text-slate-950 font-black text-[9px] h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center animate-pulse">
                {pendingPasses.length}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Pending</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("history");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer ${
            activeTab === "history"
              ? "text-amber-400 font-bold"
              : "text-slate-400 hover:text-slate-200 font-medium"
          }`}
        >
          <User className="h-5 w-5" />
          <span className="text-[10px] tracking-tight mt-0.5">Faculty Logs</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("student_history");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer ${
            activeTab === "student_history"
              ? "text-amber-400 font-bold"
              : "text-slate-400 hover:text-slate-200 font-medium"
          }`}
        >
          <Users className="h-5 w-5" />
          <span className="text-[10px] tracking-tight mt-0.5">Student Logs</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("all");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer ${
            activeTab === "all"
              ? "text-amber-400 font-bold"
              : "text-slate-400 hover:text-slate-200 font-medium"
          }`}
        >
          <FileText className="h-5 w-5" />
          <span className="text-[10px] tracking-tight mt-0.5">All Passes</span>
        </button>
      </nav>
    </div>
  );
}
