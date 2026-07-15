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
  ClipboardList
} from "lucide-react";
import { apiFetch, setAuthToken } from "../lib/api.js";
import campusImg from "../assets/campus.png";
export default function Login({ onLoginSuccess }) {
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
  const [departments, setDepartments] = useState([]);
  const [hods, setHods] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedDemoHOD, setSelectedDemoHOD] = useState("");
  const [showHODDropdown, setShowHODDropdown] = useState(false);
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const data = await apiFetch("/api/public/info");
        setDepartments(data.departments || []);
        setHods(data.hods || []);
        setTeachers(data.teachers || []);
        if (data.departments && data.departments.length > 0) {
          setRegDept(data.departments[0].department_name);
        }
      } catch (err) {
        console.error("Failed to load login meta indicators:", err);
      }
    };
    fetchMetadata();
  }, []);
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
      setAuthToken(data.token);
      localStorage.setItem("gatepass_user", JSON.stringify(data.user));
      localStorage.setItem("gatepass_role", data.role);
      onLoginSuccess(data.user, data.role);
    } catch (err) {
      setError(err.message || "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    if (!regName || !regEmail || !regPassword || !regRollNo || !regDept || !regPhone || !regClassTeacherId || !regHODId) {
      setError("Please fill out all fields in the registration form including choosing your Class Teacher and HOD.");
      return;
    }
    if (!regEmail.toLowerCase().endsWith("@sbjit.edu.in")) {
      setError("Registration is restricted to authorized institutional email IDs ending with @sbjit.edu.in");
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
          // Resolved dynamically in backend
          class_teacher_id: regClassTeacherId,
          selected_hod_id: regHODId
        })
      });
      setSuccessMsg("Registration successful! You can now log in with your credentials.");
      setIsRegistering(false);
      setEmail(regEmail);
      setPassword(regPassword);
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
  const handleDemoLogin = (demoRole, specificEmail) => {
    if (demoRole === "student") {
      setIsRegistering(true);
      setError("Please register your student account first or sign in using your registered credentials.");
      setSuccessMsg(null);
      return;
    }
    let demoEmail = "";
    switch (demoRole) {
      case "hod":
        demoEmail = specificEmail || "hod@college.edu";
        break;
      case "guard":
        demoEmail = "guard@college.edu";
        break;
      case "admin":
        demoEmail = "admin@college.edu";
        break;
      case "teacher":
        demoEmail = "teacher1@college.edu";
        break;
    }
    setEmail(demoEmail);
    setPassword("");
    setError(null);
    setSuccessMsg(null);
    setShowHODDropdown(false);
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
  return <div className="relative min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-center py-10 sm:px-6 lg:px-8 font-sans overflow-hidden transition-colors duration-300">

      {
    /* Background Campus Image Layer (Low transparency / high visibility) */
  }
      <div
    className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-80 dark:opacity-40"
    style={{ backgroundImage: `url(${campusImg})` }}
  />
      {
    /* Overlay gradient to ensure text readability */
  }
      <div className="absolute inset-0 bg-gradient-to-b from-slate-100/10 via-slate-100/20 to-slate-100/30 dark:from-slate-950/40 dark:via-slate-950/70 dark:to-slate-950/90 pointer-events-none" />

      <div className="relative z-10 sm:mx-auto w-full max-w-md text-center">
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg transform transition-transform hover:scale-105">
            <School className="h-9 w-9 text-emerald-400" />
          </div>
        </div>
        <h2 className="mt-5 text-xl font-black tracking-tight text-slate-900 dark:text-slate-100 font-sans px-4">
          S. B. Jain Institute of Technology, Management and Research
        </h2>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-bold tracking-wide uppercase">
          Smart Digital Campus Access Portal
        </p>
      </div>

      <div className="relative z-10 mt-6 sm:mx-auto w-full sm:max-w-md px-4">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 shadow-xl rounded-2xl border border-slate-200 dark:border-slate-800 sm:px-10">
          
          {
    /* Status Alert Panels */
  }
          {error && <div className="mb-5 bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 p-4 rounded-r-xl flex items-start space-x-3 shadow-sm">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div className="text-xs text-red-700 dark:text-red-400 font-bold leading-relaxed">{error}</div>
            </div>}

          {successMsg && <div className="mb-5 bg-emerald-50 dark:bg-emerald-950/30 border-l-4 border-emerald-500 p-4 rounded-r-xl flex items-start space-x-3 shadow-sm">
              <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-700 dark:text-emerald-400 font-bold leading-relaxed">{successMsg}</div>
            </div>}

          {
    /* VIEW 1: SIGN IN VIEW */
  }
          {!isRegistering && !isForgotPassword ? <div className="space-y-6">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Sign In to Your Account</h3>
                <button
    onClick={() => {
      setIsRegistering(true);
      setIsForgotPassword(false);
      setError(null);
      setSuccessMsg(null);
    }}
    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-350 flex items-center space-x-1 transition cursor-pointer"
  >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Register Your Account</span>
                </button>
              </div>

              <form className="space-y-4" onSubmit={handleLoginSubmit}>
                <div>
                  <label htmlFor="email" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Institutional Email Address
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
    id="email"
    type="email"
    required
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 text-xs font-semibold"
    placeholder="name@sbjit.edu.in"
  />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center">
                    <label htmlFor="password" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
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
    className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-350 transition cursor-pointer"
  >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
    id="password"
    type="password"
    required
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 text-xs font-semibold"
    placeholder="••••••••"
  />
                  </div>
                </div>

                <div className="pt-2">
                  <button
    type="submit"
    disabled={loading}
    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-md text-xs font-bold text-white bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 dark:focus:ring-emerald-500 disabled:opacity-50 transition-all cursor-pointer"
  >
                    {loading ? <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                        Verifying Credentials...
                      </> : <>
                        <span>Sign In Securely</span>
                        <ChevronRight className="ml-1.5 h-4 w-4 text-emerald-400" />
                      </>}
                  </button>
                </div>
              </form>

              {
    /* Quick Developers Console for Testing */
  }
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest text-slate-400 dark:text-slate-555">
                    <span className="bg-white dark:bg-slate-900 px-3">Developer Quick Login</span>
                  </div>
                </div>

                {
    /* HOD Dynamic Dropdown Logic */
  }
                {showHODDropdown && <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3 animation-fade-in">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Select HOD from Dataset</span>
                      <button onClick={() => setShowHODDropdown(false)} className="text-[10px] text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350 font-bold">Cancel</button>
                    </div>
                    <select
    value={selectedDemoHOD}
    onChange={(e) => {
      const val = e.target.value;
      setSelectedDemoHOD(val);
      if (val) {
        handleDemoLogin("hod", val);
      }
    }}
    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200"
  >
                      <option value="" className="dark:bg-slate-900">-- Choose Department HOD --</option>
                      {hods.map((h) => <option key={h.id} value={h.email} className="dark:bg-slate-900">
                          {h.name} ({h.department})
                        </option>)}
                    </select>
                  </div>}

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
    type="button"
    onClick={() => handleDemoLogin("student")}
    className="flex flex-col items-center justify-center p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:border-slate-400 dark:hover:border-slate-600 transition-all cursor-pointer group"
  >
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-slate-950 dark:group-hover:text-white">Student Portal</span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">Register / Sign In</span>
                  </button>

                  <button
    type="button"
    onClick={() => {
      if (hods.length > 0) {
        setShowHODDropdown(true);
      } else {
        handleDemoLogin("hod");
      }
    }}
    className="flex flex-col items-center justify-center p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:border-slate-400 dark:hover:border-slate-600 transition-all cursor-pointer group"
  >
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-slate-955 dark:group-hover:text-white">HOD Portal</span>
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-extrabold mt-0.5">Choose Dept HOD ▾</span>
                  </button>

                  <button
    type="button"
    onClick={() => handleDemoLogin("teacher")}
    className="flex flex-col items-center justify-center p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:border-slate-400 dark:hover:border-slate-600 transition-all cursor-pointer group"
  >
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-slate-955 dark:group-hover:text-white">Class Incharge</span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">Teacher Dashboard</span>
                  </button>

                  <button
    type="button"
    onClick={() => handleDemoLogin("guard")}
    className="flex flex-col items-center justify-center p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:border-slate-400 dark:hover:border-slate-600 transition-all cursor-pointer group"
  >
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-slate-955 dark:group-hover:text-white">Guard Station</span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">Gate Checkpoint</span>
                  </button>

                  <button
    type="button"
    onClick={() => handleDemoLogin("admin")}
    className="col-span-2 flex flex-col items-center justify-center p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:border-slate-400 dark:hover:border-slate-600 transition-all cursor-pointer group"
  >
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-slate-955 dark:group-hover:text-white">Administrator</span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">System Admin Portal</span>
                  </button>
                </div>
              </div>
            </div> : isForgotPassword ? (
    /* VIEW 3: FORGOT PASSWORD VIEW */
    <div className="space-y-5">
              <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <button
      onClick={() => {
        setIsForgotPassword(false);
        setOtpSent(false);
        setError(null);
        setSuccessMsg(null);
      }}
      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
    >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {otpSent ? "Enter Verification Code" : "Reset Your Password"}
                </h3>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-955/30 border border-emerald-200 dark:border-emerald-900 rounded-xl p-3 flex items-start space-x-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold leading-relaxed">
                  {otpSent ? "Enter the 6-digit OTP code sent to your email, then set and confirm your new account password." : "Provide your registered institutional email to receive a secure 6-digit verification code."}
                </span>
              </div>

              {!otpSent ? (
      /* STEP 1: REQUEST OTP FORM */
      <form className="space-y-3.5" onSubmit={handleRequestOTP}>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Institutional Email ID</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
        required
        type="email"
        placeholder="email@sbjit.edu.in"
        value={forgotEmail}
        onChange={(e) => setForgotEmail(e.target.value)}
        className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-emerald-500 text-xs font-semibold focus:bg-white dark:focus:bg-slate-800"
      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center items-center py-2.5 px-4 rounded-xl shadow-md text-xs font-bold text-white bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 disabled:opacity-50 cursor-pointer transition-all"
      >
                      {loading ? <>
                          <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                          Sending Verification Code...
                        </> : "Request Verification OTP"}
                    </button>
                  </div>
                </form>
    ) : (
      /* STEP 2: VERIFY OTP AND RESET FORM */
      <form className="space-y-3.5" onSubmit={handleForgotPasswordSubmit}>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Institutional Email ID</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
        disabled
        type="email"
        value={forgotEmail}
        className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-105 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs font-semibold cursor-not-allowed"
      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Enter 6-Digit OTP</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
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
        className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-emerald-500 text-xs font-semibold focus:bg-white dark:focus:bg-slate-800"
      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">New Password</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
        required
        type="password"
        placeholder="••••••••"
        value={forgotNewPassword}
        onChange={(e) => setForgotNewPassword(e.target.value)}
        className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-emerald-500 text-xs font-semibold focus:bg-white dark:focus:bg-slate-800"
      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Confirm New Password</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
        required
        type="password"
        placeholder="••••••••"
        value={forgotConfirmPassword}
        onChange={(e) => setForgotConfirmPassword(e.target.value)}
        className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-emerald-500 text-xs font-semibold focus:bg-white dark:focus:bg-slate-800"
      />
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col space-y-2">
                    <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center items-center py-2.5 px-4 rounded-xl shadow-md text-xs font-bold text-white bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 disabled:opacity-50 cursor-pointer transition-all"
      >
                      {loading ? <Loader2 className="animate-spin h-4 w-4 text-white" /> : "Verify and Reset Password"}
                    </button>

                    <button
        type="button"
        disabled={loading}
        onClick={handleRequestOTP}
        className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-350 text-center transition cursor-pointer"
      >
                      Resend Verification OTP Code
                    </button>
                  </div>
                </form>
    )}
            </div>
  ) : (
    /* VIEW 2: NEW STUDENT SELF-REGISTRATION FORM */
    <div className="space-y-5">
              <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <button
      onClick={() => {
        setIsRegistering(false);
        setError(null);
      }}
      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
    >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Register Your Student Account</h3>
              </div>

              <div className="bg-amber-50 dark:bg-amber-955/30 border border-amber-200 dark:border-amber-900 rounded-xl p-3 flex items-start space-x-2">
                <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span className="text-[10px] text-amber-800 dark:text-amber-300 font-bold leading-relaxed">
                  Security Lock: Registration is restricted to authorized institutional email extensions ending in <strong>@sbjit.edu.in</strong>.
                </span>
              </div>

              <form className="space-y-3.5" onSubmit={handleRegisterSubmit}>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Full Student Name</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
      required
      type="text"
      placeholder="First Name Middle Name Last Name"
      value={regName}
      onChange={(e) => setRegName(e.target.value)}
      className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none"
    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Roll Number</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <ClipboardList className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
      required
      type="text"
      placeholder="e.g. CMxxxxx"
      value={regRollNo}
      onChange={(e) => setRegRollNo(e.target.value)}
      className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none"
    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Academic Department</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building2 className="h-4 w-4 text-slate-400" />
                    </div>
                    <select
      value={regDept}
      onChange={(e) => setRegDept(e.target.value)}
      className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none"
    >
                      {departments.map((dept) => <option key={dept.id} value={dept.department_name} className="dark:bg-slate-900">
                          {dept.department_name}
                        </option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Select Class Teacher (Incharge)</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-slate-400" />
                    </div>
                    <select
      required
      value={regClassTeacherId}
      onChange={(e) => setRegClassTeacherId(e.target.value)}
      className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none"
    >
                      <option value="" className="dark:bg-slate-900">-- Choose Your Class Teacher --</option>
                      {teachers.map((t) => <option key={t.id} value={t.id} className="dark:bg-slate-900">
                          {t.name} (Class: {t.class_name} - {t.department})
                        </option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Select Department HOD</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-slate-400" />
                    </div>
                    <select
      required
      value={regHODId}
      onChange={(e) => setRegHODId(e.target.value)}
      className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none"
    >
                      <option value="" className="dark:bg-slate-900">-- Choose Department HOD --</option>
                      {hods.map((h) => <option key={h.id} value={h.id} className="dark:bg-slate-900">
                          {h.name} ({h.department})
                        </option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">College Email ID</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
      required
      type="email"
      placeholder="email@sbjit.edu.in"
      value={regEmail}
      onChange={(e) => setRegEmail(e.target.value)}
      className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none"
    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Your Mobile No.</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
      required
      type="tel"
      placeholder="+91 xxxxx xxxxx"
      value={regPhone}
      onChange={(e) => setRegPhone(e.target.value)}
      className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none"
    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Password</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
      required
      type="password"
      placeholder="••••••••"
      value={regPassword}
      onChange={(e) => setRegPassword(e.target.value)}
      className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none"
    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
      type="submit"
      disabled={loading}
      className="w-full flex justify-center items-center py-2.5 px-4 rounded-xl shadow-md text-xs font-bold text-white bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 disabled:opacity-50 cursor-pointer transition-all"
    >
                    {loading ? <Loader2 className="animate-spin h-4 w-4 text-white" /> : "Register Your Account"}
                  </button>
                </div>
              </form>
            </div>
  )}

          <div className="mt-6 flex items-center justify-center text-[10px] text-slate-400 dark:text-slate-500 space-x-1.5 font-bold">
            <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Secure SSL Encryption Enabled</span>
          </div>

        </div>
      </div>
    </div>;
}
