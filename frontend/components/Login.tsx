/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, School, Lock, Mail, ChevronRight, 
  AlertCircle, Loader2, UserPlus, ArrowLeft, 
  User, Phone, Building2, ClipboardList 
} from 'lucide-react';
import { apiFetch, setAuthToken } from '../lib/api.js';
import { UserRole, Department, HOD, Teacher } from '../types.js';

interface LoginProps {
  onLoginSuccess: (user: any, role: UserRole) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  // Login form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Mode selection states
  const [isRegistering, setIsRegistering] = useState(false);

  // Registration states
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRollNo, setRegRollNo] = useState('');
  const [regCollegeId, setRegCollegeId] = useState('');
  const [regDept, setRegDept] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regClassTeacherId, setRegClassTeacherId] = useState(''); // Selected Class Teacher
  const [regHODId, setRegHODId] = useState(''); // Selected HOD

  // Dropdown datasets from backend
  const [departments, setDepartments] = useState<Department[]>([]);
  const [hods, setHods] = useState<HOD[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]); // Dynamic teachers list
  
  // Selection states for demo HOD dropdown
  const [selectedDemoHOD, setSelectedDemoHOD] = useState('');
  const [showHODDropdown, setShowHODDropdown] = useState(false);

  // Fetch departments and HODs list from API
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const data = await apiFetch('/api/public/info');
        setDepartments(data.departments || []);
        setHods(data.hods || []);
        setTeachers(data.teachers || []);
        if (data.departments && data.departments.length > 0) {
          setRegDept(data.departments[0].department_name);
        }
      } catch (err) {
        console.error('Failed to load login meta indicators:', err);
      }
    };
    fetchMetadata();
  }, []);

  // Standard Login Submit Handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const data = await apiFetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      setAuthToken(data.token);
      localStorage.setItem('gatepass_user', JSON.stringify(data.user));
      localStorage.setItem('gatepass_role', data.role);
      
      onLoginSuccess(data.user, data.role);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Student Self-Registration Handler
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (
      !regName || !regEmail || !regPassword || !regRollNo || 
      !regDept || !regPhone || !regClassTeacherId || !regHODId
    ) {
      setError('Please fill out all fields in the registration form including choosing your Class Teacher and HOD.');
      return;
    }

    // Email Domain Validation check
    if (!regEmail.toLowerCase().endsWith('@sbjit.edu.in')) {
      setError('Registration is restricted to authorized institutional email IDs ending with @sbjit.edu.in');
      return;
    }

    setLoading(true);

    try {
      await apiFetch('/api/register', {
        method: 'POST',
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          roll_no: regRollNo,
          college_id: regRollNo,
          department: regDept,
          phone: regPhone,
          parent_phone: '', // Resolved dynamically in backend
          class_teacher_id: regClassTeacherId,
          selected_hod_id: regHODId,
        }),
      });

      setSuccessMsg('Registration successful! You can now log in with your credentials.');
      setIsRegistering(false);
      
      // Auto fill registered email for seamless login
      setEmail(regEmail);
      setPassword(regPassword);
      
      // Reset register state fields
      setRegName('');
      setRegEmail('');
      setRegPassword('');
      setRegRollNo('');
      setRegCollegeId('');
      setRegPhone('');
      setRegClassTeacherId('');
      setRegHODId('');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  // Demo Login Helper
  const handleDemoLogin = (demoRole: UserRole, specificEmail?: string) => {
    if (demoRole === 'student') {
      setIsRegistering(true);
      setError('Please register your student account first or sign in using your registered credentials.');
      setSuccessMsg(null);
      return;
    }

    let demoEmail = '';
    switch (demoRole) {
      case 'hod':
        demoEmail = specificEmail || 'hod@college.edu';
        break;
      case 'guard':
        demoEmail = 'guard@college.edu';
        break;
      case 'admin':
        demoEmail = 'admin@college.edu';
        break;
      case 'teacher':
        demoEmail = 'teacher1@college.edu';
        break;
    }
    
    setEmail(demoEmail);
    setPassword('');
    setError(null);
    setSuccessMsg(null);
    setShowHODDropdown(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-10 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto w-full max-w-md text-center">
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg transform transition-transform hover:scale-105">
            <School className="h-9 w-9 text-emerald-400" />
          </div>
        </div>
        <h2 className="mt-5 text-xl font-black tracking-tight text-slate-900 font-sans px-4">
          S. B. Jain Institute of Technology, Management and Research
        </h2>
        <p className="mt-2 text-xs text-slate-500 font-bold tracking-wide uppercase">
          Smart Digital Campus Access Portal
        </p>
      </div>

      <div className="mt-6 sm:mx-auto w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200 sm:px-10">
          
          {/* Status Alert Panels */}
          {error && (
            <div className="mb-5 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-start space-x-3 shadow-sm">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div className="text-xs text-red-700 font-bold leading-relaxed">{error}</div>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-xl flex items-start space-x-3 shadow-sm">
              <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-700 font-bold leading-relaxed">{successMsg}</div>
            </div>
          )}

          {/* VIEW 1: SIGN IN VIEW */}
          {!isRegistering ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-800">Sign In to Your Account</h3>
                <button 
                  onClick={() => {
                    setIsRegistering(true);
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1 transition cursor-pointer"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Register Your Account</span>
                </button>
              </div>

              <form className="space-y-4" onSubmit={handleLoginSubmit}>
                <div>
                  <label htmlFor="email" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
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
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-xs font-semibold"
                      placeholder="name@sbjit.edu.in"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Password
                  </label>
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
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-xs font-semibold"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-md text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                        Verifying Credentials...
                      </>
                    ) : (
                      <>
                        <span>Sign In Securely</span>
                        <ChevronRight className="ml-1.5 h-4 w-4 text-emerald-400" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Quick Developers Console for Testing */}
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest text-slate-400">
                    <span className="bg-white px-3">Developer Quick Login</span>
                  </div>
                </div>

                {/* HOD Dynamic Dropdown Logic */}
                {showHODDropdown && (
                  <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animation-fade-in">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Select HOD from Dataset</span>
                      <button onClick={() => setShowHODDropdown(false)} className="text-[10px] text-slate-400 hover:text-slate-600 font-bold">Cancel</button>
                    </div>
                    <select
                      value={selectedDemoHOD}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedDemoHOD(val);
                        if (val) {
                          handleDemoLogin('hod', val);
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-bold text-slate-800"
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

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleDemoLogin('student')}
                    className="flex flex-col items-center justify-center p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-all cursor-pointer group"
                  >
                    <span className="text-xs font-bold text-slate-800 group-hover:text-slate-950">Student Portal</span>
                    <span className="text-[9px] text-slate-400 mt-0.5">Register / Sign In</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (hods.length > 0) {
                        setShowHODDropdown(true);
                      } else {
                        handleDemoLogin('hod');
                      }
                    }}
                    className="flex flex-col items-center justify-center p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-all cursor-pointer group"
                  >
                    <span className="text-xs font-bold text-slate-800 group-hover:text-slate-950">HOD Portal</span>
                    <span className="text-[9px] text-emerald-600 font-extrabold mt-0.5">Choose Dept HOD ▾</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDemoLogin('teacher')}
                    className="flex flex-col items-center justify-center p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-all cursor-pointer group"
                  >
                    <span className="text-xs font-bold text-slate-800 group-hover:text-slate-950">Class Incharge</span>
                    <span className="text-[9px] text-slate-400 mt-0.5">Teacher Dashboard</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDemoLogin('guard')}
                    className="flex flex-col items-center justify-center p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-all cursor-pointer group"
                  >
                    <span className="text-xs font-bold text-slate-800 group-hover:text-slate-950">Guard Station</span>
                    <span className="text-[9px] text-slate-400 mt-0.5">Gate Checkpoint</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDemoLogin('admin')}
                    className="col-span-2 flex flex-col items-center justify-center p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-all cursor-pointer group"
                  >
                    <span className="text-xs font-bold text-slate-800 group-hover:text-slate-950">Administrator</span>
                    <span className="text-[9px] text-slate-400 mt-0.5">System Admin Portal</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            
            /* VIEW 2: NEW STUDENT SELF-REGISTRATION FORM */
            <div className="space-y-5">
              <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                <button 
                  onClick={() => {
                    setIsRegistering(false);
                    setError(null);
                  }}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <h3 className="text-sm font-bold text-slate-800">Register Your Student Account</h3>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start space-x-2">
                <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span className="text-[10px] text-amber-800 font-bold leading-relaxed">
                  Security Lock: Registration is restricted to authorized institutional email extensions ending in <strong>@sbjit.edu.in</strong>.
                </span>
              </div>

              <form className="space-y-3.5" onSubmit={handleRegisterSubmit}>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider">Full Student Name</label>
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
                      className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-xs font-semibold text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider">Roll Number</label>
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
                      className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-xs font-semibold text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider">Academic Department</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building2 className="h-4 w-4 text-slate-400" />
                    </div>
                    <select
                      value={regDept}
                      onChange={(e) => setRegDept(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-xs font-semibold text-slate-900 focus:outline-none"
                    >
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.department_name}>
                          {dept.department_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider">Select Class Teacher (Incharge)</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-slate-400" />
                    </div>
                    <select
                      required
                      value={regClassTeacherId}
                      onChange={(e) => setRegClassTeacherId(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-xs font-semibold text-slate-900 focus:outline-none"
                    >
                      <option value="">-- Choose Your Class Teacher --</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} (Class: {t.class_name} - {t.department})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider">Select Department HOD</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-slate-400" />
                    </div>
                    <select
                      required
                      value={regHODId}
                      onChange={(e) => setRegHODId(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-xs font-semibold text-slate-900 focus:outline-none"
                    >
                      <option value="">-- Choose Department HOD --</option>
                      {hods.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name} ({h.department})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider">College Email ID</label>
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
                      className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-xs font-semibold text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider">Your Mobile No.</label>
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
                      className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-xs font-semibold text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider">Password</label>
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
                      className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-xs font-semibold text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center py-2.5 px-4 rounded-xl shadow-md text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 cursor-pointer transition-all"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin h-4 w-4 text-white" />
                    ) : (
                      'Register Your Account'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="mt-6 flex items-center justify-center text-[10px] text-slate-400 space-x-1.5 font-bold">
            <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Secure SSL Encryption Enabled</span>
          </div>

        </div>
      </div>
    </div>
  );
}
