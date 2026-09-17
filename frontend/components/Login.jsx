/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect } from "react";
import {
  ShieldCheck,
  School,
  Lock,
  Mail,
  ChevronRight,
  AlertCircle,
  Loader2,
  UserPlus,
  ArrowLeft,
  User,
  Phone,
  Building2,
  ClipboardList,
  LayoutGrid,
  GraduationCap,
  Clock,
  Bell,
  Code,
  Shield,
  UserCheck,
  Key,
  CheckCircle2,
  LogIn,
  Moon,
  Sun,
  Users
} from "lucide-react";
import { apiFetch, setAuthToken, setAuthSession } from "../lib/api.js";
import { gatepassService } from "../services/gatepassService.js";
import campusImg from "../assets/campus.png";
import sbjainLogo from "../assets/sbjain-logo.png";
export default function Login({ onLoginSuccess, isDarkMode, onToggleTheme }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRollNo, setRegRollNo] = useState("");
  const [regCollegeId, setRegCollegeId] = useState("");
  const [regDept, setRegDept] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regClassTeacherId, setRegClassTeacherId] = useState("");
  const [regHODId, setRegHODId] = useState("");
  const [regRole, setRegRole] = useState("student"); // "student" | "faculty"
  const [selectedPortal, setSelectedPortal] = useState(null); // null | "student" | "teacher" | "faculty" | "hod" | "principal" | "guard" | "admin"
  const [departments, setDepartments] = useState([]);
  const [hods, setHods] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [selectedDemoHOD, setSelectedDemoHOD] = useState("");
  const [showHODDropdown, setShowHODDropdown] = useState(false);
  const [selectedDemoTeacher, setSelectedDemoTeacher] = useState("");
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);

  // 2-Step Authentication (2FA) State
  const [requires2FA, setRequires2FA] = useState(false);
  const [challengeId, setChallengeId] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [twoFactorOtp, setTwoFactorOtp] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    let timer;
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const data = await apiFetch("/api/public/info");
        const loadedDepts = data.departments || [];
        const loadedHods = data.hods || [];
        setDepartments(loadedDepts);
        setHods(loadedHods);
        setTeachers(data.teachers || []);
        setStudentsList(data.students || []);
        if (loadedDepts.length > 0) {
          const defaultDept = loadedDepts[0].department_name;
          setRegDept(defaultDept);
          const defaultHod = loadedHods.find((h) => h.department === defaultDept);
          if (defaultHod) {
            setRegHODId(defaultHod.id);
          }
        }
      } catch (err) {
        console.error("Failed to load login meta indicators:", err);
      }
    };
    fetchMetadata();
  }, []);

  const handleDepartmentChange = (deptName) => {
    setRegDept(deptName);
    const matchingHod = hods.find((h) => h.department === deptName);
    if (matchingHod) {
      setRegHODId(matchingHod.id);
    } else {
      setRegHODId("");
    }
  };
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const data = await apiFetch("/api/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });

      if (data.requires2FA) {
        setRequires2FA(true);
        setChallengeId(data.challengeId);
        setMaskedPhone(data.maskedEmail || data.maskedPhone || data.userEmail || email || "");
        setSuccessMsg(data.message || "A 6-digit verification code has been sent to your registered institutional email address.");
        setResendCountdown(60);
        return;
      }

      setAuthSession(data.token, data.user, data.role);
      onLoginSuccess(data.user, data.role);
    } catch (err) {
      setError(err.message || "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    if (!twoFactorOtp || twoFactorOtp.length < 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/api/login/verify-2fa", {
        method: "POST",
        body: JSON.stringify({ challengeId, otp: twoFactorOtp })
      });
      setAuthSession(data.token, data.user, data.role);
      onLoginSuccess(data.user, data.role);
    } catch (err) {
      setError(err.message || "Invalid verification code. Please check your Gmail inbox and WhatsApp.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend2FA = async () => {
    if (resendCountdown > 0) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/api/login/resend-2fa", {
        method: "POST",
        body: JSON.stringify({ challengeId })
      });
      setSuccessMsg(data.message || "A new 6-digit verification code has been dispatched to your Gmail & WhatsApp.");
      setResendCountdown(60);
    } catch (err) {
      setError(err.message || "Failed to resend verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!regEmail.toLowerCase().endsWith("@sbjit.edu.in")) {
      setError("Registration is restricted to authorized institutional email IDs ending with @sbjit.edu.in");
      return;
    }

    if (regRole === "faculty") {
      if (!regName || !regEmail || !regPassword || !regDept || !regPhone || !regHODId) {
        setError("Please fill out all required fields in the faculty registration form including choosing your Department HOD.");
        return;
      }
      setLoading(true);
      try {
        await gatepassService.registerFaculty({
          name: regName,
          email: regEmail,
          password: regPassword,
          department: regDept,
          phone: regPhone,
          selected_hod_id: regHODId
        });
        setSuccessMsg("Faculty account registered successfully! You can now log in.");
        setIsRegistering(false);
        setEmail("");
        setPassword("");
        setRegName("");
        setRegEmail("");
        setRegPassword("");
        setRegPhone("");
        setRegHODId("");
      } catch (err) {
        setError(err.message || "Faculty registration failed.");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!regName || !regEmail || !regPassword || !regRollNo || !regDept || !regPhone || !regClassTeacherId || !regHODId) {
      setError("Please fill out all fields in the registration form including choosing your Class Teacher and HOD.");
      return;
    }

    setLoading(true);
    try {
      await apiFetch("/api/register", {
        method: "POST",
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          roll_no: regRollNo,
          college_id: regRollNo,
          department: regDept,
          phone: regPhone,
          parent_phone: "",
          class_teacher_id: regClassTeacherId,
          selected_hod_id: regHODId
        })
      });
      setSuccessMsg("Registration successful! You can now log in with your credentials.");
      setIsRegistering(false);
      setEmail("");
      setPassword("");
      setRegName("");
      setRegEmail("");
      setRegPassword("");
      setRegRollNo("");
      setRegCollegeId("");
      setRegPhone("");
      setRegClassTeacherId("");
      setRegHODId("");
    } catch (err) {
      setError(err.message || "Registration failed. Please verify your details.");
    } finally {
      setLoading(false);
    }
  };
  const handleSelectPortal = (roleKey, specificEmail = null) => {
    setSelectedPortal(roleKey);
    setIsRegistering(false);
    setIsForgotPassword(false);
    setError(null);
    setSuccessMsg(null);
    setShowHODDropdown(false);
    setShowTeacherDropdown(false);

    if (specificEmail) {
      setEmail(specificEmail);
    } else {
      setEmail("");
    }
    setPassword("");
  };

  const getPortalTitle = (portalKey) => {
    switch (portalKey) {
      case "student":
        return "Student Portal";
      case "teacher":
        return "Class Incharge Portal";
      case "faculty":
        return "Teacher Staff Portal";
      case "hod":
        return "HOD Portal";
      case "principal":
        return "Principal Portal";
      case "guard":
        return "Guard Station Checkpoint";
      case "admin":
        return "Administrator Portal";
      default:
        return "Institutional Account";
    }
  };
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    if (!forgotEmail) {
      setError("Please enter your institutional email address.");
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch("/api/forgot-password/request-otp", {
        method: "POST",
        body: JSON.stringify({ email: forgotEmail })
      });
      let successMessage = res.message || "OTP sent successfully! Please check your email.";
      if (res.dev_otp) {
        successMessage = `\u{1F527} [Development Mode]: OTP code is ${res.dev_otp} (SMTP connection failed or is not configured; code shown for testing).`;
      }
      setSuccessMsg(successMessage);
      setOtpSent(true);
    } catch (err) {
      setError(err.message || "Failed to request OTP. Please verify your email.");
    } finally {
      setLoading(false);
    }
  };
  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    if (!forgotEmail || !forgotOtp || !forgotNewPassword || !forgotConfirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch("/api/forgot-password/verify-otp", {
        method: "POST",
        body: JSON.stringify({
          email: forgotEmail,
          otp: forgotOtp,
          new_password: forgotNewPassword
        })
      });
      setSuccessMsg(res.message || "Password reset successful! You can now log in.");
      setIsForgotPassword(false);
      setOtpSent(false);
      setEmail(forgotEmail);
      setPassword(forgotNewPassword);
      setForgotEmail("");
      setForgotOtp("");
      setForgotNewPassword("");
      setForgotConfirmPassword("");
    } catch (err) {
      setError(err.message || "Verification failed. Please check your OTP and inputs.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-[#f0f5fa] text-slate-800 font-sans antialiased flex flex-col justify-between select-none relative overflow-x-hidden">
      {/* 1. TOP HEADER (INSTITUTIONAL NAVY #0a1e33) */}
      <header className="bg-[#0a1e33] border-b border-[#061424] sticky top-0 z-40 shadow-md w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* College Identity */}
            <div className="flex items-center space-x-3.5 min-w-0">
              <div className="h-10 w-10 bg-white rounded-lg p-1 border border-white/20 shadow-xs flex items-center justify-center shrink-0">
                <img
                  src={sbjainLogo}
                  alt="SBJITMR Logo"
                  className="h-8 w-8 object-contain"
                />
              </div>
              <div className="min-w-0">
                <h1 className="text-xs sm:text-sm font-bold text-white leading-tight truncate">
                  S. B. Jain Institute of Technology, Management & Research
                </h1>
                <p className="text-[11px] text-slate-300 font-medium">Nagpur</p>
              </div>
            </div>

            {/* Header Badge: Gate Pass Administration */}
            <div className="hidden md:flex items-center space-x-3 pl-4 sm:pl-8 pr-4">
              <div className="p-1.5 bg-blue-500/10 border border-blue-400/20 rounded-lg text-sky-400">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
                    Gate Pass Administration
                  </span>
                  <span className="bg-[#1a73e8] text-white text-[10px] font-bold px-2 py-0.5 rounded-md tracking-wider">
                    PORTAL
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Secure • Smart • Student Friendly
                </p>
              </div>
            </div>

            {/* Right Action: Theme Toggle */}
            <div className="flex items-center space-x-3 shrink-0">
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
            </div>
          </div>
        </div>
      </header>

      {/* 2. SPLIT HERO MAIN SECTION WITH VISIBLE CAMPUS BACKGROUND */}
      <main className="flex-1 w-full relative min-h-[calc(100vh-64px-44px)] flex items-center overflow-hidden">
        {/* Full Visible Campus Background Photo */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none animate-campus-motion scale-100"
          style={{ backgroundImage: `url(${campusImg})` }}
        />
        {/* Subtle Dark-Blue Transparent Gradient on Left — Ensures high text contrast while keeping college backdrop vibrant */}
        <div className="absolute inset-y-0 left-0 w-full lg:w-[62%] bg-gradient-to-r from-[#07192d]/85 via-[#0a233f]/60 to-transparent pointer-events-none" />

        {/* Content Container */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* LEFT HERO COLUMN (SMOOTH ENTRY) */}
          <div className="lg:col-span-7 space-y-5 animate-hero-left">
            
            {/* White College Identity Card (Unchanged, Premium & Clean) */}
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-4.5 border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.15)] hover:shadow-[0_12px_35px_rgb(0,0,0,0.2)] transition-all duration-300 flex items-center space-x-4 max-w-xl">
              <div className="p-1.5 bg-white rounded-xl border border-slate-100/90 shadow-xs shrink-0 flex items-center justify-center">
                <img
                  src={sbjainLogo}
                  alt="SBJITMR Logo"
                  className="h-13 sm:h-15 w-auto object-contain"
                />
              </div>
              <div className="h-12 w-px bg-slate-200/90 hidden sm:block shrink-0" />
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-extrabold text-[#0a2342] tracking-tight leading-snug">
                  S. B. Jain Institute of Technology, Management & Research
                </h2>
                <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                  AN AUTONOMOUS INSTITUTE • NAAC GRADE &apos;A&apos; ACCREDITED
                </p>
                <p className="text-[11px] sm:text-xs font-semibold text-slate-600 mt-0.5">
                  Smart Digital Gatepass & Latemark Monitoring System
                </p>
              </div>
            </div>

            {/* Welcome Pill */}
            <div className="pt-1">
              <span className="inline-block bg-blue-500/20 backdrop-blur-xs text-sky-300 text-xs font-bold px-3.5 py-1 rounded-full border border-blue-400/30 shadow-xs">
                Welcome to
              </span>
            </div>

            {/* Main Heading (White & Highly Visible) */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.12] drop-shadow-sm">
              Gate Pass<br />Administration Portal
            </h1>

            {/* Subtitle (Clean Light Slate) */}
            <p className="text-sm sm:text-base text-slate-200 font-medium max-w-lg leading-relaxed">
              Manage student gate-pass activity, approvals, and campus security – all in one place.
            </p>

            {/* 4 Feature Points with Translucent Glass Backing */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 max-w-xl pt-2">
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-1.5 p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/15 shadow-xs hover:bg-white/20 hover:-translate-y-0.5 transition-all duration-300">
                <div className="p-2 bg-blue-500/20 text-sky-300 rounded-lg shrink-0 border border-blue-400/20">
                  <ShieldCheck className="h-4.5 w-4.5 text-sky-300" />
                </div>
                <span className="text-xs font-bold text-white leading-tight">Secure<br className="hidden sm:inline" /> Campus</span>
              </div>
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-1.5 p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/15 shadow-xs hover:bg-white/20 hover:-translate-y-0.5 transition-all duration-300">
                <div className="p-2 bg-blue-500/20 text-sky-300 rounded-lg shrink-0 border border-blue-400/20">
                  <GraduationCap className="h-4.5 w-4.5 text-sky-300" />
                </div>
                <span className="text-xs font-bold text-white leading-tight">Student<br className="hidden sm:inline" /> Safety</span>
              </div>
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-1.5 p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/15 shadow-xs hover:bg-white/20 hover:-translate-y-0.5 transition-all duration-300">
                <div className="p-2 bg-blue-500/20 text-sky-300 rounded-lg shrink-0 border border-blue-400/20">
                  <Clock className="h-4.5 w-4.5 text-sky-300" />
                </div>
                <span className="text-xs font-bold text-white leading-tight">Real-time<br className="hidden sm:inline" /> Monitoring</span>
              </div>
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-1.5 p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/15 shadow-xs hover:bg-white/20 hover:-translate-y-0.5 transition-all duration-300">
                <div className="p-2 bg-blue-500/20 text-sky-300 rounded-lg shrink-0 border border-blue-400/20">
                  <Bell className="h-4.5 w-4.5 text-sky-300" />
                </div>
                <span className="text-xs font-bold text-white leading-tight">Instant<br className="hidden sm:inline" /> Notifications</span>
              </div>
            </div>

            {/* Slogan */}
            <div className="pt-3 text-sm sm:text-base font-semibold text-sky-300 italic tracking-wide flex items-center flex-wrap gap-2">
              <span>Safe Campus</span>
              <span className="text-slate-400 font-normal">|</span>
              <span className="relative pb-1">
                Responsible Students
                <svg className="absolute left-0 bottom-0 w-full h-1 text-sky-400" viewBox="0 0 100 4" preserveAspectRatio="none">
                  <path d="M0 2 Q 50 4, 100 2" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
                </svg>
              </span>
              <span className="text-slate-400 font-normal">|</span>
              <span>Better Tomorrow</span>
            </div>
          </div>

          {/* RIGHT FLOATING PORTAL CARD COLUMN (SMOOTH FLOAT-IN) */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end animate-hero-right">
            <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-2xl hover:shadow-[0_25px_60px_-15px_rgba(10,30,51,0.2)] border border-white/80 max-w-md w-full relative z-10 transition-all duration-500">
              
              {/* Error and Success Alerts */}
              {error && (
                <div className="mb-4 bg-rose-50 border border-rose-200 p-3.5 rounded-xl flex items-start space-x-2.5 text-xs text-rose-800 font-semibold shadow-xs animate-shake">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="mb-4 bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl flex items-start space-x-2.5 text-xs text-emerald-800 font-semibold shadow-xs animate-fade-in">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* VIEW 1: SELECT YOUR PORTAL (MAIN DEFAULT VIEW) */}
              {selectedPortal === null && !isRegistering && !isForgotPassword && !requires2FA ? (
                <div className="space-y-4">
                  {/* Top Centered Pill: SELECT YOUR PORTAL */}
                  <div className="flex justify-center pb-1">
                    <span className="px-4 py-1 rounded-full text-xs font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-200/80 tracking-wider uppercase animate-pill-pulse">
                      SELECT YOUR PORTAL
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {/* Row 1: Student Portal */}
                    <button
                      type="button"
                      onClick={() => handleSelectPortal("student")}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-200 bg-white hover:bg-blue-50/40 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 cursor-pointer group text-left animate-stagger-1"
                    >
                      <div className="flex items-center space-x-3.5 min-w-0">
                        <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 shrink-0">
                          <User className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 block truncate group-hover:text-blue-900 transition-colors">
                            Student Portal
                          </span>
                          <span className="text-[11px] text-slate-500 block truncate">
                            Apply for gate pass and track your requests
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-all duration-300 group-hover:translate-x-1 shrink-0 ml-2" />
                    </button>

                    {/* Row 2: Class Incharge Portal */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowHODDropdown(false);
                        if (teachers.length > 0) {
                          setShowTeacherDropdown(!showTeacherDropdown);
                        } else {
                          handleSelectPortal("teacher");
                        }
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-200 bg-white hover:bg-blue-50/40 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 cursor-pointer group text-left animate-stagger-2"
                    >
                      <div className="flex items-center space-x-3.5 min-w-0">
                        <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 shrink-0">
                          <School className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 block truncate group-hover:text-blue-900 transition-colors">
                            Class Incharge Portal
                          </span>
                          <span className="text-[11px] text-slate-500 block truncate">
                            Review and approve student requests
                          </span>
                        </div>
                      </div>
                      <ChevronRight className={`h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-all duration-300 ${showTeacherDropdown ? 'rotate-90 text-blue-600' : 'group-hover:translate-x-1'} shrink-0 ml-2`} />
                    </button>

                    {/* Class Incharge Dynamic Dropdown Logic */}
                    {showTeacherDropdown && (
                      <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2 animate-fade-in shadow-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold uppercase text-blue-800 tracking-wider">Select Class Incharge</span>
                          <button
                            type="button"
                            onClick={() => {
                              setShowTeacherDropdown(false);
                              handleSelectPortal("teacher");
                            }}
                            className="text-[10px] text-blue-600 hover:text-blue-800 font-bold hover:underline"
                          >
                            Manual Entry &rarr;
                          </button>
                        </div>
                        <select
                          value={selectedDemoTeacher}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSelectedDemoTeacher(val);
                            if (val) {
                              handleSelectPortal("teacher", val);
                            }
                          }}
                          className="w-full px-3 py-2 border border-blue-300 rounded-lg bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
                        >
                          <option value="">-- Choose Class Incharge --</option>
                          {teachers.map((t) => (
                            <option key={t.id} value={t.email}>
                              {t.name} ({t.class_name || t.department})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Row 3: Teacher Staff Portal */}
                    <button
                      type="button"
                      onClick={() => handleSelectPortal("faculty")}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-200 bg-white hover:bg-blue-50/40 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 cursor-pointer group text-left animate-stagger-3"
                    >
                      <div className="flex items-center space-x-3.5 min-w-0">
                        <div className="p-2 rounded-xl bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 shrink-0">
                          <ClipboardList className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 block truncate group-hover:text-blue-900 transition-colors">
                            Teacher Staff Portal
                          </span>
                          <span className="text-[11px] text-slate-500 block truncate">
                            Manage student gate-pass activity
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-all duration-300 group-hover:translate-x-1 shrink-0 ml-2" />
                    </button>

                    {/* Row 4: HOD Portal */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowTeacherDropdown(false);
                        if (hods.length > 0) {
                          setShowHODDropdown(!showHODDropdown);
                        } else {
                          handleSelectPortal("hod");
                        }
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-200 bg-white hover:bg-blue-50/40 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 cursor-pointer group text-left animate-stagger-4"
                    >
                      <div className="flex items-center space-x-3.5 min-w-0">
                        <div className="p-2 rounded-xl bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 shrink-0">
                          <Users className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 block truncate group-hover:text-blue-900 transition-colors">
                            HOD Portal
                          </span>
                          <span className="text-[11px] text-slate-500 block truncate">
                            Approve and monitor department requests
                          </span>
                        </div>
                      </div>
                      <ChevronRight className={`h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-all duration-300 ${showHODDropdown ? 'rotate-90 text-teal-600' : 'group-hover:translate-x-1'} shrink-0 ml-2`} />
                    </button>

                    {/* HOD Dynamic Dropdown Logic */}
                    {showHODDropdown && (
                      <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl space-y-2 animate-fade-in shadow-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold uppercase text-teal-800 tracking-wider">Select Department HOD</span>
                          <button
                            type="button"
                            onClick={() => {
                              setShowHODDropdown(false);
                              handleSelectPortal("hod");
                            }}
                            className="text-[10px] text-teal-600 hover:text-teal-800 font-bold hover:underline"
                          >
                            Manual Entry &rarr;
                          </button>
                        </div>
                        <select
                          value={selectedDemoHOD}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSelectedDemoHOD(val);
                            if (val) {
                              handleSelectPortal("hod", val);
                            }
                          }}
                          className="w-full px-3 py-2 border border-teal-300 rounded-lg bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 shadow-xs"
                        >
                          <option value="">-- Choose Department HOD --</option>
                          {hods.map((h) => (
                            <option key={h.id} value={h.email}>
                              {h.name} ({h.department})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Row 5: Principal Portal */}
                    <button
                      type="button"
                      onClick={() => handleSelectPortal("principal")}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-200 bg-white hover:bg-blue-50/40 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 cursor-pointer group text-left animate-stagger-5"
                    >
                      <div className="flex items-center space-x-3.5 min-w-0">
                        <div className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 shrink-0">
                          <ShieldCheck className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 block truncate group-hover:text-blue-900 transition-colors">
                            Principal Portal
                          </span>
                          <span className="text-[11px] text-slate-500 block truncate">
                            Oversee and manage overall activity
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-all duration-300 group-hover:translate-x-1 shrink-0 ml-2" />
                    </button>

                    {/* Row 6: Guard Station */}
                    <button
                      type="button"
                      onClick={() => handleSelectPortal("guard")}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-200 bg-white hover:bg-blue-50/40 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 cursor-pointer group text-left animate-stagger-6"
                    >
                      <div className="flex items-center space-x-3.5 min-w-0">
                        <div className="p-2 rounded-xl bg-sky-50 text-sky-600 group-hover:bg-sky-600 group-hover:text-white group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 shrink-0">
                          <Shield className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 block truncate group-hover:text-blue-900 transition-colors">
                            Guard Station
                          </span>
                          <span className="text-[11px] text-slate-500 block truncate">
                            Verify and record student exits
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-all duration-300 group-hover:translate-x-1 shrink-0 ml-2" />
                    </button>

                    {/* Row 7: Administrator */}
                    <button
                      type="button"
                      onClick={() => handleSelectPortal("admin")}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-200 bg-white hover:bg-blue-50/40 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 cursor-pointer group text-left animate-stagger-7"
                    >
                      <div className="flex items-center space-x-3.5 min-w-0">
                        <div className="p-2 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 shrink-0">
                          <Lock className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 block truncate group-hover:text-blue-900 transition-colors">
                            Administrator
                          </span>
                          <span className="text-[11px] text-slate-500 block truncate">
                            System management and reports
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-all duration-300 group-hover:translate-x-1 shrink-0 ml-2" />
                    </button>
                  </div>
                </div>
              ) : requires2FA ? (
                /* STEP 2-FACTOR: EMAIL OTP VERIFICATION VIEW */
                <div className="space-y-5">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setRequires2FA(false);
                        setTwoFactorOtp("");
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center space-x-1 transition cursor-pointer"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Back to Login</span>
                    </button>
                    <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                      Step 2 of 2
                    </span>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 text-center shadow-xs">
                    <div className="h-10 w-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mx-auto mb-2">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">
                      2-Step Email Verification
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      A 6-digit verification code has been sent to your registered institutional email:
                    </p>
                    <div className="mt-2 inline-block px-3 py-1 bg-white rounded-lg text-xs font-bold text-blue-700 border border-blue-200 shadow-xs">
                      ✉️ {maskedPhone || "registered email"}
                    </div>
                  </div>

                  <form className="space-y-4" onSubmit={handleVerify2FA}>
                    <div>
                      <label htmlFor="twoFactorOtp" className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider text-center">
                        Enter 6-Digit Verification Code
                      </label>
                      <div className="mt-2 relative">
                        <input
                          id="twoFactorOtp"
                          type="text"
                          maxLength={6}
                          required
                          value={twoFactorOtp}
                          onChange={(e) => setTwoFactorOtp(e.target.value.replace(/[^0-9]/g, ''))}
                          className="block w-full text-center tracking-[0.5em] text-lg font-black py-2.5 px-4 border border-slate-300 rounded-xl bg-white text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
                          placeholder="••••••"
                          autoFocus
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || twoFactorOtp.length < 6}
                      className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                          Verifying Code...
                        </>
                      ) : (
                        <>
                          <span>Verify &amp; Log In</span>
                          <ChevronRight className="ml-1.5 h-4 w-4 text-blue-200" />
                        </>
                      )}
                    </button>

                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={handleResend2FA}
                        disabled={resendCountdown > 0 || loading}
                        className="text-xs font-bold text-slate-500 hover:text-blue-600 disabled:opacity-50 transition cursor-pointer"
                      >
                        {resendCountdown > 0 ? (
                          `Resend OTP in ${resendCountdown}s`
                        ) : (
                          `Didn't receive code? Resend Email OTP`
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              ) : !isRegistering && !isForgotPassword ? (
                /* STEP 2: SIGN IN VIEW FOR SELECTED PORTAL */
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <button
                      type="button"
                      onClick={() => setSelectedPortal(null)}
                      className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center space-x-1 transition cursor-pointer"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Select Different Portal</span>
                    </button>
                    {(selectedPortal === "student" || selectedPortal === "faculty") && (
                      <button
                        onClick={() => {
                          setIsRegistering(true);
                          setIsForgotPassword(false);
                          setError(null);
                          setSuccessMsg(null);
                        }}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1 transition cursor-pointer"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        <span>Register Account</span>
                      </button>
                    )}
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Selected Portal</div>
                      <div className="text-sm font-bold text-slate-900">{getPortalTitle(selectedPortal)}</div>
                    </div>
                    <span className="px-2.5 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-full border border-blue-200">
                      Sign In
                    </span>
                  </div>

                  <form className="space-y-3.5" onSubmit={handleLoginSubmit} autoComplete="off">
                    <div>
                      <div className="flex justify-between items-center">
                        <label htmlFor="email" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                          Institutional Email Address
                        </label>
                        {email && (selectedPortal === "hod" || selectedPortal === "teacher") && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            ✓ Auto-filled
                          </span>
                        )}
                      </div>
                      <div className="mt-1 relative rounded-md shadow-xs">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                          id="email"
                          type="email"
                          required
                          autoComplete="off"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs font-medium"
                          placeholder="Enter your institutional email"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center">
                        <label htmlFor="password" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setIsForgotPassword(true);
                            setIsRegistering(false);
                            setError(null);
                            setSuccessMsg(null);
                          }}
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-700 transition cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="mt-1 relative rounded-md shadow-xs">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                          id="password"
                          type="password"
                          required
                          autoComplete="new-password"
                          autoFocus={Boolean(email)}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs font-medium"
                          placeholder="Enter your password"
                        />
                      </div>
                      {email && (selectedPortal === "hod" || selectedPortal === "teacher") && (
                        <p className="text-[11px] text-slate-500 mt-1 font-medium">
                          Email auto-populated. Enter your password to log in.
                        </p>
                      )}
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-xs text-xs font-bold text-white bg-[#0a1e33] hover:bg-[#112d4a] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition cursor-pointer"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                            Verifying Credentials...
                          </>
                        ) : (
                          <>
                            <span>Sign In to {getPortalTitle(selectedPortal)}</span>
                            <ChevronRight className="ml-1.5 h-4 w-4 text-blue-300" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              ) : isForgotPassword ? (
                /* VIEW 3: FORGOT PASSWORD VIEW */
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                    <button
                      onClick={() => {
                        setIsForgotPassword(false);
                        setOtpSent(false);
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <h3 className="text-sm font-bold text-slate-900">
                      {otpSent ? "Enter Verification Code" : "Reset Your Password"}
                    </h3>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start space-x-2">
                    <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <span className="text-[11px] text-blue-800 font-medium leading-relaxed">
                      {otpSent ? "Enter the 6-digit OTP code sent to your email, then set and confirm your new account password." : "Provide your registered institutional email to receive a secure 6-digit verification code."}
                    </span>
                  </div>

                  {!otpSent ? (
                    <form className="space-y-3.5" onSubmit={handleRequestOTP}>
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-700 tracking-wider">Institutional Email ID</label>
                        <div className="mt-1 relative rounded-md shadow-xs">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-4 w-4 text-slate-400" />
                          </div>
                          <input
                            required
                            type="email"
                            placeholder="email@sbjit.edu.in"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs font-medium"
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full flex justify-center items-center py-2.5 px-4 rounded-xl shadow-xs text-xs font-bold text-white bg-[#0a1e33] hover:bg-[#112d4a] disabled:opacity-50 cursor-pointer transition"
                        >
                          {loading ? <>
                            <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                            Sending Verification Code...
                          </> : "Request Verification OTP"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form className="space-y-3" onSubmit={handleForgotPasswordSubmit}>
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-700 tracking-wider">Institutional Email ID</label>
                        <div className="mt-1 relative rounded-md shadow-xs">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-4 w-4 text-slate-400" />
                          </div>
                          <input
                            disabled
                            type="email"
                            value={forgotEmail}
                            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 text-xs font-medium cursor-not-allowed"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-700 tracking-wider">Enter 6-Digit OTP</label>
                        <div className="mt-1 relative rounded-md shadow-xs">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <ShieldCheck className="h-4 w-4 text-slate-400" />
                          </div>
                          <input
                            required
                            type="text"
                            maxLength={6}
                            placeholder="e.g. 123456"
                            value={forgotOtp}
                            onChange={(e) => setForgotOtp(e.target.value.replace(/[^0-9]/g, ""))}
                            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs font-medium"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-700 tracking-wider">New Password</label>
                        <div className="mt-1 relative rounded-md shadow-xs">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-4 w-4 text-slate-400" />
                          </div>
                          <input
                            required
                            type="password"
                            placeholder="••••••••"
                            value={forgotNewPassword}
                            onChange={(e) => setForgotNewPassword(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs font-medium"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-700 tracking-wider">Confirm New Password</label>
                        <div className="mt-1 relative rounded-md shadow-xs">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-4 w-4 text-slate-400" />
                          </div>
                          <input
                            required
                            type="password"
                            placeholder="••••••••"
                            value={forgotConfirmPassword}
                            onChange={(e) => setForgotConfirmPassword(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs font-medium"
                          />
                        </div>
                      </div>

                      <div className="pt-2 flex flex-col space-y-2">
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full flex justify-center items-center py-2.5 px-4 rounded-xl shadow-xs text-xs font-bold text-white bg-[#0a1e33] hover:bg-[#112d4a] disabled:opacity-50 cursor-pointer transition"
                        >
                          {loading ? <Loader2 className="animate-spin h-4 w-4 text-white" /> : "Verify and Reset Password"}
                        </button>

                        <button
                          type="button"
                          disabled={loading}
                          onClick={handleRequestOTP}
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-700 text-center transition cursor-pointer"
                        >
                          Resend Verification OTP Code
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                /* VIEW 2: NEW STUDENT / FACULTY SELF-REGISTRATION FORM */
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegistering(false);
                        setError(null);
                      }}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <h3 className="text-sm font-bold text-slate-900">
                      Register {regRole === "faculty" ? "Faculty Member Account" : "Student Account"}
                    </h3>
                  </div>

                  {/* Role Switcher */}
                  <div className="flex bg-slate-100 p-1 rounded-xl space-x-1">
                    <button
                      type="button"
                      onClick={() => setRegRole("student")}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                        regRole === "student"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Student Account
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegRole("faculty")}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                        regRole === "faculty"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Faculty Account
                    </button>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start space-x-2">
                    <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <span className="text-[11px] text-amber-800 font-medium leading-relaxed">
                      Registration is restricted to institutional email addresses ending in <strong>@sbjit.edu.in</strong>.
                    </span>
                  </div>

                  <form className="space-y-3" onSubmit={handleRegisterSubmit} autoComplete="off">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-700 tracking-wider">
                        {regRole === "faculty" ? "Full Faculty Name" : "Full Student Name"}
                      </label>
                      <div className="mt-1 relative rounded-md shadow-xs">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                          required
                          type="text"
                          autoComplete="off"
                          placeholder={regRole === "faculty" ? "Enter faculty full name" : "Enter student full name"}
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    </div>

                    {regRole === "student" && (
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-700 tracking-wider">Roll Number</label>
                        <div className="mt-1 relative rounded-md shadow-xs">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <ClipboardList className="h-4 w-4 text-slate-400" />
                          </div>
                          <input
                            required
                            type="text"
                            autoComplete="off"
                            placeholder="Enter your roll number"
                            value={regRollNo}
                            onChange={(e) => setRegRollNo(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-700 tracking-wider">Academic Department</label>
                      <div className="mt-1 relative rounded-md shadow-xs">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Building2 className="h-4 w-4 text-slate-400" />
                        </div>
                        <select
                          required
                          value={regDept}
                          onChange={(e) => handleDepartmentChange(e.target.value)}
                          className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        >
                          <option value="">Select Department</option>
                          {departments.map((dept) => (
                            <option key={dept.id} value={dept.department_name}>
                              {dept.department_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {regRole === "student" && (
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-700 tracking-wider">Class Incharge Teacher</label>
                        <div className="mt-1 relative rounded-md shadow-xs">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <School className="h-4 w-4 text-slate-400" />
                          </div>
                          <select
                            required
                            value={regClassTeacherId}
                            onChange={(e) => setRegClassTeacherId(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                          >
                            <option value="">Select Class Teacher</option>
                            {teachers.filter(t => !regDept || t.department === regDept).map((teacher) => (
                              <option key={teacher.id} value={teacher.id}>
                                {teacher.name} ({teacher.class_name || teacher.department})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-700 tracking-wider">Department HOD</label>
                      <div className="mt-1 relative rounded-md shadow-xs">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Building2 className="h-4 w-4 text-slate-400" />
                        </div>
                        <select
                          required
                          value={regHODId}
                          onChange={(e) => setRegHODId(e.target.value)}
                          className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        >
                          <option value="">Select Department HOD</option>
                          {hods.map((hod) => (
                            <option key={hod.id} value={hod.id}>
                              {hod.name} ({hod.department})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-700 tracking-wider">Institutional Email Address</label>
                      <div className="mt-1 relative rounded-md shadow-xs">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                          required
                          type="email"
                          autoComplete="off"
                          placeholder="yourname@sbjit.edu.in"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-700 tracking-wider">Mobile Number</label>
                      <div className="mt-1 relative rounded-md shadow-xs">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Phone className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                          required
                          type="tel"
                          autoComplete="off"
                          placeholder="Enter 10-digit mobile number"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-700 tracking-wider">Password</label>
                      <div className="mt-1 relative rounded-md shadow-xs">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                          required
                          type="password"
                          autoComplete="new-password"
                          placeholder="Create a strong password"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center items-center py-2.5 px-4 rounded-xl shadow-xs text-xs font-bold text-white bg-[#0a1e33] hover:bg-[#112d4a] disabled:opacity-50 cursor-pointer transition"
                      >
                        {loading ? <Loader2 className="animate-spin h-4 w-4 text-white" /> : "Register Your Account"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>

      {/* 3. FOOTER */}
      <footer className="bg-[#0a1e33] border-t border-[#081726] text-slate-400 text-xs py-3 px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 z-30">
        <div className="text-[11px] text-slate-400 text-center sm:text-left">
          © 2026 S. B. Jain Institute of Technology, Management & Research, Nagpur
        </div>
        <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>Secure SSL Encrypted Connection</span>
        </div>
        <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
          <Code className="h-3.5 w-3.5 text-blue-400" />
          <span>Designed &amp; Developed by Team S.A.R.A</span>
        </div>
      </footer>
    </div>
  );
}
