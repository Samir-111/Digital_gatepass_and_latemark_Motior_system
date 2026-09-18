/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect, useRef } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Shield,
  User,
  UserCheck,
  QrCode,
  RefreshCw,
  ArrowRight,
  CheckCircle,
  LogOut,
  Camera,
  Clipboard,
  AlertTriangle,
  AlertCircle,
  XCircle,
  Sun,
  Moon,
  Search
} from "lucide-react";
import { gatepassService } from "../services/gatepassService.js";
import { Html5Qrcode } from "html5-qrcode";
import sbjainLogo from "../assets/sbjain-logo.png";

export default function GuardDashboard({ user, onLogout, isDarkMode, onToggleTheme }) {
  const [todayEntries, setTodayEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [manualToken, setManualToken] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifiedPass, setVerifiedPass] = useState(null);
  const [verificationError, setVerificationError] = useState(null);
  const [verificationSuccess, setVerificationSuccess] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [expiredWarning, setExpiredWarning] = useState(false);
  const [testPasses, setTestPasses] = useState([]);
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [scannerError, setScannerError] = useState(null);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const scannerRef = useRef(null);
  const [imageUploadError, setImageUploadError] = useState(null);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploadLoading(true);
    setImageUploadError(null);
    setVerificationError(null);
    setVerificationSuccess(null);
    try {
      const tempId = "qr-file-reader";
      let tempElement = document.getElementById(tempId);
      if (!tempElement) {
        tempElement = document.createElement("div");
        tempElement.id = tempId;
        tempElement.style.display = "none";
        document.body.appendChild(tempElement);
      }
      const fileScanner = new Html5Qrcode(tempId);
      const decodedText = await fileScanner.scanFile(file, false);
      setManualToken(decodedText);
      setImageUploadLoading(false);
      await handleVerify(decodedText);
    } catch (err) {
      console.error("QR Code image file scan error:", err);
      setImageUploadError("Could not find a valid QR Code in this image. Please ensure the QR code is clear, high-contrast, and fully visible.");
      setImageUploadLoading(false);
    }
  };

  const fetchGuardData = async () => {
    setLoading(true);
    try {
      const entries = await gatepassService.getGuardEntries();
      setTodayEntries(entries);
      const list = await gatepassService.getStudentHistory().catch(() => []);
      setTestPasses(list);
    } catch (err) {
      console.error("Error loading guard data", err);
    } finally {
      setLoading(false);
    }
  };

  const startScanning = async (cameraId) => {
    setScannerError(null);
    const elementId = "qr-reader-element";
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (e) {
        console.error("Error stopping scanner:", e);
      }
    }
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        setTimeout(() => startScanning(cameraId), 300);
        return;
      }
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach((track) => track.stop());
        } catch (permissionErr) {
          console.warn("Camera permission prompt rejected or not supported:", permissionErr);
        }
      }
      const devices = await Html5Qrcode.getCameras().catch(() => []);
      setAvailableCameras(devices);
      const scanner = new Html5Qrcode(elementId);
      scannerRef.current = scanner;
      const config = {
        fps: 10,
        qrbox: { width: 220, height: 220 }
      };
      let targetCameraId = cameraId;
      if (!targetCameraId) {
        targetCameraId = devices.length > 0 ? devices.find((d) => d.label.toLowerCase().includes("back") || d.label.toLowerCase().includes("environment"))?.id || devices[0].id : { facingMode: "environment" };
      }
      if (devices.length > 0 && !cameraId) {
        setSelectedCameraId(typeof targetCameraId === "string" ? targetCameraId : devices[0].id);
      }
      try {
        await scanner.start(
          targetCameraId,
          config,
          (decodedText) => {
            setManualToken(decodedText);
            handleVerify(decodedText);
          },
          () => {}
        );
      } catch (firstErr) {
        if (!cameraId && (typeof targetCameraId === "object" || devices.length > 0)) {
          console.warn("Attempting fallback to user facing camera...", firstErr);
          await scanner.start(
            { facingMode: "user" },
            config,
            (decodedText) => {
              setManualToken(decodedText);
              handleVerify(decodedText);
            },
            () => {}
          );
        } else {
          throw firstErr;
        }
      }
      setScannerActive(true);
      setCameraPermissionGranted(true);
      setScannerError(null);
    } catch (err) {
      console.error("QR scanner start error:", err);
      setScannerActive(false);
      setScannerError("Camera access is blocked or unavailable. Ensure you have granted camera permissions in your browser or try opening the app in a new tab if you are inside an iframe preview.");
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        setScannerActive(false);
      } catch (e) {
        console.error("Error stopping scanner:", e);
      }
    }
  };

  useEffect(() => {
    fetchGuardData();
    const interval = setInterval(fetchGuardData, 10000);
    startScanning();
    return () => {
      clearInterval(interval);
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch((err) => console.error("Scanner cleanup error:", err));
      }
    };
  }, []);

  const handleVerify = async (tokenValue) => {
    if (!tokenValue) return;
    setVerifyLoading(true);
    setVerificationError(null);
    setVerificationSuccess(null);
    setVerifiedPass(null);
    setDuplicateWarning(false);
    setExpiredWarning(false);
    try {
      const data = await gatepassService.verifyGatePass({ token: tokenValue });
      setVerifiedPass(data.pass);
      setVerificationSuccess(data.message);
      if (data.expired) {
        setExpiredWarning(true);
      }
    } catch (err) {
      console.error("Verification error:", err);
      setVerificationError(err.message || "Verification failed.");
      if (err.message && (err.message.includes("Single-Use") || err.message.includes("already completed"))) {
        setDuplicateWarning(true);
      }
      if (err.message && err.message.includes("Expired")) {
        setExpiredWarning(true);
      }
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleMarkExit = async (passId) => {
    try {
      const data = await gatepassService.markStudentExit(passId);
      alert(data.message);
      setVerifiedPass(null);
      setVerificationSuccess(null);
      fetchGuardData();
    } catch (err) {
      alert(err.message || "Failed to log exit.");
    }
  };

  const handleMarkReturn = async (passId) => {
    try {
      const data = await gatepassService.markStudentReturn(passId);
      alert(data.message);
      setVerifiedPass(null);
      setVerificationSuccess(null);
      fetchGuardData();
    } catch (err) {
      alert(err.message || "Failed to log return.");
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60",
      approved: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60",
      rejected: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60",
      exited: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60",
      closed: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
      cancelled: "bg-slate-50 dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800"
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${styles[status] || styles.pending}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#f0f5fa] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-12 transition-colors">
      {/* Institutional Header */}
      <header className="bg-[#0a1e33] border-b border-[#081726] sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
              <div className="bg-white p-1 rounded-xl shrink-0 shadow-sm border border-white/20">
                <img src={sbjainLogo} alt="SB Jain Logo" className="h-8 w-8 object-contain" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-white tracking-tight text-xs sm:text-sm leading-tight truncate">
                  S. B. Jain Institute of Technology
                </span>
                <span className="text-[10px] text-slate-300 font-medium tracking-wide truncate">
                  Nagpur • Security Console
                </span>
              </div>
              <span className="hidden lg:inline-flex items-center bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border border-amber-400/30 shrink-0 ml-2">
                GUARD
              </span>
            </div>

            <div className="flex items-center space-x-3">
              {/* User preview */}
              <div className="hidden sm:flex items-center space-x-2.5 pl-2 pr-1">
                <div className="h-8 w-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-amber-300">
                  <UserCheck className="h-4 w-4" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-white leading-tight flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{user?.name || "Security Officer"}</span>
                  </span>
                  <span className="text-[10px] text-amber-300 font-semibold uppercase">
                    Security Checkpoint
                  </span>
                </div>
              </div>

              <div className="h-6 w-px bg-white/15 hidden sm:block" />

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

              <button
                onClick={onLogout}
                className="inline-flex items-center px-3 py-1.5 border border-white/20 text-xs font-semibold rounded-lg text-white bg-white/10 hover:bg-white/20 transition cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5 mr-1" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 mt-4 sm:mt-8 space-y-4 sm:space-y-6">
        {/* Guard Welcome & Profile Banner */}
        <div className="bg-white dark:bg-[#0b132b] border border-slate-200/80 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 transition-all animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 shadow-xs">
              <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Welcome back, {user?.name || "Security Officer"}!
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold border uppercase tracking-wider bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                  <Shield className="h-3 w-3" />
                  <span>Main Gate Security</span>
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Campus Perimeter &amp; Single-Use QR Pass Verification Console
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800 shrink-0">
            <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
              Checkpoint Status:
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Active on Duty</span>
            </span>
          </div>
        </div>

        {/* Main interactive grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8">
          {/* Scanner Console Panel */}
          <div className="lg:col-span-5 space-y-4 sm:space-y-6">
            {/* Real-time Live QR Code Scanner */}
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-1.5">
                  <Camera className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-slate-700 dark:text-slate-300 animate-pulse" />
                  <span>Real-time Live QR Scanner</span>
                </h2>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${scannerActive ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 animate-pulse" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"}`}>
                    {scannerActive ? "● Camera Active" : "Offline"}
                  </span>
                </div>
              </div>

              {/* Scanner Screen Frame */}
              <div className="bg-slate-900 rounded-2xl aspect-square flex flex-col items-center justify-center relative overflow-hidden mb-4 border-4 border-slate-800">
                <div id="qr-reader-element" className="w-full h-full" />

                {scannerActive && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                    <div className="border-2 border-dashed border-emerald-500/80 w-52 h-52 rounded-2xl relative">
                      <div className="absolute -top-1.5 -left-1.5 h-5 w-5 border-t-4 border-l-4 border-emerald-500 rounded-tl-lg" />
                      <div className="absolute -top-1.5 -right-1.5 h-5 w-5 border-t-4 border-r-4 border-emerald-500 rounded-tr-lg" />
                      <div className="absolute -bottom-1.5 -left-1.5 h-5 w-5 border-b-4 border-l-4 border-emerald-500 rounded-bl-lg" />
                      <div className="absolute -bottom-1.5 -right-1.5 h-5 w-5 border-b-4 border-r-4 border-emerald-500 rounded-br-lg" />
                      <div className="w-full bg-emerald-500/20 h-1 absolute top-0 animate-[bounce_3s_infinite] border-b-2 border-emerald-400 shadow shadow-emerald-500" />
                    </div>
                  </div>
                )}

                {!scannerActive && (
                  <div className="absolute inset-0 bg-slate-900/95 p-6 text-center z-20 flex flex-col items-center justify-center">
                    {scannerError ? (
                      <div className="space-y-3">
                        <AlertCircle className="h-12 w-12 text-rose-500 mx-auto" />
                        <h4 className="text-xs font-bold text-slate-200">Camera Access Issue</h4>
                        <p className="text-[10px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                          {scannerError}
                        </p>
                        <button
                          type="button"
                          onClick={() => startScanning(selectedCameraId)}
                          className="mt-2 inline-flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition cursor-pointer"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Retry Camera Access
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <QrCode className="h-12 w-12 text-slate-600 mx-auto animate-pulse" />
                        <p className="text-xs font-bold text-slate-400">Scanner has been stopped</p>
                        <button
                          type="button"
                          onClick={() => startScanning(selectedCameraId)}
                          className="mt-2 inline-flex items-center px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[11px] font-bold transition cursor-pointer border border-slate-700"
                        >
                          <Camera className="h-3.5 w-3.5 mr-1 text-emerald-400" />
                          Start Live Camera
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Camera selection dropdown */}
              {availableCameras.length > 1 && (
                <div className="mb-4">
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                    Select Camera Input Device
                  </label>
                  <select
                    value={selectedCameraId}
                    onChange={(e) => {
                      setSelectedCameraId(e.target.value);
                      startScanning(e.target.value);
                    }}
                    className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-blue-500 font-semibold"
                  >
                    {availableCameras.map((cam) => (
                      <option key={cam.id} value={cam.id}>
                        {cam.label || `Camera ${cam.id.substring(0, 5)}...`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Start / Stop Toggle Button */}
              <div className="flex gap-2 mb-4">
                {scannerActive ? (
                  <button
                    onClick={stopScanning}
                    className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-1"
                  >
                    <XCircle className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    <span>Pause Camera Stream</span>
                  </button>
                ) : (
                  !scannerError && (
                    <button
                      onClick={() => startScanning(selectedCameraId)}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition cursor-pointer flex items-center justify-center space-x-1"
                    >
                      <Camera className="h-4 w-4" />
                      <span>Activate Live Camera Scanner</span>
                    </button>
                  )
                )}
              </div>

              {/* Image Upload/File Scan Support */}
              <div className="border-t border-b border-slate-100 dark:border-slate-800 py-4 my-4">
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  Or Scan QR Image File (Upload Screenshot)
                </label>
                <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-xl p-4 transition bg-slate-50/50 dark:bg-slate-800/40 hover:bg-emerald-50/10 text-center cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={imageUploadLoading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center space-y-2">
                    {imageUploadLoading ? (
                      <>
                        <RefreshCw className="h-6 w-6 text-emerald-500 animate-spin" />
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Decoding QR Code image...</span>
                      </>
                    ) : (
                      <>
                        <Clipboard className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-200">Click to upload or drag QR image</div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">Supports JPEG, PNG screenshots of Gate Pass</p>
                      </>
                    )}
                  </div>
                </div>
                {imageUploadError && (
                  <p className="mt-2 text-[11px] font-medium text-rose-500 flex items-start space-x-1">
                    <AlertCircle className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <span>{imageUploadError}</span>
                  </p>
                )}
              </div>

              {/* Input for manual token or testing selector */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                    Enter QR Security Token manually
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="gp_tok_..."
                      value={manualToken}
                      onChange={(e) => setManualToken(e.target.value)}
                      className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-blue-500"
                    />
                    <button
                      onClick={() => handleVerify(manualToken)}
                      disabled={verifyLoading}
                      className="px-4 py-2 bg-[#0a1e33] hover:bg-[#112d4e] dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow transition cursor-pointer shrink-0"
                    >
                      Verify Token
                    </button>
                  </div>
                </div>

                {/* Simulated Student List */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                    Simulate student scan (Click to scan)
                  </label>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    <button
                      onClick={() => handleVerify("gp_tok_active_approved_demo_67890")}
                      className="w-full text-left p-2 border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-700 hover:bg-blue-50/30 dark:hover:bg-blue-950/30 rounded-lg text-xs flex justify-between items-center transition cursor-pointer font-semibold text-slate-700 dark:text-slate-200"
                    >
                      <div className="truncate">Samir Khorgade (Approved Pass)</div>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-800/60">Scan QR</span>
                    </button>
                    <button
                      onClick={() => handleVerify("gp_tok_past_closed_demo_12345")}
                      className="w-full text-left p-2 border border-slate-100 dark:border-slate-800 hover:border-red-200 dark:hover:border-red-700 hover:bg-red-50/30 dark:hover:bg-red-950/30 rounded-lg text-xs flex justify-between items-center transition cursor-pointer font-semibold text-slate-700 dark:text-slate-200"
                    >
                      <div className="truncate">Samir Khorgade (Duplicate QR Reuse)</div>
                      <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded border border-red-100 dark:border-red-800/60">Scan QR</span>
                    </button>
                    <button
                      onClick={() => handleVerify("gp_tok_pending_demo_abcde")}
                      className="w-full text-left p-2 border border-slate-100 dark:border-slate-800 hover:border-amber-200 dark:hover:border-amber-700 hover:bg-amber-50/30 dark:hover:bg-amber-950/30 rounded-lg text-xs flex justify-between items-center transition cursor-pointer font-semibold text-slate-700 dark:text-slate-200"
                    >
                      <div className="truncate">Jane Doe (Unapproved Pass)</div>
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-100 dark:border-amber-800/60">Scan QR</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Results Panel */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-6">
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-center min-h-[200px] sm:min-h-[460px]">
              {!verifiedPass && !verificationError && !verifyLoading && (
                <div className="text-center py-6 sm:py-12 text-slate-400 dark:text-slate-500">
                  <Clipboard className="h-8 w-8 sm:h-12 sm:w-12 text-slate-300 dark:text-slate-600 mx-auto mb-2 sm:mb-3" />
                  <h3 className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">Scan Queue Empty</h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-1 leading-relaxed">
                    Capture student pass QR code, upload file, or click on a test simulator on the left to verify credentials.
                  </p>
                </div>
              )}

              {verifyLoading && (
                <div className="text-center py-12">
                  <RefreshCw className="h-10 w-10 text-blue-500 animate-spin mx-auto mb-3" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Verifying Security Tokens...</span>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Checking with institutional database logs.</p>
                </div>
              )}

              {/* SECURITY ERROR FLAGS */}
              {verificationError && (
                <div className="space-y-4">
                  <div className={`p-5 rounded-2xl border flex items-start space-x-3.5 ${duplicateWarning ? "bg-red-50 dark:bg-red-950/40 border-red-100 dark:border-red-900/50 text-red-800 dark:text-red-300" : "bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-900/50 text-rose-800 dark:text-rose-300"}`}>
                    <ShieldAlert className="h-8 w-8 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-bold text-red-900 dark:text-red-200 uppercase tracking-wide">
                        {duplicateWarning ? "Security Alert: QR Code Re-Scan Violation!" : "Verification Failed"}
                      </h3>
                      <p className="text-xs font-semibold mt-1 leading-relaxed">{verificationError}</p>

                      {duplicateWarning && (
                        <div className="mt-3 bg-red-100 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg p-2.5 text-[10px] font-bold text-red-800 dark:text-red-200 flex items-center space-x-1.5">
                          <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                          <span>CRITICAL ALERT: Student has already completed this outing. Do not permit re-entry/exit.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* VERIFIED PASS DETAILS */}
              {verifiedPass && (
                <div className="space-y-5">
                  {expiredWarning ? (
                    <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/50 p-4 rounded-xl flex items-center space-x-3 text-amber-800 dark:text-amber-200">
                      <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400 shrink-0" />
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider">Late Return Alert</div>
                        <div className="text-[11px] font-semibold">{verificationSuccess}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 p-4 rounded-xl flex items-center space-x-3 text-emerald-800 dark:text-emerald-200">
                      <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider">Pass Verification Clear</div>
                        <div className="text-[11px] font-semibold">{verificationSuccess}</div>
                      </div>
                    </div>
                  )}

                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50 dark:bg-slate-800/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 rounded-xl bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 flex items-center justify-center shadow-inner font-bold text-slate-700 dark:text-slate-200">
                        {(verifiedPass.faculty_name || verifiedPass.student_name || "US").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                            {verifiedPass.faculty_name || verifiedPass.student_name}
                          </h4>
                          {verifiedPass.user_type === "faculty" && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                              FACULTY GATEPASS
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {verifiedPass.faculty_department || verifiedPass.student_department}
                          {verifiedPass.student_roll_no && verifiedPass.student_roll_no !== "FACULTY" && ` • Roll: ${verifiedPass.student_roll_no}`}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(verifiedPass.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">Reason</span>
                      <span className="text-slate-800 dark:text-slate-100">{verifiedPass.reason}</span>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">Exit Permitted</span>
                      <span className="text-slate-800 dark:text-slate-100">{new Date(verifiedPass.exit_time).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Actions depending on pass status */}
                  <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex gap-3">
                    {verifiedPass.status === "approved" && (
                      <button
                        onClick={() => handleMarkExit(verifiedPass.id)}
                        className="w-full flex items-center justify-center py-3 bg-[#0a1e33] hover:bg-[#112d4e] dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer space-x-1.5"
                      >
                        <ArrowRight className="h-4 w-4" />
                        <span>Log Exit (Mark Outing)</span>
                      </button>
                    )}
                    {verifiedPass.status === "exited" && (
                      <button
                        onClick={() => handleMarkReturn(verifiedPass.id)}
                        className="w-full flex items-center justify-center py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer space-x-1.5"
                      >
                        <ArrowRight className="h-4 w-4" />
                        <span>Log Campus Return (Close Pass)</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Today's Entries Activity Logs Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm mt-8 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">Today's GatePass Checkpoints Activity</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Real-time log of student exits and entries registered today.</p>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student, roll, dept..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-8 py-1.5 w-full sm:w-56 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-xs"
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
              <button
                onClick={fetchGuardData}
                className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer shrink-0"
                title="Refresh logs"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {(() => {
              const filteredTodayEntries = todayEntries.filter((pass) => {
                if (!searchQuery) return true;
                const q = searchQuery.toLowerCase().trim();
                const name = (pass.student_name || pass.faculty_name || "").toLowerCase();
                const roll = (pass.student_roll_no || "").toLowerCase();
                const dept = (pass.student_department || pass.faculty_department || "").toLowerCase();
                const reason = (pass.reason || "").toLowerCase();
                return name.includes(q) || roll.includes(q) || dept.includes(q) || reason.includes(q);
              });

              return (
                <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                  <thead className="bg-slate-50 dark:bg-slate-800/70">
                    <tr>
                      <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Student Details</th>
                      <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Reason</th>
                      <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider">Scan / Exit Timestamp</th>
                      <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-200">
                    {filteredTodayEntries.map((pass) => (
                      <tr key={pass.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-bold text-slate-800 dark:text-slate-100">{pass.student_name}</div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Roll: {pass.student_roll_no} • {pass.student_department}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-xs">"{pass.reason}"</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-300 font-semibold">
                          {pass.exit_marked_at ? (
                            <span className="flex items-center text-emerald-600 dark:text-emerald-400 font-bold">
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />
                              {new Date(pass.exit_marked_at).toLocaleTimeString()}
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500">No Scan Logged</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(pass.status)}
                        </td>
                      </tr>
                    ))}
                    {filteredTodayEntries.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-slate-400 dark:text-slate-500 font-medium">
                          {searchQuery ? `No checkpoint logs found matching "${searchQuery}"` : "No gate exits have been logged yet today."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
