/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect } from "react";
import {
  FileText,
  Compass,
  User,
  Clock,
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  LogOut,
  Download,
  Plus,
  Trash2,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Sun,
  Moon,
  ShieldCheck,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Camera,
  Info,
  QrCode,
  GraduationCap,
  Building2,
  Phone,
  Mail
} from "lucide-react";
import { gatepassService } from "../services/gatepassService.js";
import NotificationCenter from "./NotificationCenter";
import sbjainLogo from "../assets/sbjain-logo.png";

export default function StudentDashboard({ user, onLogout, isDarkMode, onToggleTheme }) {
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reason, setReason] = useState("");
  const [destination, setDestination] = useState("");
  const getTodayLocalDateStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const [exitDate, setExitDate] = useState(getTodayLocalDateStr());
  const [exitTimeOnly, setExitTimeOnly] = useState("09:00");
  const [selectedHodId, setSelectedHodId] = useState("");
  const [selectedHodName, setSelectedHodName] = useState("");
  const [hodsList, setHodsList] = useState([]);
  const [phone, setPhone] = useState(user.phone || "");
  const [email, setEmail] = useState(user.email || "");
  const [photo, setPhoto] = useState(user.photo || "");
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("status");
  const [lateEntries, setLateEntries] = useState([]);
  const [lateReason, setLateReason] = useState("");
  const [lateTime, setLateTime] = useState("");
  const [submittingLate, setSubmittingLate] = useState(false);
  const [cancelPassId, setCancelPassId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const fetchPasses = async () => {
    setLoading(true);
    try {
      const data = await gatepassService.getStudentHistory();
      setPasses(data || []);
    } catch (err) {
      setError(err.message || "Failed to fetch gate passes.");
    } finally {
      setLoading(false);
    }
  };

  const fetchLateEntries = async () => {
    try {
      const data = await gatepassService.getLateComeEntries();
      setLateEntries(data || []);
    } catch (err) {
      console.error("Failed to fetch late entries:", err);
    }
  };

  const handleLateComeSubmit = async (e) => {
    e.preventDefault();
    if (!lateReason || !lateReason.trim()) {
      showToast("Please enter reason for coming late.", "error");
      return;
    }
    setSubmittingLate(true);
    try {
      const nowIso = new Date().toISOString();
      await gatepassService.submitLateCome({
        arrival_time: nowIso,
        reason: lateReason.trim()
      });
      showToast("Late arrival logged successfully with current date & time!");
      setLateReason("");
      await fetchLateEntries();
    } catch (err) {
      showToast(err.message || "Failed to log late arrival.", "error");
    } finally {
      setSubmittingLate(false);
    }
  };

  useEffect(() => {
    fetchPasses();
    fetchLateEntries();
    const fetchHodsData = async () => {
      try {
        const data = await gatepassService.getPublicInfo();
        setHodsList(data.hods || []);
      } catch (err) {
        console.error("Failed to fetch HODs for apply dropdown:", err);
      }
    };
    fetchHodsData();
    const interval = setInterval(() => {
      fetchPasses();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!reason || !exitDate || !exitTimeOnly) {
      showToast("Please fill all mandatory fields (Reason, Leaving Date, and Leaving Time).", "error");
      return;
    }

    const combinedExitDateTime = new Date(`${exitDate}T${exitTimeOnly}:00`);

    setSubmitLoading(true);
    try {
      await gatepassService.applyGatePass({
        reason,
        exit_time: combinedExitDateTime.toISOString()
      });
      setReason("");
      setExitDate(getTodayLocalDateStr());
      setExitTimeOnly("09:00");
      showToast("Gate pass application submitted successfully!");
      await fetchPasses();
      setActiveTab("status");
    } catch (err) {
      showToast(err.message || "Failed to submit request.", "error");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCancelPass = (passId) => {
    setCancelPassId(passId);
  };

  const executeCancelPass = async () => {
    if (!cancelPassId) return;
    try {
      await gatepassService.cancelGatePass(cancelPassId);
      showToast("Gate pass request cancelled successfully.");
      setCancelPassId(null);
      fetchPasses();
    } catch (err) {
      showToast(err.message || "Failed to cancel request.", "error");
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await gatepassService.updateStudentProfile({
        phone,
        email,
        photo
      });
      showToast("Profile updated successfully!");
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      showToast(err.message || "Failed to update profile.", "error");
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result);
      };
      reader.readAsDataURL(file);
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
      pending: "Pending Teacher Approval",
      pending_hod: "Pending HOD Clearance",
      approved: "Approved • Ready at Gate",
      rejected: "Application Rejected",
      exited: "Out-Of-Campus (Active)",
      closed: "Returned & Closed",
      cancelled: "Cancelled by Student"
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getRiskBadge = (level) => {
    if (!level) return null;
    const styles = {
      low: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
      medium: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
      high: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30"
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${styles[level] || styles.low}`}>
        <Sparkles className="h-3 w-3" />
        <span>Risk: {level}</span>
      </span>
    );
  };

  const activePass = passes.find((p) => p.status === "pending" || p.status === "pending_hod" || p.status === "approved" || p.status === "exited");
  const completedCount = passes.filter((p) => p.status === "closed").length;

  return (
    <div className="min-h-screen bg-[#f0f5fa] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-20 sm:pb-12 transition-colors">
      {/* 1. TOP HEADER (INSTITUTIONAL NAVY #0a1e33) */}
      <header className="bg-[#0a1e33] border-b border-[#081726] sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between min-h-[3.75rem] sm:min-h-16 py-2.5 sm:py-3 gap-2 sm:gap-4">
            {/* College Identity */}
            <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0">
              <div className="h-9 w-9 sm:h-11 sm:w-11 bg-white rounded-xl p-1 border border-white/20 shadow-xs flex items-center justify-center shrink-0">
                <img
                  src={sbjainLogo}
                  alt="SBJITMR Logo"
                  className="h-7 w-7 sm:h-9 sm:w-9 object-contain"
                />
              </div>
              <div className="min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <h1 className="text-xs sm:text-sm font-extrabold text-white leading-tight truncate drop-shadow-xs">
                    S. B. Jain Institute of Technology
                  </h1>
                  <span className="hidden sm:inline-flex bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                    STUDENT PORTAL
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-300 font-medium truncate mt-0.5">
                  <span className="sm:hidden text-emerald-300 font-semibold">Student Portal • </span>Nagpur
                </p>
              </div>
            </div>

            {/* Actions: Notifications + User Preview + Theme Toggle + Logout */}
            <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
              <NotificationCenter />

              <div className="hidden md:flex items-center space-x-2.5 pl-2 pr-1">
                {photo ? (
                  <img src={photo} alt={user.name} className="h-8 w-8 rounded-full border border-white/20 object-cover" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-emerald-300">
                    <User className="h-4 w-4" />
                  </div>
                )}
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-white leading-tight">{user.name}</span>
                  <span className="text-[10px] text-slate-300 font-mono">Roll: {user.roll_no}</span>
                </div>
              </div>

              <div className="h-6 w-px bg-white/15 hidden md:block" />

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

              {/* Sign Out Button */}
              <button
                onClick={onLogout}
                className="inline-flex items-center space-x-1.5 p-1.5 sm:px-3 sm:py-1.5 border border-white/20 hover:border-white/40 text-xs font-semibold rounded-lg text-white bg-white/5 hover:bg-white/15 transition shadow-xs cursor-pointer"
                title="Sign out of Student Session"
              >
                <LogOut className="h-3.5 w-3.5 text-slate-300" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-4 sm:space-y-6 pb-20 sm:pb-12">
        {/* Student Profile & Navigation Banner Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-5 border-b border-slate-100 dark:border-slate-800/80">
            {/* Student Info */}
            <div className="flex items-center space-x-4">
              <div className="relative shrink-0">
                {photo ? (
                  <img
                    src={photo}
                    alt={user.name}
                    className="h-16 w-16 sm:h-18 sm:w-18 rounded-2xl border-2 border-slate-200 dark:border-slate-700 object-cover shadow-sm"
                  />
                ) : (
                  <div className="h-16 w-16 sm:h-18 sm:w-18 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <User className="h-8 w-8" />
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 h-5 w-5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full flex items-center justify-center" title="Student Active Account">
                  <CheckCircle2 className="h-3 w-3 text-white" />
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {user.name}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                    {user.department || "Engineering"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  <span className="flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
                    Roll No: <strong className="text-slate-700 dark:text-slate-200">{user.roll_no}</strong>
                  </span>
                  {user.email && (
                    <span className="hidden sm:flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      {user.email}
                    </span>
                  )}
                  {user.phone && (
                    <span className="hidden md:flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      {user.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full sm:w-auto shrink-0">
              <div className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-center">
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Total</span>
                <span className="text-sm sm:text-lg font-black text-slate-900 dark:text-white">{passes.length}</span>
              </div>
              <div className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-center">
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Completed</span>
                <span className="text-sm sm:text-lg font-black text-emerald-600 dark:text-emerald-400">{completedCount}</span>
              </div>
              <div className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-center">
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Late Marks</span>
                <span className="text-sm sm:text-lg font-black text-amber-600 dark:text-amber-400">{lateEntries.length}</span>
              </div>
            </div>
          </div>

          {/* Sub-Navigation Tabs Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pt-4 no-scrollbar">
            {[
              { id: "status", label: "Gate Pass Status", icon: Compass, badge: activePass ? "Active" : null, badgeColor: "bg-emerald-500 text-white" },
              { id: "apply", label: "Apply Gate Pass", icon: Plus, badge: null },
              { id: "history", label: "My History", icon: FileText, badge: passes.length, badgeColor: "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300" },
              { id: "late", label: "Late Arrival Log", icon: Clock, badge: lateEntries.length, badgeColor: "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300" },
              { id: "profile", label: "Profile Settings", icon: User, badge: null }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id === "late") fetchLateEntries();
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-[#1e60d5] text-white shadow-sm"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/70 border border-slate-200/80 dark:border-slate-700/60"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{tab.label}</span>
                  {tab.badge !== null && (
                    <span className={`text-[10px] px-2 py-0.2 rounded-full font-extrabold ${isActive ? "bg-white/20 text-white" : tab.badgeColor}`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. DYNAMIC TAB CONTENTS */}

        {/* TAB 1: PASS STATUS */}
        {activeTab === "status" && (
          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto" />
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 font-medium">Checking active gate passes...</p>
              </div>
            ) : activePass ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* QR Code Security Card (4 cols) */}
                <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
                  <div className="w-full flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <QrCode className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      Security Gate Pass QR
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">#{activePass.id}</span>
                  </div>

                  {activePass.qr_code && activePass.status !== "exited" ? (
                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 inline-block mb-4 shadow-sm">
                      <img src={activePass.qr_code} alt="GatePass QR Code" className="h-48 w-48 rounded-xl mx-auto" />
                      <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mt-2.5 flex items-center justify-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Single-Use Verified Pass</span>
                      </div>
                    </div>
                  ) : activePass.status === "exited" ? (
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/80 h-48 w-48 flex flex-col items-center justify-center mb-4 p-4 text-emerald-700 dark:text-emerald-300">
                      <CheckCircle className="h-12 w-12 text-emerald-500 mb-2" />
                      <span className="text-xs font-bold text-center">QR Scanned at Gate</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium text-center">Exit recorded by security checkpoint</span>
                    </div>
                  ) : (
                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 h-48 w-48 flex flex-col items-center justify-center mb-4 p-4 text-slate-400">
                      <ShieldAlert className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-2" />
                      <span className="text-xs font-bold text-center text-slate-600 dark:text-slate-300">QR Generating Upon Clearance</span>
                      <span className="text-[10px] text-slate-400 mt-1">Awaiting approval</span>
                    </div>
                  )}

                  {activePass.qr_code && activePass.status !== "exited" && (
                    <a
                      href={activePass.qr_code}
                      download={`gatepass-${activePass.id}.png`}
                      className="inline-flex items-center justify-center w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                    >
                      <Download className="h-4 w-4 mr-1.5" />
                      Download QR Code
                    </a>
                  )}

                  <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-left w-full">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                      <strong className="text-slate-700 dark:text-slate-300">Protocol:</strong> Present this QR to the gate security guard on exit. Do not share screenshots. Pass closes upon scan.
                    </p>
                  </div>
                </div>

                {/* Pass Dossier Card (8 cols) */}
                <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gate Pass Record Dossier</span>
                      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                        Pass #{activePass.id} • Active Outing Request
                      </h3>
                    </div>
                    {getStatusBadge(activePass.status)}
                  </div>

                  {/* AI Risk Assessment Banner */}
                  {activePass.risk_level && (
                    <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                      activePass.risk_level === "high"
                        ? "bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300"
                        : activePass.risk_level === "medium"
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300"
                        : "bg-blue-500/10 border-blue-500/30 text-blue-800 dark:text-blue-300"
                    }`}>
                      <Sparkles className="h-5 w-5 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="text-xs font-bold uppercase tracking-wider flex items-center justify-between">
                          <span>Monthly Usage Risk Rating: {activePass.risk_level}</span>
                        </div>
                        <div className="text-xs font-medium mt-1 leading-relaxed">{activePass.risk_remarks}</div>
                      </div>
                    </div>
                  )}

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reason for Outing</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-start gap-2">
                        <FileText className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                        <span>{activePass.reason}</span>
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Requested Exit Window</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                        <span>{new Date(activePass.exit_time).toLocaleString("en-IN", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                      </span>
                    </div>
                  </div>

                  {/* Approver Remarks Box */}
                  {activePass.approved_by && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Faculty / HOD Clearance Remarks</span>
                      <div className="text-xs text-slate-700 dark:text-slate-200 font-semibold">
                        Authorized by: <strong className="text-slate-900 dark:text-white">{activePass.approved_by}</strong>
                      </div>
                      {activePass.remarks && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic">"{activePass.remarks}"</p>
                      )}
                    </div>
                  )}

                  {/* Action Banner */}
                  {activePass.status === "pending" && (
                    <div className="pt-2 flex items-center justify-between">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Application pending in Class Teacher / HOD clearance queue.</p>
                      <button
                        onClick={() => handleCancelPass(activePass.id)}
                        className="inline-flex items-center px-4 py-2 border border-rose-500/30 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4 mr-1.5" />
                        Cancel Request
                      </button>
                    </div>
                  )}

                  {activePass.status === "approved" && (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <div className="text-xs">
                        <strong className="font-bold">Pass is Authorized &amp; Active!</strong>
                        <p className="text-emerald-700 dark:text-emerald-400 mt-0.5">Please show your QR code to security at the main gate.</p>
                      </div>
                    </div>
                  )}

                  {activePass.status === "exited" && (
                    <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-800 dark:text-indigo-300 flex items-center gap-3">
                      <Clock className="h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                      <div className="text-xs">
                        <strong className="font-bold">Currently Outside Campus</strong>
                        <p className="text-indigo-700 dark:text-indigo-400 mt-0.5">
                          Exit logged at {new Date(activePass.exit_marked_at).toLocaleTimeString()}. Remember to return before curfew.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-8 max-w-lg mx-auto">
                <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400 dark:text-slate-500">
                  <Compass className="h-8 w-8" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white">No Active Gate Pass</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium leading-relaxed">
                  You do not have any pending or active out-of-campus passes at the moment. Need to leave campus for official or urgent work?
                </p>
                <button
                  onClick={() => setActiveTab("apply")}
                  className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-[#1e60d5] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Apply for Gate Pass</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: APPLY FORM */}
        {activeTab === "apply" && (
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm max-w-2xl mx-auto space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-extrabold text-lg">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span>Out-Of-Campus Gate Pass Application</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Your request will automatically route to your registered Class Teacher and HOD for official sign-off.
              </p>
            </div>

            <form onSubmit={handleApply} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Reason for Leaving Campus <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide complete genuine details (e.g., Medical appointment, university duty, urgent personal work)..."
                  className="block w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 text-xs placeholder-slate-400 leading-relaxed font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Leaving Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    type="date"
                    min={getTodayLocalDateStr()}
                    value={exitDate}
                    onChange={(e) => setExitDate(e.target.value)}
                    className="block w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Leaving Time (09:00 AM - 06:00 PM) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={exitTimeOnly}
                    onChange={(e) => setExitTimeOnly(e.target.value)}
                    className="block w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 text-xs font-medium cursor-pointer"
                  >
                    <option value="09:00">09:00 AM</option>
                    <option value="09:30">09:30 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="10:30">10:30 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="11:30">11:30 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="12:30">12:30 PM</option>
                    <option value="13:00">01:00 PM</option>
                    <option value="13:30">01:30 PM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="14:30">02:30 PM</option>
                    <option value="15:00">03:00 PM</option>
                    <option value="15:30">03:30 PM</option>
                    <option value="16:00">04:00 PM</option>
                    <option value="16:30">04:30 PM</option>
                    <option value="17:00">05:00 PM</option>
                    <option value="17:30">05:30 PM</option>
                    <option value="18:00">06:00 PM</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs flex items-center gap-2.5 font-medium">
                <Info className="h-4 w-4 shrink-0 text-blue-500" />
                <span>Parent SMS &amp; WhatsApp notifications are sent automatically upon security gate exit scan.</span>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("status")}
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-6 py-2.5 bg-[#1e60d5] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 transition cursor-pointer"
                >
                  {submitLoading ? (
                    <>
                      <RefreshCw className="animate-spin h-4 w-4" />
                      <span>Submitting Application...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Application</span>
                      <ArrowUpRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: PASS HISTORY */}
        {activeTab === "history" && (
          <div className="space-y-6">
            {/* Monthly Statistics Overview */}
            {passes.length > 0 && (
              <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <h3 className="text-xs font-extrabold text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-600" />
                  <span>Month-Wise Outing Statistics</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(
                    passes.reduce((acc, pass) => {
                      const date = new Date(pass.exit_time || pass.created_at);
                      const monthName = date.toLocaleString("default", { month: "long", year: "numeric" });
                      const dayStr = date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
                      if (!acc[monthName]) {
                        acc[monthName] = { total: 0, closed: 0, pending: 0, approved: 0, dates: [] };
                      }
                      acc[monthName].total++;
                      if (pass.status === "closed") acc[monthName].closed++;
                      else if (pass.status === "pending" || pass.status === "pending_hod") acc[monthName].pending++;
                      else if (pass.status === "approved" || pass.status === "exited") acc[monthName].approved++;
                      acc[monthName].dates.push(`${dayStr} (${pass.status.toUpperCase()})`);
                      return acc;
                    }, {})
                  ).map(([month, stat]) => (
                    <div key={month} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm mb-1">{month}</div>
                        <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold mb-3">
                          Total Passes: <span className="text-slate-900 dark:text-white font-extrabold">{stat.total}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold rounded-full">Completed: {stat.closed}</span>
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded-full">Approved: {stat.approved}</span>
                          {stat.pending > 0 && <span className="px-2 py-0.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10px] font-bold rounded-full">Pending: {stat.pending}</span>}
                        </div>
                      </div>
                      <div className="border-t border-slate-200 dark:border-slate-700 pt-2.5 mt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Pass Dates &amp; Status:</span>
                        <div className="text-[10px] text-slate-600 dark:text-slate-300 font-medium flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                          {stat.dates.map((d, idx) => (
                            <span key={idx} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-200">{d}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Passes Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">My Gate Pass History Records</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Historical register of all outing requests.</p>
                </div>
                <button
                  onClick={fetchPasses}
                  className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer"
                  title="Refresh History"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              {passes.length === 0 ? (
                <div className="text-center py-16 text-slate-400 dark:text-slate-500">
                  <FileText className="h-10 w-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                  <span className="text-sm font-semibold">No gate pass records found.</span>
                </div>
              ) : (
                <div>
                  {/* Mobile Card Layout (block sm:hidden) */}
                  <div className="block sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
                    {passes.map((pass) => (
                      <div key={pass.id} className="p-3.5 space-y-2 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200 block">
                              Pass #{pass.id}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">
                              {new Date(pass.exit_time).toLocaleDateString("en-IN", { day: '2-digit', month: 'short' })} at {new Date(pass.exit_time).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {getStatusBadge(pass.status)}
                          </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5 text-xs text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700/60">
                          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 block mb-0.5">Reason</span>
                          <p className="leading-snug">{pass.reason}</p>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 pt-0.5">
                          <span>
                            Gate Scan: <strong className="text-slate-700 dark:text-slate-300">{pass.exit_marked_at ? new Date(pass.exit_marked_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Not Scanned"}</strong>
                          </span>
                          {pass.risk_level && getRiskBadge(pass.risk_level)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View (hidden sm:block) */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                      <thead className="bg-slate-50 dark:bg-slate-800/60">
                        <tr>
                          <th className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pass ID</th>
                          <th className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Reason for Outing</th>
                          <th className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Exit Window</th>
                          <th className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Gate Scan Timestamp</th>
                          <th className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider">Risk Level</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                        {passes.map((pass) => (
                          <tr key={pass.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                            <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-slate-800 dark:text-slate-200">#{pass.id}</td>
                            <td className="px-6 py-4">
                              <div className="font-semibold text-slate-900 dark:text-slate-100 max-w-xs truncate">{pass.reason}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-300 font-medium">
                              {new Date(pass.exit_time).toLocaleString("en-IN", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                              {pass.exit_marked_at ? (
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {new Date(pass.exit_marked_at).toLocaleTimeString()}
                                </span>
                              ) : (
                                <span className="text-slate-400 dark:text-slate-500 font-italic">Not Scanned</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(pass.status)}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{getRiskBadge(pass.risk_level)}</td>
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

        {/* TAB 4: LATE COME ENTRY */}
        {activeTab === "late" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Form to submit late come (5 cols) */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <span>Self Late-Arrival Logging</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  Enter your genuine arrival time and explanation for teacher attendance review.
                </p>
              </div>

              <form onSubmit={handleLateComeSubmit} className="space-y-4">
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                      </span>
                      <span className="text-[11px] font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                        Auto-Captured Timestamp
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold bg-amber-200/60 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-md">
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
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Reason for Coming Late <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={lateReason}
                    onChange={(e) => setLateReason(e.target.value)}
                    required
                    placeholder="Provide genuine explanation (e.g. Bus breakdown, heavy traffic, train delay, medical emergency)..."
                    className="block w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-amber-500 leading-relaxed placeholder-slate-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingLate}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submittingLate ? (
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <>
                      <Clock className="h-4 w-4" />
                      <span>Submit Late Arrival</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* History timeline (7 cols) */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">My Late Entry History</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Logs submitted for class teacher records.</p>
                </div>
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                  Total: {lateEntries.length}
                </span>
              </div>

              {lateEntries.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500">
                  <Clock className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No late entries recorded.</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">Any late-come self-reports submitted will appear in this timeline.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                  {lateEntries.map((entry) => (
                    <div key={entry.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100/80 dark:hover:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60 transition flex flex-col sm:flex-row justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 uppercase">
                            Late Arrival
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">
                            Logged: {new Date(entry.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                          "{entry.reason}"
                        </p>
                      </div>
                      <div className="flex flex-col sm:items-end justify-center shrink-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Arrival Time</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 mt-0.5">
                          {new Date(entry.arrival_time).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: PROFILE EDIT */}
        {activeTab === "profile" && (
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm max-w-xl mx-auto space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span>My Profile Configuration</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Keep your registration details accurate for college security records.</p>
            </div>

            {profileSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>Profile updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleProfileUpdate} className="space-y-5">
              <div className="flex flex-col items-center justify-center space-y-2.5 pb-2">
                {photo ? (
                  <img src={photo} alt={user.name} className="h-24 w-24 rounded-2xl border-2 border-slate-200 dark:border-slate-700 object-cover shadow-sm" />
                ) : (
                  <div className="h-24 w-24 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400">
                    <User className="h-10 w-10" />
                  </div>
                )}
                <label className="cursor-pointer inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold px-3 py-1.5 rounded-xl transition">
                  <Camera className="h-3.5 w-3.5" />
                  <span>Upload Photo</span>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                  <input
                    disabled
                    type="text"
                    value={user.name}
                    className="block w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-semibold cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Roll Number</label>
                  <input
                    disabled
                    type="text"
                    value={user.roll_no}
                    className="block w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-semibold cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#1e60d5] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer"
                >
                  Save Profile Info
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* 4. MODALS & TOAST NOTIFICATIONS */}
      {/* Custom Cancellation Confirmation Modal */}
      {cancelPassId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="p-2.5 bg-rose-500/10 rounded-xl">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Cancel Gate Pass Request</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gate Pass Action</p>
              </div>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
              <p>Are you sure you want to cancel this pending gate pass request?</p>
              <p className="bg-amber-500/10 text-amber-800 dark:text-amber-300 p-2.5 rounded-xl border border-amber-500/20 font-medium">
                This will recall your application from HOD queues. You will need to create a new application if you change your mind.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setCancelPassId(null)}
                className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Go Back
              </button>
              <button
                onClick={executeCancelPass}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MOBILE FIXED BOTTOM NAVIGATION BAR */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0a1e33]/95 backdrop-blur-md border-t border-[#081726] px-2 py-1.5 flex items-center justify-around shadow-2xl">
        {[
          { id: "status", label: "Status", icon: Compass, badge: activePass ? "●" : null },
          { id: "apply", label: "Apply", icon: Plus, badge: null },
          { id: "history", label: "History", icon: FileText, badge: passes.length || null },
          { id: "late", label: "Late Logs", icon: Clock, badge: lateEntries.length || null },
          { id: "profile", label: "Profile", icon: User, badge: null }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === "late") fetchLateEntries();
              }}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-bold transition relative cursor-pointer ${
                isActive ? "text-emerald-400 font-extrabold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="relative">
                <Icon className={`h-5 w-5 ${isActive ? "text-emerald-400 scale-110" : "text-slate-400"}`} />
                {tab.badge && (
                  <span className="absolute -top-1 -right-2 h-3.5 min-w-[14px] px-1 bg-emerald-500 text-slate-950 font-black text-[8px] rounded-full flex items-center justify-center">
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
