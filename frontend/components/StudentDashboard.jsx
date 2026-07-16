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
  RefreshCw
} from "lucide-react";
import { gatepassService } from "../services/gatepassService.js";
import NotificationCenter from "./NotificationCenter";
export default function StudentDashboard({ user, onLogout }) {
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
    }, 4e3);
  };
  const fetchPasses = async () => {
    setLoading(true);
    try {
      const data = await gatepassService.getStudentHistory();
      setPasses(data);
    } catch (err) {
      setError(err.message || "Failed to fetch gate passes.");
    } finally {
      setLoading(false);
    }
  };
  const fetchLateEntries = async () => {
    try {
      const data = await gatepassService.getLateComeEntries();
      setLateEntries(data);
    } catch (err) {
      console.error("Failed to fetch late entries:", err);
    }
  };
  const handleLateComeSubmit = async (e) => {
    e.preventDefault();
    if (!lateTime || !lateReason) {
      showToast("Please select arrival time and reason.", "error");
      return;
    }
    setSubmittingLate(true);
    try {
      await gatepassService.submitLateCome({
        arrival_time: lateTime,
        reason: lateReason
      });
      showToast("Late arrival logged successfully!");
      setLateReason("");
      setLateTime("");
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
  }, []);
  const handleApply = async (e) => {
    e.preventDefault();
    if (!reason || !exitDate || !exitTimeOnly) {
      showToast("Kripya saare mandatory fields (Reason, Leaving Date, aur Leaving Time) ko sahi se fill karein!", "error");
      return;
    }

    // Combine date and time (using local browser time)
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
      setTimeout(() => setProfileSuccess(false), 3e3);
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
      pending: "bg-amber-50 text-amber-700 border-amber-200",
      pending_hod: "bg-blue-50 text-blue-700 border-blue-200",
      approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
      rejected: "bg-rose-50 text-rose-700 border-rose-200",
      exited: "bg-indigo-50 text-indigo-700 border-indigo-200",
      closed: "bg-slate-100 text-slate-700 border-slate-200",
      cancelled: "bg-slate-50 text-slate-400 border-slate-200"
    };
    const labels = {
      pending: "Pending Teacher Approval",
      pending_hod: "Pending HOD Approval",
      approved: "Approved - Ready",
      rejected: "Rejected",
      exited: "Out (Active)",
      closed: "Returned (Closed)",
      cancelled: "Cancelled"
    };
    return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status]}`}>
        {labels[status]}
      </span>;
  };
  const getRiskBadge = (level) => {
    if (!level) return null;
    const styles = {
      low: "bg-blue-50 text-blue-700 border-blue-100",
      medium: "bg-amber-50 text-amber-700 border-amber-100",
      high: "bg-red-50 text-red-700 border-red-100"
    };
    return <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${styles[level]}`}>
        <Sparkles className="h-3 w-3 text-current" />
        <span>Risk level: {level}</span>
      </span>;
  };
  const activePass = passes.find((p) => p.status === "pending" || p.status === "pending_hod" || p.status === "approved" || p.status === "exited");
  return <div className="min-h-screen bg-slate-100 pb-12 font-sans">
      {
    /* Navigation header */
  }
      <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 bg-slate-900 rounded-lg flex items-center justify-center shadow-sm shrink-0">
                <FileText className="h-5 w-5 text-emerald-400" />
              </div>
              <span className="font-extrabold text-slate-900 tracking-tight text-xs sm:text-sm md:text-base leading-tight max-w-[150px] sm:max-w-none line-clamp-2">S. B. Jain Institute of Technology, Management and Research</span>
              <span className="hidden lg:inline bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border border-emerald-200 shrink-0">Student</span>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationCenter />
              <div className="flex items-center space-x-2 text-sm text-slate-700">
                {photo ? <img src={photo} alt={user.name} className="h-8 w-8 rounded-full border border-slate-200 object-cover" /> : <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
                    <User className="h-4 w-4 text-slate-500" />
                  </div>}
                <span className="font-medium hidden md:inline">{user.name}</span>
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

      {
    /* Main Container */
  }
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {
    /* Student Mini Profile Header */
  }
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center space-x-4">
            {photo ? <img src={photo} alt={user.name} className="h-16 w-16 rounded-2xl border border-slate-200 object-cover shadow-sm" /> : <div className="h-16 w-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center shadow-inner">
                <User className="h-8 w-8 text-slate-400" />
              </div>}
            <div>
              <h1 className="text-xl font-bold text-slate-900">{user.name}</h1>
              <p className="text-sm text-slate-500 font-medium">{user.department} • Roll No: <span className="font-semibold text-slate-700">{user.roll_no}</span></p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0 overflow-x-auto pb-1 md:pb-0">
            <button
    onClick={() => setActiveTab("status")}
    className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === "status" ? "bg-slate-900 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"}`}
  >
              GatePass Status
            </button>
            <button
    onClick={() => setActiveTab("apply")}
    className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1 ${activeTab === "apply" ? "bg-slate-900 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"}`}
  >
              <Plus className="h-3.5 w-3.5" />
              <span>Apply New</span>
            </button>
            <button
    onClick={() => setActiveTab("history")}
    className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === "history" ? "bg-slate-900 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"}`}
  >
              My History ({passes.length})
            </button>
            <button
    onClick={() => setActiveTab("profile")}
    className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === "profile" ? "bg-slate-900 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"}`}
  >
              Edit Profile
            </button>
            <button
    onClick={() => {
      setActiveTab("late");
      fetchLateEntries();
    }}
    className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1 ${activeTab === "late" ? "bg-slate-900 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"}`}
  >
              <Clock className="h-3.5 w-3.5" />
              <span>Late Entry</span>
            </button>
          </div>
        </div>

        {
    /* Dynamic tab contents */
  }
        
        {
    /* TAB 1: PASS STATUS */
  }
        {activeTab === "status" && <div className="space-y-6">
            {loading ? <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto" />
                <p className="text-sm text-slate-500 mt-2 font-medium">Checking active gate passes...</p>
              </div> : activePass ? <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {
    /* QR Code display and actions */
  }
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                  <h3 className="text-sm font-bold text-slate-800 mb-4">Gate Pass QR Code</h3>
                  
                  {activePass.qr_code ? <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 inline-block mb-4 shadow-inner">
                      <img src={activePass.qr_code} alt="GatePass QR Code" className="h-52 w-52" />
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-2">Single Use Verified</div>
                    </div> : <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 h-52 w-52 flex flex-col items-center justify-center mb-4 p-4 text-slate-400">
                      <ShieldAlert className="h-10 w-10 text-slate-300 mb-2" />
                      <span className="text-xs font-bold text-center">QR Code will generate upon HOD approval</span>
                    </div>}

                  {activePass.qr_code && <a
    href={activePass.qr_code}
    download={`gatepass-${activePass.id}.png`}
    className="inline-flex items-center justify-center w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition"
  >
                      <Download className="h-4 w-4 mr-1.5" />
                      Download QR Code
                    </a>}
                  <p className="text-[10px] text-slate-400 mt-3 font-medium text-center max-w-xs">
                    Present this QR to the security guard at the college gate. To prevent duplicate scans, do not share screenshot. Code expires immediately after exit is logged.
                  </p>
                </div>

                {
    /* Pass Details details card */
  }
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gate Pass ID: {activePass.id}</span>
                      <h2 className="text-lg font-bold text-slate-800 mt-0.5">Active Gate Pass Details</h2>
                    </div>
                    {getStatusBadge(activePass.status)}
                  </div>

                  {activePass.risk_level && <div className={`p-4 rounded-xl mb-4 border flex items-start space-x-3 ${activePass.risk_level === "high" ? "bg-red-50 border-red-100 text-red-800" : activePass.risk_level === "medium" ? "bg-amber-50 border-amber-100 text-amber-800" : "bg-blue-50 border-blue-100 text-blue-800"}`}>
                      <Sparkles className="h-5 w-5 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider">Monthly Usage Risk Rating: {activePass.risk_level}</div>
                        <div className="text-xs font-medium mt-1 leading-relaxed">{activePass.risk_remarks}</div>
                      </div>
                    </div>}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Reason for Outing</span>
                      <span className="text-sm font-semibold text-slate-800 flex items-center">
                        <FileText className="h-4 w-4 text-slate-400 mr-1.5 shrink-0" />
                        {activePass.reason}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Expected Exit Window</span>
                      <span className="text-sm font-semibold text-slate-800 flex items-center">
                        <Clock className="h-4 w-4 text-slate-400 mr-1.5 shrink-0" />
                        {new Date(activePass.exit_time).toLocaleString()}
                      </span>
                    </div>

                    {activePass.approved_by && <div className="space-y-1.5 md:col-span-2 border-t border-slate-50 pt-4">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">HOD Remarks</span>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs font-semibold text-slate-600 leading-relaxed">
                          Verified & Approved by: <span className="text-slate-800 font-bold">{activePass.approved_by}</span>
                          <p className="mt-1 font-medium text-slate-500 italic">"{activePass.remarks}"</p>
                        </div>
                      </div>}
                  </div>

                  {activePass.status === "pending" && <div className="border-t border-slate-100 pt-4 flex justify-end">
                      <button
    onClick={() => handleCancelPass(activePass.id)}
    className="inline-flex items-center px-4 py-2 border border-red-200 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition cursor-pointer"
  >
                        <Trash2 className="h-4 w-4 mr-1.5" />
                        Cancel Request
                      </button>
                    </div>}

                  {activePass.status === "approved" && <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start space-x-3 text-emerald-800">
                      <CheckCircle className="h-5 w-5 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs font-bold">Approved and Active!</div>
                        <p className="text-xs font-medium mt-1">
                          Your pass is ready. Show the guard the QR code to log your exit. Once scanned, this pass will be closed.
                        </p>
                      </div>
                    </div>}

                  {activePass.status === "exited" && <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-start space-x-3 text-indigo-800">
                      <Clock className="h-5 w-5 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs font-bold">Currently Outside Campus</div>
                        <p className="text-xs font-medium mt-1">
                          Your exit was recorded at <span className="font-bold">{new Date(activePass.exit_marked_at).toLocaleTimeString()}</span>. Make sure to check in at the guard desk upon return to close this pass.
                        </p>
                      </div>
                    </div>}

                </div>
              </div> : <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-lg mx-auto">
                <Compass className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-base font-bold text-slate-800">No Active Gate Pass</h3>
                <p className="text-sm text-slate-500 mt-1 font-medium leading-relaxed">
                  You currently do not have any pending, approved, or active out-of-campus gate passes. Need to go outside college boundaries? Apply for a new gate pass.
                </p>
                <button
    onClick={() => setActiveTab("apply")}
    className="mt-5 inline-flex items-center px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
  >
                  Apply Gate Pass
                </button>
              </div>}
          </div>}

        {
    /* TAB 2: APPLY FORM */
  }
        {activeTab === "apply" && <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-2xl mx-auto">
            <div className="border-b border-slate-200 pb-4 mb-5">
              <h2 className="text-lg font-bold text-slate-800">Out-Of-Campus Gate Pass Application</h2>
              <p className="text-xs text-slate-500 font-medium">Your request will automatically route to your registered Class Incharge (Class Teacher) and HOD for approvals.</p>
            </div>

            <form onSubmit={handleApply} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Reason for Leaving Campus</label>
                <textarea
    required
    rows={3}
    value={reason}
    onChange={(e) => setReason(e.target.value)}
    placeholder="Provide complete details (e.g. Urgent personal work, dental checkup)..."
    className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white focus:border-slate-900 text-sm placeholder-slate-400"
  />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Leaving Date</label>
                  <input
                    required
                    type="date"
                    min={getTodayLocalDateStr()}
                    value={exitDate}
                    onChange={(e) => setExitDate(e.target.value)}
                    className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white focus:border-slate-900 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Leaving Time (9:00 AM - 6:00 PM)</label>
                  <select
                    required
                    value={exitTimeOnly}
                    onChange={(e) => setExitTimeOnly(e.target.value)}
                    className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white focus:border-slate-900 text-sm"
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

              <div className="border-t border-slate-200 pt-4 flex justify-end space-x-3">
                <button
    type="button"
    onClick={() => setActiveTab("status")}
    className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
  >
                  Cancel
                </button>
                <button
    type="submit"
    disabled={submitLoading}
    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md flex items-center space-x-2 transition cursor-pointer"
  >
                  {submitLoading ? <>
                      <RefreshCw className="animate-spin h-4 w-4" />
                      <span>Analyzing & Submitting...</span>
                    </> : <>
                      <span>Submit Application</span>
                      <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                    </>}
                </button>
              </div>
            </form>
          </div>}

        {
    /* TAB 3: PASS HISTORY */
  }
        {activeTab === "history" && <div className="space-y-6">
            {
    /* Month-wise distribution panel */
  }
            {passes.length > 0 && <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center space-x-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Month-wise Usage Statistics</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(
    passes.reduce((acc, pass) => {
      const date = new Date(pass.exit_time || pass.created_at);
      const monthName = date.toLocaleString("default", { month: "long", year: "numeric" });
      const dayStr = date.toLocaleDateString(void 0, { day: "numeric", month: "short" });
      if (!acc[monthName]) {
        acc[monthName] = { total: 0, closed: 0, pending: 0, approved: 0, dates: [] };
      }
      acc[monthName].total++;
      if (pass.status === "closed") acc[monthName].closed++;
      else if (pass.status === "pending") acc[monthName].pending++;
      else if (pass.status === "approved" || pass.status === "exited") acc[monthName].approved++;
      acc[monthName].dates.push(`${dayStr} (${pass.status.toUpperCase()})`);
      return acc;
    }, {})
  ).map(([month, stat]) => <div key={month} className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-inner flex flex-col justify-between">
                      <div>
                        <div className="font-bold text-slate-900 text-sm mb-1">{month}</div>
                        <div className="text-slate-500 text-xs font-semibold mb-3">
                          Total Passes Taken: <span className="text-slate-800 font-extrabold">{stat.total}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-3">
                          <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[9px] font-bold rounded-full">Completed: {stat.closed}</span>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded-full">Approved/Active: {stat.approved}</span>
                          {stat.pending > 0 && <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-bold rounded-full">Pending: {stat.pending}</span>}
                        </div>
                      </div>
                      <div className="border-t border-slate-200 pt-2 mt-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Pass Dates &amp; Status:</span>
                        <div className="text-[10px] text-slate-600 font-medium flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                          {stat.dates.map((d, idx) => <span key={idx} className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-700">{d}</span>)}
                        </div>
                      </div>
                    </div>)}
                </div>
              </div>}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">My GatePass History</h2>
                  <p className="text-xs text-slate-500 font-medium">Record of all past out-of-campus gate passes.</p>
                </div>
                <button
    onClick={fetchPasses}
    className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 cursor-pointer"
    title="Refresh List"
  >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              {passes.length === 0 ? <div className="text-center py-12 p-8 text-slate-400">
                  <FileText className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                  <span className="text-sm font-semibold">No gate passes recorded yet.</span>
                </div> : <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">GatePass ID</th>
                        <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reason</th>
                        <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Requested Exit Time</th>
                        <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Scan / Exit Timestamp</th>
                        <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 tracking-wider">AI Security Score</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100 text-xs">
                      {passes.map((pass) => <tr key={pass.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-800">{pass.id}</td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-800 max-w-xs truncate">{pass.reason}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                            <div>{new Date(pass.exit_time).toLocaleString()}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-[11px] text-slate-600">
                            {pass.exit_marked_at ? <span className="font-semibold text-slate-800">{new Date(pass.exit_marked_at).toLocaleString()}</span> : <span className="text-slate-400">Not Scanned</span>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(pass.status)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{getRiskBadge(pass.risk_level)}</td>
                        </tr>)}
                    </tbody>
                  </table>
                </div>}
            </div>
          </div>}

        {
    /* TAB 4: PROFILE EDIT */
  }
        {activeTab === "profile" && <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-xl mx-auto">
            <div className="border-b border-slate-200 pb-4 mb-5">
              <h2 className="text-lg font-bold text-slate-800">My Profile Configuration</h2>
              <p className="text-xs text-slate-500 font-medium">Keep your registration details accurate for security audit logs.</p>
            </div>

            {profileSuccess && <div className="mb-4 bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg text-xs font-semibold text-emerald-700">
                Profile updated successfully.
              </div>}

            <form onSubmit={handleProfileUpdate} className="space-y-5">
              <div className="flex flex-col items-center justify-center space-y-2 mb-4">
                {photo ? <img src={photo} alt={user.name} className="h-24 w-24 rounded-full border-2 border-slate-200 object-cover shadow" /> : <div className="h-24 w-24 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center">
                    <User className="h-10 w-10 text-slate-400" />
                  </div>}
                <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg transition">
                  Upload Photo File
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                  <input
    disabled
    type="text"
    value={user.name}
    className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-100 text-slate-500 text-sm cursor-not-allowed"
  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Roll Number</label>
                  <input
    disabled
    type="text"
    value={user.roll_no}
    className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-100 text-slate-500 text-sm cursor-not-allowed"
  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
                  <input
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Phone Number</label>
                  <input
    type="text"
    value={phone}
    onChange={(e) => setPhone(e.target.value)}
    className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
  />
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4 flex justify-end">
                <button
    type="submit"
    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
  >
                  Save Profile Info
                </button>
              </div>
            </form>
          </div>}

        {
    /* TAB 5: LATE COME ENTRY */
  }
        {activeTab === "late" && <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {
    /* Form to submit late come */
  }
            <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">Self Late-Arrival Logging</h2>
                <p className="text-xs text-slate-500 font-medium">As directed by your teacher, please enter your exact arrival time and genuine reason below.</p>
              </div>

              <form onSubmit={handleLateComeSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Exact Arrival Time</label>
                  <input
    type="datetime-local"
    value={lateTime}
    onChange={(e) => setLateTime(e.target.value)}
    required
    className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Reason for Coming Late</label>
                  <textarea
    rows={4}
    value={lateReason}
    onChange={(e) => setLateReason(e.target.value)}
    required
    placeholder="Provide a detailed explanation (e.g., missed college bus, heavy rain, train delay, medical emergency)"
    className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 leading-relaxed placeholder:text-slate-400"
  />
                </div>

                <button
    type="submit"
    disabled={submittingLate}
    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-2 cursor-pointer"
  >
                  {submittingLate ? <span className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" /> : <>
                      <Clock className="h-4 w-4" />
                      <span>Log Late Arrival</span>
                    </>}
                </button>
              </form>
            </div>

            {
    /* History timeline */
  }
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 font-sans">My Late Come History</h2>
                  <p className="text-xs text-slate-500 font-medium">Monthly logs submitted for review by your class teacher.</p>
                </div>
                <span className="bg-slate-100 text-slate-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase border border-slate-200">
                  Total: {lateEntries.length}
                </span>
              </div>

              {lateEntries.length === 0 ? <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400">
                  <Clock className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-bold">No late entries logged yet.</p>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-xs mx-auto">Any late-come self-reports requested by teachers will be displayed here.</p>
                </div> : <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  {lateEntries.map((entry) => <div key={entry.id} className="p-4 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/60 transition flex flex-col sm:flex-row justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 uppercase">
                            Late Arrival
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">
                            Logged on: {new Date(entry.created_at).toLocaleDateString(void 0, { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 font-medium leading-relaxed">
                          "{entry.reason}"
                        </p>
                      </div>
                      <div className="flex flex-col sm:items-end justify-center shrink-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Arrival Timestamp</span>
                        <span className="text-xs font-bold text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200 mt-0.5">
                          {new Date(entry.arrival_time).toLocaleString(void 0, { dateStyle: "medium", timeStyle: "short" })}
                        </span>
                      </div>
                    </div>)}
                </div>}
            </div>
          </div>}

      </div>

      {
    /* Custom Cancellation Confirmation Modal */
  }
      {cancelPassId && <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center space-x-3 text-red-500">
              <div className="p-2.5 bg-red-50 rounded-2xl">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Cancel Gate Pass Request</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gate pass action</p>
              </div>
            </div>
            <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
              <p>
                Are you sure you want to cancel this pending gate pass request?
              </p>
              <p className="bg-amber-50 text-amber-700 p-2.5 rounded-xl border border-amber-100 font-medium">
                This will recall your application from HOD queues. You will need to create a new application if you change your mind.
              </p>
            </div>
            <div className="flex space-x-2 pt-2">
              <button
    onClick={() => setCancelPassId(null)}
    className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
  >
                Go Back
              </button>
              <button
    onClick={executeCancelPass}
    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
  >
                Yes, Cancel Pass
              </button>
            </div>
          </div>
        </div>}

      {
    /* Custom Toast Notification System */
  }
      {toast && <div className="fixed bottom-5 right-5 z-[100] max-w-sm w-full bg-white rounded-2xl border border-slate-100 shadow-2xl p-4 flex items-center space-x-3 animate-in slide-in-from-bottom duration-300">
          <div className={`p-2 rounded-xl shrink-0 ${toast.type === "success" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
            {toast.type === "success" ? <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg> : <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>}
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-slate-900">{toast.type === "success" ? "Success" : "Error"}</p>
            <p className="text-[11px] text-slate-500 font-medium">{toast.message}</p>
          </div>
        </div>}

    </div>;
}
