/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect } from "react";
import {
  Award,
  PlusCircle,
  Clock,
  CheckCircle,
  XCircle,
  LogOut,
  RefreshCw,
  QrCode,
  Download,
  AlertCircle,
  FileText,
  Building2,
  User,
  Calendar,
  Sparkles,
  ArrowRight,
  X,
  Smartphone
} from "lucide-react";
import { gatepassService } from "../services/gatepassService.js";
import sbjainLogo from "../assets/sbjain-logo.png";

export default function FacultyDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("apply"); // "apply" | "passes"
  const [myPasses, setMyPasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const getTodayLocalDateStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const [reason, setReason] = useState("");
  const [destination, setDestination] = useState("");
  const [exitDate, setExitDate] = useState(getTodayLocalDateStr());
  const [exitTimeOnly, setExitTimeOnly] = useState("10:00");
  const [exitTime, setExitTime] = useState("");
  const [returnTime, setReturnTime] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState(null);
  const [formErr, setFormErr] = useState(null);

  // Teacher Staff Late Mark Form state
  const [lateDate, setLateDate] = useState(getTodayLocalDateStr());
  const [lateTimeOnly, setLateTimeOnly] = useState("09:30");
  const [lateReason, setLateReason] = useState("");
  const [lateRemarks, setLateRemarks] = useState("");
  const [submittingLate, setSubmittingLate] = useState(false);
  const [lateMsg, setLateMsg] = useState(null);
  const [lateErr, setLateErr] = useState(null);

  // QR Modal State
  const [selectedPass, setSelectedPass] = useState(null);

  const fetchFacultyPasses = async () => {
    setLoading(true);
    try {
      const passes = await gatepassService.getFacultyGatePasses();
      setMyPasses(passes || []);
    } catch (err) {
      console.error("Failed to load faculty passes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacultyPasses();
  }, []);

  const handleApply = async (e) => {
    e.preventDefault();
    const fullExitTime = exitDate && exitTimeOnly ? `${exitDate}T${exitTimeOnly}` : exitTime;
    if (!reason || !fullExitTime) {
      setFormErr("Reason for outing and exit date & time are required.");
      return;
    }
    setSubmitting(true);
    setFormErr(null);
    setFormMsg(null);
    try {
      await gatepassService.applyFacultyGatePass({
        reason,
        destination,
        exit_time: fullExitTime,
        return_time: returnTime,
        vehicle_no: vehicleNo,
        remarks,
      });
      setFormMsg("Faculty Gate Pass application submitted successfully! Forwarded to Principal for executive sign-off.");
      setReason("");
      setDestination("");
      setExitDate(getTodayLocalDateStr());
      setExitTimeOnly("10:00");
      setExitTime("");
      setReturnTime("");
      setVehicleNo("");
      setRemarks("");
      fetchFacultyPasses();
      setActiveTab("passes");
    } catch (err) {
      setFormErr(err.message || "Failed to submit gate pass request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyLateMark = async (e) => {
    e.preventDefault();
    const fullLateTime = `${lateDate}T${lateTimeOnly}`;
    if (!lateReason || !fullLateTime) {
      setLateErr("Arrival date, time and reason for late mark are required.");
      return;
    }
    setSubmittingLate(true);
    setLateErr(null);
    setLateMsg(null);
    try {
      await gatepassService.applyFacultyGatePass({
        reason: `[TEACHER LATE MARK] ${lateReason}`,
        destination: "Late Arrival at College",
        exit_time: fullLateTime,
        remarks: lateRemarks ? `Teacher Late Entry: ${lateRemarks}` : "Teacher Staff Late Arrival Mark",
      });
      setLateMsg("Teacher Staff Late Mark request submitted successfully!");
      setLateReason("");
      setLateRemarks("");
      setLateDate(getTodayLocalDateStr());
      setLateTimeOnly("09:30");
      fetchFacultyPasses();
      setActiveTab("passes");
    } catch (err) {
      setLateErr(err.message || "Failed to submit late mark request.");
    } finally {
      setSubmittingLate(false);
    }
  };

  // Status badge renderer
  const renderStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 w-fit">
            <CheckCircle className="h-3.5 w-3.5" /> Authorized by Principal (QR Pass Ready)
          </span>
        );
      case "pending_hod":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 w-fit">
            <Clock className="h-3.5 w-3.5 animate-pulse" /> Step 1: Pending HOD Clearance
          </span>
        );
      case "pending_principal":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 w-fit">
            <Clock className="h-3.5 w-3.5 animate-pulse" /> Step 2: Cleared by HOD • Pending Principal Sign-Off
          </span>
        );
      case "rejected":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1.5 w-fit">
            <XCircle className="h-3.5 w-3.5" /> Rejected by Principal
          </span>
        );
      case "exited":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1.5 w-fit">
            <LogOut className="h-3.5 w-3.5" /> Currently Off-Campus (Left)
          </span>
        );
      case "closed":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5 w-fit">
            <CheckCircle className="h-3.5 w-3.5" /> Returned & Pass Closed
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
            {status}
          </span>
        );
    }
  };

  const pendingCount = myPasses.filter((p) => p.status === "pending_principal").length;
  const approvedCount = myPasses.filter((p) => p.status === "approved").length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <img src={sbjainLogo} alt="SB Jain Logo" className="h-10 w-10 object-contain rounded-xl bg-white p-1 shadow-sm shrink-0 border border-slate-800" />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              S. B. Jain GatePass System
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 font-semibold">
                Teacher Staff Portal
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Welcome, <span className="text-slate-200 font-semibold">{user?.name}</span> • {user?.department || "Academic Faculty / Staff"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchFacultyPasses}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 transition-all border border-slate-800 flex items-center gap-2 text-xs font-semibold cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-amber-400" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={onLogout}
            className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Quick Info & Stats Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  Pending Authorization
                </span>
                <h3 className="text-3xl font-extrabold text-white mt-1">{pendingCount}</h3>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/20 text-amber-300">
                <Clock className="h-6 w-6" />
              </div>
            </div>
            <p className="text-xs text-amber-300/70 mt-3">Awaiting Principal approval</p>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  Approved & Active Passes
                </span>
                <h3 className="text-3xl font-extrabold text-white mt-1">{approvedCount}</h3>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300">
                <QrCode className="h-6 w-6" />
              </div>
            </div>
            <p className="text-xs text-emerald-300/70 mt-3">Ready with QR code for gate scan</p>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent border border-indigo-500/20 shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                  Total Passes Applied
                </span>
                <h3 className="text-3xl font-extrabold text-white mt-1">{myPasses.length}</h3>
              </div>
              <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-300">
                <FileText className="h-6 w-6" />
              </div>
            </div>
            <p className="text-xs text-indigo-300/70 mt-3">Historical faculty gate pass records</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 max-w-xl">
          <button
            onClick={() => setActiveTab("apply")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === "apply"
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20 font-black"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <PlusCircle className="h-4 w-4" />
            Apply Gate Pass
          </button>

          <button
            onClick={() => setActiveTab("late_mark")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === "late_mark"
                ? "bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-md shadow-indigo-500/20 font-black"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Clock className="h-4 w-4" />
            Log Late Mark
          </button>

          <button
            onClick={() => setActiveTab("passes")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === "passes"
                ? "bg-slate-800 text-white shadow-md font-black"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FileText className="h-4 w-4" />
            My Requests ({myPasses.length})
          </button>
        </div>

        {/* Tab 1: Apply Form */}
        {activeTab === "apply" && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Faculty Gate Pass Application Form</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Fill out your outing details. Once submitted, your request will be routed directly to the Principal.
                </p>
              </div>
            </div>

            {formMsg && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-3">
                <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" />
                <span>{formMsg}</span>
              </div>
            )}

            {formErr && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold flex items-center gap-3">
                <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
                <span>{formErr}</span>
              </div>
            )}

            <form onSubmit={handleApply} className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="md:col-span-2 space-y-1.5">
                <label className="block font-semibold text-slate-200">
                  Reason for Outing / Leaving Campus <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Official Meeting at University, Personal Work, Exam Center Duty"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-semibold text-slate-200">
                    Exit Date <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={getTodayLocalDateStr()}
                    value={exitDate}
                    onChange={(e) => setExitDate(e.target.value)}
                    className="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500/60 font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block font-semibold text-slate-200">
                    Exit Time <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={exitTimeOnly}
                    onChange={(e) => setExitTimeOnly(e.target.value)}
                    className="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500/60 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-200">
                  Additional Remarks (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Duty order copy attached, returning before 4 PM"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 font-medium"
                />
              </div>

              <div className="md:col-span-2 pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-2"
                >
                  {submitting ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  <span>Submit Request for Principal Authorization</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Log Late Mark Form */}
        {activeTab === "late_mark" && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Teacher Staff Late Mark Form</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Submit your late arrival record for official department attendance log &amp; HOD review.
                </p>
              </div>
            </div>

            {lateMsg && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-3">
                <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" />
                <span>{lateMsg}</span>
              </div>
            )}

            {lateErr && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold flex items-center gap-3">
                <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
                <span>{lateErr}</span>
              </div>
            )}

            <form onSubmit={handleApplyLateMark} className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="md:col-span-2 space-y-1.5">
                <label className="block font-semibold text-slate-200">
                  Reason for Late Arrival <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Heavy Traffic / Vehicle Breakdown / University Work / Emergency"
                  value={lateReason}
                  onChange={(e) => setLateReason(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:col-span-2">
                <div className="space-y-1.5">
                  <label className="block font-semibold text-slate-200">
                    Arrival Date <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={getTodayLocalDateStr()}
                    value={lateDate}
                    onChange={(e) => setLateDate(e.target.value)}
                    className="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500/60 font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block font-semibold text-slate-200">
                    Arrival Time <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={lateTimeOnly}
                    onChange={(e) => setLateTimeOnly(e.target.value)}
                    className="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500/60 font-medium"
                  />
                </div>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="block font-semibold text-slate-200">
                  Additional Remarks (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Informed HOD over phone at 9:15 AM..."
                  value={lateRemarks}
                  onChange={(e) => setLateRemarks(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 font-medium"
                />
              </div>

              <div className="md:col-span-2 pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={submittingLate}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-extrabold text-xs shadow-lg shadow-indigo-500/20 transition-all cursor-pointer flex items-center gap-2"
                >
                  {submittingLate ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Clock className="h-4 w-4" />
                  )}
                  <span>Submit Teacher Staff Late Mark Request</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: My Gate Passes */}
        {activeTab === "passes" && (
          <div className="space-y-4">
            {myPasses.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/60 rounded-3xl border border-slate-800">
                <FileText className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white">No Gate Pass Records Found</h3>
                <p className="text-xs text-slate-400 mt-1">
                  You haven't submitted any faculty gate pass applications yet.
                </p>
                <button
                  onClick={() => setActiveTab("apply")}
                  className="mt-4 px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
                >
                  <PlusCircle className="h-4 w-4" />
                  Apply Now
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myPasses.map((pass) => (
                  <div
                    key={pass.id}
                    className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all shadow-xl flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        {renderStatusBadge(pass.status)}
                        <span className="text-[11px] font-mono text-slate-400">
                          {new Date(pass.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white">{pass.reason}</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Destination: <span className="text-slate-200">{pass.destination || "N/A"}</span>
                      </p>

                      <div className="mt-4 bg-slate-950 p-4 rounded-2xl border border-slate-800/80 text-xs space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Exit Window:</span>
                          <span className="text-amber-300 font-bold font-mono">
                            {new Date(pass.exit_time).toLocaleString("en-IN", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                          </span>
                        </div>
                        {pass.return_time && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Expected Return:</span>
                            <span className="text-slate-300 font-mono">
                              {new Date(pass.return_time).toLocaleString("en-IN", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                            </span>
                          </div>
                        )}
                        {pass.vehicle_no && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Vehicle No:</span>
                            <span className="text-slate-300 font-mono">{pass.vehicle_no}</span>
                          </div>
                        )}
                        {pass.remarks && (
                          <div className="pt-2 border-t border-slate-800 text-slate-400 italic">
                            Remarks: "{pass.remarks}"
                          </div>
                        )}
                      </div>
                    </div>

                    {pass.qr_code && pass.status !== "exited" && (
                      <div className="pt-4">
                        <button
                          onClick={() => setSelectedPass(pass)}
                          className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                        >
                          <QrCode className="h-4 w-4" />
                          <span>View Digital QR Gate Pass</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* QR Code Pass Viewer Modal */}
      {selectedPass && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl text-center space-y-4 relative">
            <button
              onClick={() => setSelectedPass(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-1">
              <Award className="h-8 w-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">Faculty Digital Gate Pass</h3>
              <p className="text-xs text-amber-400 font-semibold mt-0.5">
                Principal Authorized Pass
              </p>
            </div>

            {selectedPass.qr_code && (
              <div className="p-4 bg-white rounded-2xl shadow-inner inline-block mx-auto border-4 border-slate-800">
                <img
                  src={selectedPass.qr_code}
                  alt="Faculty QR Gate Pass"
                  className="w-48 h-48 mx-auto"
                />
              </div>
            )}

            <div className="text-left bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Faculty Name:</span>
                <span className="text-white font-bold">{selectedPass.faculty_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Department:</span>
                <span className="text-slate-300">{selectedPass.faculty_department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Reason:</span>
                <span className="text-amber-300 font-semibold">{selectedPass.reason}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Exit Window:</span>
                <span className="text-slate-300 font-mono">
                  {new Date(selectedPass.exit_time).toLocaleTimeString()}
                </span>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Download className="h-4 w-4" />
              Print / Save Gate Pass
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
