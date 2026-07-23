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
  Smartphone,
  Download,
  ShieldAlert,
  Check,
  X,
  FileText,
  QrCode,
  PlusCircle,
  Award
} from "lucide-react";
import { gatepassService } from "../services/gatepassService.js";
import sbjainLogo from "../assets/sbjain-logo.png";
export default function TeacherDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("faculty");
  const [lateEntries, setLateEntries] = useState([]);
  const [gatePasses, setGatePasses] = useState([]);
  const [myStudents, setMyStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(
    (/* @__PURE__ */ new Date()).toLocaleString("default", { month: "long" })
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
    const fullLateTime = `${staffLateDate}T${staffLateTimeOnly}`;
    if (!staffLateReason || !fullLateTime) {
      setStaffLateErr("Arrival date, time and reason for late mark are required.");
      return;
    }
    setSubmittingStaffLate(true);
    setStaffLateErr(null);
    setStaffLateMsg(null);
    try {
      await gatepassService.applyFacultyGatePass({
        reason: `[TEACHER LATE MARK] ${staffLateReason}`,
        destination: "Late Arrival at College",
        exit_time: fullLateTime,
        remarks: staffLateRemarks ? `Teacher Late Entry: ${staffLateRemarks}` : "Teacher Staff Late Arrival Mark",
      });
      setStaffLateMsg("Teacher Staff Late Mark request submitted successfully!");
      setStaffLateReason("");
      setStaffLateRemarks("");
      setStaffLateDate(getTodayLocalDateStr());
      setStaffLateTimeOnly("09:30");
      fetchData();
    } catch (err) {
      setStaffLateErr(err.message || "Failed to submit late mark request.");
    } finally {
      setSubmittingStaffLate(false);
    }
  };
  useEffect(() => {
    fetchData();
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
          sentAt: (/* @__PURE__ */ new Date()).toLocaleTimeString(),
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
      alert("GatePass approved successfully and forwarded to HOD!");
    } catch (err) {
      alert(err.message || "Failed to approve gatepass.");
    } finally {
      setProcessingPassId(null);
    }
  };
  const handleRejectPass = async (passId) => {
    const remarks = teacherRemarks[passId];
    if (!remarks || remarks.trim() === "") {
      alert("Kripya rejection ki wajah (Remarks) likhein taaki student ko reject hone ka reason pata chale!");
      return;
    }
    setProcessingPassId(passId);
    try {
      await gatepassService.rejectGatePassTeacher(passId, remarks);
      setGatePasses((prev) => prev.map((p) => p.id === passId ? { ...p, status: "rejected", remarks } : p));
      alert("GatePass rejected.");
    } catch (err) {
      alert(err.message || "Failed to reject gatepass.");
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
  const todayStr = (/* @__PURE__ */ new Date()).toDateString();
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
  const isClassIncharge = user?.user_type === "class_teacher" || (user?.class_name && user?.class_name !== "Faculty Member");
  return <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
    {
      /* Upper Navigation Bar */
    }
    <nav className="bg-slate-900 text-white shadow-lg border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-3">
            <img src={sbjainLogo} alt="SB Jain Logo" className="h-10 w-10 object-contain rounded-xl bg-white p-1 shadow-sm shrink-0" />
            <div>
              <span className="font-extrabold text-sm sm:text-base tracking-tight block">S. B. Jain GatePass System</span>
              <span className={`text-[10px] uppercase font-black tracking-widest block -mt-1 ${isClassIncharge ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isClassIncharge ? "Class Incharge Portal" : "Teacher Staff Portal"}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-bold text-white">{user.name}</span>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase">
                {user.user_type === 'faculty' || user.class_name === 'Faculty Member' || !user.class_name
                  ? `Faculty • ${user.department || "Academic Faculty"}`
                  : `Class Incharge: ${user.class_name} (${user.department || "N/A"})`}
              </span>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-rose-300 transition-all border border-slate-700 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>

    {
      /* Main Container */
    }
    <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

      {
        /* Welcome Block */
      }
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            Welcome Back, {user.name}!
          </h1>
          <p className="text-xs text-slate-500 font-bold mt-1 max-w-2xl">
            {isClassIncharge
              ? "Class Incharge Portal: Review and approve student outing gate pass applications, monitor first-lecture student late entries, and view your class roll."
              : "Teacher Staff Portal: Apply for outing gate passes, submit staff late arrival marks, track Principal/HOD approvals, and view digital QR passes."}
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center space-x-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-200 transition cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Reload Dashboard</span>
        </button>
      </div>

      {
        /* Dynamic Navigation Tabs - Only shown if user is a Class Incharge */
      }
      {isClassIncharge && (
        <div className="flex flex-wrap border border-slate-200 bg-white p-1 rounded-xl shadow-sm gap-1 max-w-2xl">
          <button
            onClick={() => setActiveTab("faculty")}
            className={`px-4 py-2 text-xs font-black rounded-lg transition-all cursor-pointer text-center ${activeTab === "faculty" ? "bg-amber-600 text-white shadow-sm" : "text-amber-800 bg-amber-50 hover:bg-amber-100"}`}
          >
            Teacher Staff GatePass &amp; Late Mark ({myFacultyPasses.length})
          </button>
          <button
            onClick={() => setActiveTab("gatepasses")}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${activeTab === "gatepasses" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"}`}
          >
            Student GatePass Approvals ({gatePasses.filter((p) => p.status === "pending").length})
          </button>
          <button
            onClick={() => setActiveTab("late")}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${activeTab === "late" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"}`}
          >
            Student Late Logs ({filteredEntries.length})
          </button>
        </div>
      )}

      {
        /* Dynamic KPIs / Analytics Grid */
      }
      {activeTab === "late" && <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Today's Late Comers</span>
            <h2 className="text-2xl font-black text-slate-900 mt-1">{todayLateCount}</h2>
            <p className="text-[10px] text-slate-500 mt-1 font-bold">First lecture late entries today</p>
          </div>
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Monthly Late Trend</span>
            <h2 className="text-2xl font-black text-slate-900 mt-1">{monthLateCount}</h2>
            <p className="text-[10px] text-emerald-600 mt-1 font-black uppercase tracking-wide">Month: {selectedMonth}</p>
          </div>
          <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
            <Calendar className="h-6 w-6" />
          </div>
        </div>
      </div>}

      {activeTab === "gatepasses" && <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-fade-in">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Pending My Clearance</span>
            <h2 className="text-2xl font-black text-amber-600 mt-1">{activeGatePassKPI}</h2>
            <p className="text-[10px] text-slate-500 mt-1 font-bold">Applications awaiting your approval</p>
          </div>
          <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
            <FileText className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Forwarded to HOD</span>
            <h2 className="text-2xl font-black text-blue-600 mt-1">{forwardedGatePassKPI}</h2>
            <p className="text-[10px] text-slate-500 mt-1 font-bold">Approved by you, pending HOD decision</p>
          </div>
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
            <Users className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Total Outing Applications</span>
            <h2 className="text-2xl font-black text-slate-900 mt-1">{gatePasses.length}</h2>
            <p className="text-[10px] text-slate-500 mt-1 font-bold">Total registered student applications</p>
          </div>
          <div className="p-3.5 bg-slate-50 text-slate-600 rounded-2xl border border-slate-100">
            <CheckCircle className="h-6 w-6" />
          </div>
        </div>
      </div>}

      {
        /* Tab content rendering */
      }

      {
        /* TAB 1: LATE COMERS */
      }
      {activeTab === "late" && <div className="space-y-6">

        {
          /* Filters and Logs Section */
        }
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col">
              <h3 className="text-sm font-black text-slate-800">Late Attendance Monitoring Center</h3>
              <p className="text-xs text-slate-400 mt-0.5">Filter late come list by month and search by name/roll number.</p>
            </div>

            {
              /* Controls */
            }
            <div className="flex flex-wrap items-center gap-3">
              {
                /* Search */
              }
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search name, roll..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-1.5 w-48 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                />
              </div>

              {
                /* Month selector */
              }
              <div className="flex items-center space-x-1.5">
                <Filter className="h-3.5 w-3.5 text-slate-400" />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="border border-slate-200 rounded-xl py-1.5 px-3 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  {months.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              {
                /* Export to CSV */
              }
              <button
                onClick={handleExportCSV}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-emerald-400" />
                <span>Export Monthly Logs</span>
              </button>
            </div>
          </div>

          {
            /* Table Container */
          }
          {loading ? <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
            <p className="text-xs font-bold text-slate-500">Querying late student records...</p>
          </div> : filteredEntries.length === 0 ? <div className="py-16 text-center">
            <AlertCircle className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="mt-3 text-xs text-slate-500 font-bold">No late come entries found matching current parameters.</p>
            <p className="text-[10px] text-slate-400 mt-1">Change month or enter a different search criteria.</p>
          </div> : <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-3.5 text-left">Student Info</th>
                  <th scope="col" className="px-6 py-3.5 text-left">Academic Dept</th>
                  <th scope="col" className="px-6 py-3.5 text-left">Log Date</th>
                  <th scope="col" className="px-6 py-3.5 text-left">Arrival Time</th>
                  <th scope="col" className="px-6 py-3.5 text-left">Reason</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100 text-xs text-slate-700">
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
                  return <tr key={entry.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{entry.student_name}</span>
                        <span className="text-[10px] font-mono text-slate-400 uppercase mt-0.5">{entry.student_roll_no}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-600">
                      {entry.student_department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-500">
                      {formattedDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center space-x-1 text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">
                        <Clock className="h-3 w-3 shrink-0" />
                        <span>{formattedTime}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-600 max-w-xs truncate" title={entry.reason}>
                      {entry.reason}
                    </td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>}
        </div>
      </div>}

      {
        /* TAB 2: GATEPASS APPROVALS */
      }
      {activeTab === "gatepasses" && <div className="space-y-6 animate-fade-in">
        {
          /* Directives banner */
        }
        <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-xl shadow-sm flex items-start space-x-3">
          <FileText className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wider">Tiered Outing Protocol</h4>
            <p className="text-xs text-indigo-800 font-medium leading-relaxed">
              As the <strong>Class Incharge</strong>, you are the first line of review. Your approval forwards the application to the student's selected <strong>HOD</strong> for final clearance.
            </p>
          </div>
        </div>

        {
          /* Awaiting Approvals Grid */
        }
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800">Pending My Clearance ({pendingPasses.length})</h3>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search outing applications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 w-60 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
              />
            </div>
          </div>

          {pendingPasses.length === 0 ? <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-700">All cleared! No pending gate pass requests under your class.</p>
            <p className="text-[10px] text-slate-400 mt-1">Students can apply inside their portals choosing you as Class Incharge.</p>
          </div> : <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pendingPasses.map((pass) => <div key={pass.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
              {
                /* Top info header */
              }
              <div className="p-5 border-b border-slate-100 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Application {pass.id}</h4>
                    <h3 className="text-base font-black text-slate-900 mt-0.5">{pass.student_name}</h3>
                    <span className="text-[10px] font-mono text-slate-500 uppercase mt-0.5 block">
                      Roll: {pass.student_roll_no} | {pass.student_department}
                    </span>
                  </div>

                  {
                    /* AI Risk badge */
                  }
                  {pass.risk_level && <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[9px] font-black tracking-widest uppercase border ${pass.risk_level === "high" ? "bg-red-50 text-red-700 border-red-200" : pass.risk_level === "medium" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
                    Risk: {pass.risk_level}
                  </span>}
                </div>

                {
                  /* AI Risk remarks if high/medium */
                }
                {pass.risk_remarks && <p className="text-[10px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-medium leading-relaxed italic">
                  "Frequency: {pass.risk_remarks}"
                </p>}

                {
                  /* Reason / Destination */
                }
                <div className="space-y-1.5 text-xs text-slate-700 pt-1">
                  <div>
                    <span className="font-bold text-slate-400 uppercase text-[9px] block">Reason for Outing</span>
                    <span className="font-medium text-slate-800">{pass.reason}</span>
                  </div>
                  <div className="pt-1">
                    <span className="font-bold text-slate-400 uppercase text-[9px] block">Exit expected</span>
                    <span className="font-mono text-slate-800 font-bold">{new Date(pass.exit_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ({new Date(pass.exit_time).toLocaleDateString([], { month: "short", day: "numeric" })})</span>
                  </div>
                  <div className="pt-1.5">
                    <span className="font-bold text-slate-400 uppercase text-[9px] block">Target HOD</span>
                    <span className="font-bold text-slate-800">{pass.selected_hod_name || "N/A"}</span>
                  </div>
                </div>
              </div>

              {
                /* Bottom action controls */
              }
              <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3">
                <div className="flex flex-col">
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-1">Clearance Remarks (Required for rejection)</label>
                  <textarea
                    rows={2}
                    placeholder="Add recommendations, notes or reason for rejection here..."
                    value={teacherRemarks[pass.id] || ""}
                    onChange={(e) => setTeacherRemarks((prev) => ({ ...prev, [pass.id]: e.target.value }))}
                    className="w-full border border-slate-200 bg-white rounded-xl p-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 font-semibold"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <button
                    onClick={() => handleRejectPass(pass.id)}
                    disabled={processingPassId !== null}
                    className="flex-1 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-center space-x-1"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Reject Outing</span>
                  </button>

                  <button
                    onClick={() => handleApprovePass(pass.id)}
                    disabled={processingPassId !== null}
                    className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold shadow-sm transition cursor-pointer flex items-center justify-center space-x-1"
                  >
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Approve & Forward</span>
                  </button>
                </div>
              </div>
            </div>)}
          </div>}
        </div>

        {
          /* Clearances History */
        }
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-800">Clearances History / Archive</h3>

          {historicalPasses.length === 0 ? <p className="text-xs font-semibold text-slate-400 py-4 text-center">No historical gatepass application clearances found.</p> : <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-xs">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-6 py-3 text-left">Student Info</th>
                    <th className="px-6 py-3 text-left">Reason</th>
                    <th className="px-6 py-3 text-left">Expected Outing</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">My Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-600 bg-white">
                  {historicalPasses.map((pass) => <tr key={pass.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{pass.student_name}</span>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">{pass.student_roll_no}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{pass.reason}</td>
                    <td className="px-6 py-4 font-mono text-slate-500">
                      {new Date(pass.exit_time).toLocaleDateString([], { month: "short", day: "numeric" })} at {new Date(pass.exit_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase border ${pass.status === "approved" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : pass.status === "pending_hod" ? "bg-blue-50 text-blue-700 border-blue-100" : pass.status === "rejected" ? "bg-rose-50 text-rose-700 border-rose-100" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
                        {pass.status === "pending_hod" ? "Forwarded to HOD" : pass.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 italic text-slate-500">"{pass.remarks || "None"}"</td>
                  </tr>)}
                </tbody>
              </table>
            </div>
          </div>}
        </div>
      </div>}

      {
        /* TAB 3: REGISTERED STUDENTS */
      }
      {activeTab === "students" && <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 animate-fade-in">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-black text-slate-800 font-sans">My Class Roll Registry</h3>
            <p className="text-[10px] text-slate-400">Official registered student profiles mapped under you as Class Incharge.</p>
          </div>
          <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full text-xs font-black">
            {myStudents.length} Students
          </span>
        </div>

        {myStudents.length === 0 ? <p className="text-xs font-semibold text-slate-400 py-12 text-center">No student registration profiles found for your class yet.</p> : <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-xs">
            <thead className="bg-slate-50 text-[10px] text-slate-400 font-bold text-left uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Roll No</th>
                <th className="px-6 py-3.5">Student Name</th>
                <th className="px-6 py-3.5">Institutional Email</th>
                <th className="px-6 py-3.5">Student Mobile</th>
                <th className="px-6 py-3.5">Verified Parent Mobile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-600 bg-white">
              {myStudents.map((student) => <tr key={student.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-4 font-mono font-bold text-slate-900">{student.roll_no}</td>
                <td className="px-6 py-4 text-slate-800">{student.name}</td>
                <td className="px-6 py-4 text-slate-500 font-medium">{student.email}</td>
                <td className="px-6 py-4 font-mono text-slate-500">{student.phone}</td>
                <td className="px-6 py-4 font-mono text-emerald-600 font-bold">{student.parent_phone}</td>
              </tr>)}
            </tbody>
          </table>
        </div>}
      </div>}

      {
        /* TAB 4: FACULTY GATE PASS */
      }
      {activeTab === "faculty" && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Apply for Faculty Gate Pass</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Submit your outing / exit request for Principal authorization & QR code generation.
                </p>
              </div>
            </div>

            {applyMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{applyMsg}</span>
              </div>
            )}

            {applyErr && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{applyErr}</span>
              </div>
            )}

            <form onSubmit={handleApplyFacultyPass} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Reason for Outing / Gate Pass *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Official Meeting, Personal Work, Exam Duty"
                  value={applyReason}
                  onChange={(e) => setApplyReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Exit Date *</label>
                  <input
                    type="date"
                    required
                    min={getTodayLocalDateStr()}
                    value={applyExitDate}
                    onChange={(e) => setApplyExitDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Exit Time *</label>
                  <input
                    type="time"
                    required
                    value={applyExitTimeOnly}
                    onChange={(e) => setApplyExitTimeOnly(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Additional Remarks (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Approved leave note attached..."
                  value={applyRemarks}
                  onChange={(e) => setApplyRemarks(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>

              <div className="md:col-span-2 pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={applying}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  {applying ? <RefreshCw className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                  <span>Submit Request for Clearance &amp; Approval</span>
                </button>
              </div>
            </form>
          </div>

          {/* Teacher Staff Late Mark Form Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-700">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Log Teacher Staff Late Mark</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Submit your late arrival record for department attendance log &amp; HOD review.
                </p>
              </div>
            </div>

            {staffLateMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{staffLateMsg}</span>
              </div>
            )}

            {staffLateErr && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{staffLateErr}</span>
              </div>
            )}

            <form onSubmit={handleApplyStaffLateMark} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Reason for Late Arrival *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Heavy Traffic / Vehicle Breakdown / University Work / Emergency"
                  value={staffLateReason}
                  onChange={(e) => setStaffLateReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Arrival Date *</label>
                  <input
                    type="date"
                    required
                    min={getTodayLocalDateStr()}
                    value={staffLateDate}
                    onChange={(e) => setStaffLateDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Arrival Time *</label>
                  <input
                    type="time"
                    required
                    value={staffLateTimeOnly}
                    onChange={(e) => setStaffLateTimeOnly(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Additional Remarks (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Informed HOD over phone..."
                  value={staffLateRemarks}
                  onChange={(e) => setStaffLateRemarks(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="md:col-span-2 pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={submittingStaffLate}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  {submittingStaffLate ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
                  <span>Submit Teacher Staff Late Mark</span>
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-800">My Faculty GatePass History</h3>
              <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">
                {myFacultyPasses.length} Total Passes
              </span>
            </div>

            {myFacultyPasses.length === 0 ? (
              <p className="text-xs font-semibold text-slate-400 py-10 text-center">
                You haven't submitted any faculty gate pass requests yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myFacultyPasses.map((pass) => (
                  <div
                    key={pass.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${pass.status === "approved"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : pass.status === "pending_principal"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : pass.status === "rejected"
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : pass.status === "exited"
                                    ? "bg-sky-50 text-sky-700 border-sky-200"
                                    : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                        >
                          {pass.status === "pending_principal"
                            ? "Pending Principal Approval"
                            : pass.status}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {new Date(pass.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900">{pass.reason}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Destination: {pass.destination || "N/A"}
                      </p>

                      <div className="mt-3 text-[11px] space-y-1 text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 font-medium">
                        <div>
                          <span className="text-slate-400">Exit Window: </span>
                          <span className="font-mono text-slate-800 font-bold">
                            {new Date(pass.exit_time).toLocaleString("en-IN", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                          </span>
                        </div>
                        {pass.return_time && (
                          <div>
                            <span className="text-slate-400">Expected Return: </span>
                            <span className="font-mono text-slate-800">
                              {new Date(pass.return_time).toLocaleString("en-IN", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                            </span>
                          </div>
                        )}
                        {pass.remarks && (
                          <div className="text-slate-500 italic pt-1 border-t border-slate-100">
                            Remarks: "{pass.remarks}"
                          </div>
                        )}
                      </div>
                    </div>

                    {pass.qr_code && pass.status !== "exited" && (
                      <div className="pt-3">
                        <button
                          onClick={() => setQrModalPass(pass)}
                          className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        >
                          <QrCode className="h-4 w-4" />
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
              <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl text-center space-y-4 relative border border-slate-200">
                <button
                  onClick={() => setQrModalPass(null)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="inline-flex p-3 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200">
                  <Award className="h-7 w-7" />
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900">Faculty Digital Gate Pass</h3>
                  <p className="text-xs text-amber-700 font-bold mt-0.5">
                    Approved by Principal
                  </p>
                </div>

                {qrModalPass.qr_code && (
                  <div className="p-3 bg-white rounded-2xl border-4 border-slate-900 inline-block mx-auto shadow-inner">
                    <img src={qrModalPass.qr_code} alt="QR Pass" className="w-44 h-44 mx-auto" />
                  </div>
                )}

                <div className="text-left bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Faculty Name:</span>
                    <span className="text-slate-900 font-bold">{qrModalPass.faculty_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Department:</span>
                    <span className="text-slate-700 font-medium">{qrModalPass.faculty_department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Reason:</span>
                    <span className="text-amber-800 font-bold">{qrModalPass.reason}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Exit Window:</span>
                    <span className="text-slate-800 font-mono">
                      {new Date(qrModalPass.exit_time).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => window.print()}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <Download className="h-4 w-4" />
                  <span>Print / Save Pass</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </main>
  </div>;
}
