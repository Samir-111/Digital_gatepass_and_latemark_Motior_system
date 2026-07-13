/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, ShieldCheck, QrCode, RefreshCw, Clock, ArrowRight, ArrowLeft,
  User, CheckCircle, Search, LogOut, Camera, Clipboard, AlertTriangle, AlertCircle,
  XCircle
} from 'lucide-react';
import { apiFetch } from '../lib/api.js';
import { GatePass } from '../types.js';
import { gatepassService } from '../services/gatepassService.js';
import { Html5Qrcode } from 'html5-qrcode';

interface GuardDashboardProps {
  user: any;
  onLogout: () => void;
}

export default function GuardDashboard({ user, onLogout }: GuardDashboardProps) {
  const [todayEntries, setTodayEntries] = useState<GatePass[]>([]);
  const [loading, setLoading] = useState(true);
  const [manualToken, setManualToken] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  
  // Verification responses
  const [verifiedPass, setVerifiedPass] = useState<GatePass | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationSuccess, setVerificationSuccess] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [expiredWarning, setExpiredWarning] = useState(false);

  // Lists of students for easy virtual testing
  const [testPasses, setTestPasses] = useState<GatePass[]>([]);

  // Real-time Web QR Scanner States
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState<boolean | null>(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<any[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // QR Image Upload States
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploadLoading(true);
    setImageUploadError(null);
    setVerificationError(null);
    setVerificationSuccess(null);

    try {
      // Create a temporary element or use the existing qr-reader-element
      // html5-qrcode can scan an image file without needing a live camera running.
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

      // Auto-submit verification for ease of use
      await handleVerify(decodedText);
    } catch (err: any) {
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
      
      // We can also fetch the list of pending/approved passes directly or simulate it
      const list = await gatepassService.getStudentHistory().catch(() => []);
      setTestPasses(list);
    } catch (err) {
      console.error('Error loading guard data', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAllPassesForTesting = async () => {
    try {
      // Fetch some passes for guard simulation
      const res = await fetch('/api/admin/dashboard', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('gatepass_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Extract all passes from db stats/logs
        const pResponse = await fetch('/api/student/history', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('gatepass_token')}` }
        });
        // We'll query some passes
      }
    } catch (e) {
      console.error(e);
    }
  };

  const startScanning = async (cameraId?: string) => {
    setScannerError(null);
    const elementId = "qr-reader-element";
    
    // Stop any existing scanner first
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
        // Retry shortly if DOM is loading
        setTimeout(() => startScanning(cameraId), 300);
        return;
      }

      // Proactively request browser permission to unlock media devices and label enumeration
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          // Stop track right away since we just need to establish permission prior to html5-qrcode
          stream.getTracks().forEach(track => track.stop());
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

      let targetCameraId: any = cameraId;
      if (!targetCameraId) {
        targetCameraId = devices.length > 0 
          ? (devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'))?.id || devices[0].id)
          : { facingMode: "environment" };
      }

      if (devices.length > 0 && !cameraId) {
        setSelectedCameraId(typeof targetCameraId === 'string' ? targetCameraId : devices[0].id);
      }

      try {
        // First attempt with target/environment camera
        await scanner.start(
          targetCameraId,
          config,
          (decodedText) => {
            setManualToken(decodedText);
            handleVerify(decodedText);
          },
          () => {
            // Parse errors are expected on every frame when no QR is present in view
          }
        );
      } catch (firstErr) {
        // Fallback to user/front camera if environment camera is unavailable or fails (e.g. on desktop/laptop)
        if (!cameraId && (typeof targetCameraId === 'object' || devices.length > 0)) {
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
    } catch (err: any) {
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
    // Periodically fetch passes to keep test simulator updated
    const interval = setInterval(fetchGuardData, 10000);

    // Auto-start scanner on mount
    startScanning();

    return () => {
      clearInterval(interval);
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(err => console.error("Scanner cleanup error:", err));
      }
    };
  }, []);

  const handleVerify = async (tokenValue: string) => {
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
    } catch (err: any) {
      // Capture specific security violations
      setVerificationError(err.message || 'Verification failed.');
      if (err.message && (err.message.includes('Single-Use') || err.message.includes('already completed'))) {
        setDuplicateWarning(true);
      }
      if (err.message && err.message.includes('Expired')) {
        setExpiredWarning(true);
      }
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleMarkExit = async (passId: string) => {
    try {
      const data = await gatepassService.markStudentExit(passId);
      alert(data.message);
      setVerifiedPass(null);
      setVerificationSuccess(null);
      fetchGuardData();
    } catch (err: any) {
      alert(err.message || 'Failed to log exit.');
    }
  };

  const handleMarkReturn = async (passId: string) => {
    try {
      const data = await gatepassService.markStudentReturn(passId);
      alert(data.message);
      setVerifiedPass(null);
      setVerificationSuccess(null);
      fetchGuardData();
    } catch (err: any) {
      alert(err.message || 'Failed to log return.');
    }
  };

  const getStatusBadge = (status: GatePass['status']) => {
    const styles = {
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      rejected: 'bg-rose-50 text-rose-700 border-rose-200',
      exited: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      closed: 'bg-slate-100 text-slate-700 border-slate-200',
      cancelled: 'bg-slate-50 text-slate-400 border-slate-200',
    };

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${styles[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-12 font-sans">
      {/* Navigation header */}
      <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 bg-slate-900 rounded-lg flex items-center justify-center shadow-sm shrink-0">
                <QrCode className="h-5 w-5 text-emerald-400" />
              </div>
              <span className="font-extrabold text-slate-900 tracking-tight text-xs sm:text-sm md:text-base leading-tight max-w-[150px] sm:max-w-none line-clamp-2">S. B. Jain Institute of Technology, Management and Research</span>
              <span className="hidden lg:inline bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border border-amber-200 shrink-0">Guard</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-slate-700 font-medium flex items-center space-x-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="font-bold text-slate-800">{user.name}</span>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Main interactive grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Scanner Console Panel */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Real-time Live QR Code Scanner */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-1.5">
                  <Camera className="h-4.5 w-4.5 text-slate-700 animate-pulse" />
                  <span>Real-time Live QR Scanner</span>
                </h2>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                    scannerActive 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse' 
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}>
                    {scannerActive ? '● Camera Active' : 'Offline'}
                  </span>
                </div>
              </div>

              {/* Scanner Screen Frame */}
              <div className="bg-slate-900 rounded-2xl aspect-square flex flex-col items-center justify-center relative overflow-hidden mb-4 border-4 border-slate-800">
                {/* HTML5 QR Code Mount point */}
                <div 
                  id="qr-reader-element" 
                  className="w-full h-full"
                ></div>

                {/* Overlaid UI frame when camera is live */}
                {scannerActive && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                    <div className="border-2 border-dashed border-emerald-500/80 w-52 h-52 rounded-2xl relative">
                      <div className="absolute -top-1.5 -left-1.5 h-5 w-5 border-t-4 border-l-4 border-emerald-500 rounded-tl-lg"></div>
                      <div className="absolute -top-1.5 -right-1.5 h-5 w-5 border-t-4 border-r-4 border-emerald-500 rounded-tr-lg"></div>
                      <div className="absolute -bottom-1.5 -left-1.5 h-5 w-5 border-b-4 border-l-4 border-emerald-500 rounded-bl-lg"></div>
                      <div className="absolute -bottom-1.5 -right-1.5 h-5 w-5 border-b-4 border-r-4 border-emerald-500 rounded-br-lg"></div>
                      {/* Pulsing Scan Line */}
                      <div className="w-full bg-emerald-500/20 h-1 absolute top-0 animate-[bounce_3s_infinite] border-b-2 border-emerald-400 shadow shadow-emerald-500"></div>
                    </div>
                  </div>
                )}

                {/* Screen when scanner is disabled or failed */}
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

              {/* Camera selection dropdown & control switches */}
              {availableCameras.length > 1 && (
                <div className="mb-4">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Select Camera Input Device</label>
                  <select
                    value={selectedCameraId}
                    onChange={(e) => {
                      setSelectedCameraId(e.target.value);
                      startScanning(e.target.value);
                    }}
                    className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 font-semibold"
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
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-1"
                  >
                    <XCircle className="h-4 w-4 text-slate-500" />
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
              <div className="border-t border-b border-slate-100 py-4 my-4">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Or Scan QR Image File (Upload Screenshot)
                </label>
                <div className="relative border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-xl p-4 transition bg-slate-50/50 hover:bg-emerald-50/10 text-center cursor-pointer">
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
                        <span className="text-xs font-semibold text-slate-600">Decoding QR Code image...</span>
                      </>
                    ) : (
                      <>
                        <Clipboard className="h-6 w-6 text-slate-400" />
                        <div className="text-xs font-bold text-slate-700">Click to upload or drag QR image</div>
                        <p className="text-[10px] text-slate-400">Supports JPEG, PNG screenshots of Gate Pass</p>
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
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Enter QR Security Token manually</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="gp_tok_..."
                      value={manualToken}
                      onChange={(e) => setManualToken(e.target.value)}
                      className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                    <button
                      onClick={() => handleVerify(manualToken)}
                      disabled={verifyLoading}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow transition cursor-pointer shrink-0"
                    >
                      Verify Token
                    </button>
                  </div>
                </div>

                {/* Simulated Student List for easy evaluation */}
                <div className="border-t border-slate-100 pt-4">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Simulate student scan (Click to scan)</label>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    <button
                      onClick={() => handleVerify('gp_tok_active_approved_demo_67890')}
                      className="w-full text-left p-2 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 rounded-lg text-xs flex justify-between items-center transition cursor-pointer font-semibold text-slate-700"
                    >
                      <div className="truncate">Samir Khorgade (Approved Pass)</div>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Scan QR</span>
                    </button>
                    <button
                      onClick={() => handleVerify('gp_tok_past_closed_demo_12345')}
                      className="w-full text-left p-2 border border-slate-100 hover:border-red-200 hover:bg-red-50/30 rounded-lg text-xs flex justify-between items-center transition cursor-pointer font-semibold text-slate-700"
                    >
                      <div className="truncate">Samir Khorgade (Duplicate QR Reuse)</div>
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">Scan QR</span>
                    </button>
                    <button
                      onClick={() => handleVerify('gp_tok_pending_demo_abcde')}
                      className="w-full text-left p-2 border border-slate-100 hover:border-amber-200 hover:bg-amber-50/30 rounded-lg text-xs flex justify-between items-center transition cursor-pointer font-semibold text-slate-700"
                    >
                      <div className="truncate">Jane Doe (Unapproved Pass)</div>
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">Scan QR</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Results Panel */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Result Header Box */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center min-h-[460px]">
              
              {!verifiedPass && !verificationError && !verifyLoading && (
                <div className="text-center py-12 text-slate-400">
                  <Clipboard className="h-12 w-12 text-slate-300 mx-auto mb-3 animate-bounce" />
                  <h3 className="text-sm font-bold text-slate-700">Scan Queue Empty</h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
                    Capture student pass QR code, upload file, or click on a test simulator on the left to verify credentials.
                  </p>
                </div>
              )}

              {verifyLoading && (
                <div className="text-center py-12">
                  <RefreshCw className="h-10 w-10 text-blue-500 animate-spin mx-auto mb-3" />
                  <span className="text-sm font-bold text-slate-700">Verifying Security Tokens...</span>
                  <p className="text-xs text-slate-400 mt-1">Checking with institutional database logs.</p>
                </div>
              )}

              {/* SECURITY ERROR FLAGS */}
              {verificationError && (
                <div className="space-y-4">
                  <div className={`p-5 rounded-2xl border flex items-start space-x-3.5 ${duplicateWarning ? 'bg-red-50 border-red-100 text-red-800' : 'bg-rose-50 border-rose-100 text-rose-800'}`}>
                    <ShieldAlert className="h-8 w-8 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-bold text-red-900 uppercase tracking-wide">
                        {duplicateWarning ? 'Security Alert: QR Code Re-Scan Violation!' : 'Verification Failed'}
                      </h3>
                      <p className="text-xs font-semibold mt-1 leading-relaxed">{verificationError}</p>
                      
                      {duplicateWarning && (
                        <div className="mt-3 bg-red-100 border border-red-200 rounded-lg p-2.5 text-[10px] font-bold text-red-800 flex items-center space-x-1.5">
                          <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
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
                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center space-x-3 text-emerald-800">
                    <ShieldCheck className="h-6 w-6 text-emerald-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider">Pass Verification Clear</div>
                      <div className="text-[11px] font-semibold">{verificationSuccess}</div>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 rounded-xl bg-slate-200 border border-slate-300 flex items-center justify-center shadow-inner font-bold text-slate-700">
                        {verifiedPass.student_name ? verifiedPass.student_name.slice(0, 2).toUpperCase() : 'ST'}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">{verifiedPass.student_name}</h4>
                        <p className="text-xs text-slate-500 font-medium">{verifiedPass.student_department} • Roll: <span className="font-semibold text-slate-700">{verifiedPass.student_roll_no}</span></p>
                      </div>
                    </div>
                    {getStatusBadge(verifiedPass.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Reason</span>
                      <span className="text-slate-800">{verifiedPass.reason}</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Exit Permitted</span>
                      <span className="text-slate-800">{new Date(verifiedPass.exit_time).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Actions depending on pass status */}
                  <div className="border-t border-slate-200 pt-4 flex gap-3">
                    {verifiedPass.status === 'approved' && (
                      <button
                        onClick={() => handleMarkExit(verifiedPass.id)}
                        className="w-full flex items-center justify-center py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer space-x-1.5"
                      >
                        <ArrowRight className="h-4 w-4" />
                        <span>Log Exit (Close Pass)</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Today's Entries Activity Logs Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mt-8 overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Today's GatePass Checkpoints Activity</h2>
              <p className="text-xs text-slate-500 font-medium">Real-time log of student exits and entries registered today.</p>
            </div>
            <button 
              onClick={fetchGuardData}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Student Details</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 tracking-wider">Scan / Exit Timestamp</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100 text-xs text-slate-700">
                {todayEntries.map((pass) => (
                  <tr key={pass.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-slate-800">{pass.student_name}</div>
                      <div className="text-[10px] text-slate-400 font-medium">Roll: {pass.student_roll_no} • {pass.student_department}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800 truncate max-w-xs">"{pass.reason}"</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-semibold">
                      {pass.exit_marked_at ? (
                        <span className="flex items-center text-emerald-600 font-bold">
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                          {new Date(pass.exit_marked_at).toLocaleTimeString()}
                        </span>
                      ) : (
                        <span className="text-slate-400">No Scan Logged</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(pass.status)}
                    </td>
                  </tr>
                ))}
                {todayEntries.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400 font-medium">
                      No gate exits have been logged yet today.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
