/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  FileText, Check, X, Search, Filter, RefreshCw, AlertCircle, Calendar,
  Clock, LogOut, CheckCircle2, AlertTriangle, Sparkles, User, Info
} from 'lucide-react';
import { apiFetch } from '../lib/api.js';
import { GatePass } from '../types.js';
import { gatepassService } from '../services/gatepassService.js';
import NotificationCenter from './NotificationCenter.js';

interface HODDashboardProps {
  user: any;
  onLogout: () => void;
}

export default function HODDashboard({ user, onLogout }: HODDashboardProps) {
  const [pending, setPending] = useState<GatePass[]>([]);
  const [history, setHistory] = useState<GatePass[]>([]);
  const [loading, setLoading] = useState(true);
  const [remarksMap, setRemarksMap] = useState<Record<string, string>>({});

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'pending' | 'history' | 'late_come'>('pending');
  const [lateEntries, setLateEntries] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const pendingData = await gatepassService.getHODPendingPasses();
      const historyData = await gatepassService.getHODHistoryPasses();
      setPending(pendingData);
      setHistory(historyData);

      const lateData = await gatepassService.getLateComeEntries();
      setLateEntries(lateData || []);
    } catch (err: any) {
      alert(err.message || 'Failed to fetch HOD records.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLateEntries = async () => {
    try {
      const data = await gatepassService.getLateComeEntries();
      setLateEntries(data || []);
    } catch (err: any) {
      console.error('Failed to fetch late come entries:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleApprove = async (passId: string) => {
    const remarks = remarksMap[passId] || 'Approved';
    try {
      await gatepassService.approveGatePassHOD(passId, remarks);

      // Clear local remarks state for this ID
      setRemarksMap(prev => {
        const copy = { ...prev };
        delete copy[passId];
        return copy;
      });

      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || 'Failed to approve gate pass.');
    }
  };

  const handleReject = async (passId: string) => {
    const remarks = remarksMap[passId];
    if (!remarks) {
      alert('Please provide a remark/reason for rejection first.');
      return;
    }

    try {
      await gatepassService.rejectGatePassHOD(passId, remarks);

      // Clear local remarks
      setRemarksMap(prev => {
        const copy = { ...prev };
        delete copy[passId];
        return copy;
      });

      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || 'Failed to reject gate pass.');
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

    const labels = {
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      exited: 'Active Out',
      closed: 'Completed',
      cancelled: 'Cancelled',
    };

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getRiskIndicator = (level?: GatePass['risk_level']) => {
    if (!level) return null;
    const styles = {
      low: 'text-blue-600 bg-blue-50 border-blue-100',
      medium: 'text-amber-600 bg-amber-50 border-amber-100',
      high: 'text-red-600 bg-red-50 border-red-100 animate-pulse',
    };
    return (
      <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${styles[level]}`}>
        <Sparkles className="h-3.5 w-3.5" />
        <span className="uppercase">Frequency Risk: {level}</span>
      </span>
    );
  };

  const today = new Date().toDateString();
  const approvedToday = history.filter(h => h.approved_by && h.status !== 'rejected' && new Date(h.created_at).toDateString() === today).length;
  const rejectedToday = history.filter(h => h.status === 'rejected' && new Date(h.created_at).toDateString() === today).length;

  // Search and filter operations on Pending
  const filteredPending = pending.filter(p => {
    const studentName = p.student_name?.toLowerCase() || '';
    const studentRoll = p.student_roll_no?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();

    const matchesSearch = studentName.includes(query) || studentRoll.includes(query);
    const matchesRisk = riskFilter === 'all' || p.risk_level === riskFilter;

    return matchesSearch && matchesRisk;
  });

  return (
    <div className="min-h-screen bg-slate-100 pb-12 font-sans">
      {/* Navigation header */}
      <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 bg-slate-900 rounded-lg flex items-center justify-center shadow-sm shrink-0">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              </div>
              <span className="font-extrabold text-slate-900 tracking-tight text-xs sm:text-sm md:text-base leading-tight max-w-[150px] sm:max-w-none line-clamp-2">S. B. Jain Institute of Technology, Management and Research</span>
              <span className="hidden lg:inline bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border border-emerald-200 shrink-0">HOD</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-slate-700 font-medium">
                <span className="text-slate-400 font-normal">Department of </span>
                <span className="text-slate-900 font-bold">{user.department}</span>
              </div>
              <NotificationCenter />
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

        {/* HOD Intro Panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Welcome, {user.name}</h1>
            <p className="text-sm text-slate-500 font-medium">Head of Department, <span className="font-semibold text-slate-700">{user.department}</span>. You can review, approve, and reject student gate pass requests below.</p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="self-start md:self-auto inline-flex items-center px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Queue
          </button>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Awaiting Review</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{pending.length}</div>
            <div className="text-[10px] font-medium text-slate-400 mt-0.5">Requests from your dept</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Approved Today</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">{approvedToday}</div>
            <div className="text-[10px] font-medium text-slate-400 mt-0.5">Auto-generated QR passes</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rejected Today</span>
            <div className="text-2xl font-black text-rose-500 mt-1">{rejectedToday}</div>
            <div className="text-[10px] font-medium text-slate-400 mt-0.5">Flagged outings disallowed</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total History</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{history.length}</div>
            <div className="text-[10px] font-medium text-slate-400 mt-0.5">Departmental requests handled</div>
          </div>
        </div>

        {/* Filter and Tab Controller */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
          <div className="border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex space-x-1 shrink-0 bg-slate-50 p-1 rounded-xl border border-slate-200 overflow-x-auto">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer shrink-0 ${activeTab === 'pending' ? 'bg-white text-slate-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Approval Queue ({pending.length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer shrink-0 ${activeTab === 'history' ? 'bg-white text-slate-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Department History ({history.length})
              </button>
              <button
                onClick={() => { setActiveTab('late_come'); fetchLateEntries(); }}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer shrink-0 flex items-center space-x-1 ${activeTab === 'late_come' ? 'bg-white text-slate-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Late-Comers Directory ({lateEntries.length})</span>
              </button>
            </div>

            {/* Filter controls, only visible in Pending tab */}
            {activeTab === 'pending' && (
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div className="relative rounded-xl shadow-sm max-w-xs w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search name / roll..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-slate-400" />
                  <select
                    value={riskFilter}
                    onChange={(e) => setRiskFilter(e.target.value)}
                    className="border border-slate-200 bg-slate-50 text-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="all">All AI Risks</option>
                    <option value="low">Low Risk Only</option>
                    <option value="medium">Medium Risk Only</option>
                    <option value="high">High Risk Only</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* TAB 1: PENDING QUEUE */}
          {activeTab === 'pending' && (
            <div className="p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
                  <p className="text-sm text-slate-500 mt-2 font-medium">Loading approval queue...</p>
                </div>
              ) : filteredPending.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <CheckCircle2 className="h-12 w-12 text-emerald-100 mx-auto mb-3" />
                  <h3 className="text-slate-800 font-bold text-sm">Clear Queue</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                    No pending gate pass requests matched your search criteria. All student applications for {user.department} have been reviewed.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredPending.map((pass) => (
                    <div key={pass.id} className="border border-slate-200 shadow-sm rounded-2xl bg-white p-5 hover:border-slate-300 transition-all">
                      {/* Header with student summary */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-4 mb-4 gap-4">
                        <div className="flex items-center space-x-3">
                          {pass.student_id ? (
                            <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs">
                              {pass.student_name ? pass.student_name.slice(0, 2).toUpperCase() : 'ST'}
                            </div>
                          ) : null}
                          <div>
                            <h3 className="text-sm font-bold text-slate-800">{pass.student_name}</h3>
                            <p className="text-[11px] text-slate-500 font-medium">Roll: <span className="font-semibold text-slate-700">{pass.student_roll_no}</span> • Phone: <span className="font-semibold text-slate-700">{pass.student_phone}</span></p>
                          </div>
                        </div>

                        {/* AI Advisory check card */}
                        <div className="flex items-center gap-2">
                          {getRiskIndicator(pass.risk_level)}
                        </div>
                      </div>

                      {/* AI Risk Remarks box */}
                      {pass.risk_level && (
                        <div className={`p-3.5 rounded-xl border mb-4 flex items-start space-x-2.5 ${pass.risk_level === 'high' ? 'bg-rose-50/50 border-rose-100 text-rose-800' : pass.risk_level === 'medium' ? 'bg-amber-50/50 border-amber-100 text-amber-800' : 'bg-blue-50/50 border-blue-100 text-blue-800'}`}>
                          <Sparkles className="h-4 w-4 text-current shrink-0 mt-0.5" />
                          <div className="text-xs font-semibold leading-relaxed">
                            <span className="font-bold">Monthly Usage Check: </span>
                            {pass.risk_remarks}
                          </div>
                        </div>
                      )}

                      {/* Outing details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium text-slate-600 mb-5 bg-slate-50 p-4 rounded-xl">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Leave Scheduled</span>
                          <span className="text-slate-800 font-bold">{new Date(pass.exit_time).toLocaleString()}</span>
                        </div>
                        <div className="md:col-span-2 border-t border-slate-200/40 pt-2 mt-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Reason Submitted</span>
                          <span className="text-slate-700 italic">"{pass.reason}"</span>
                        </div>
                      </div>

                      {/* Action forms */}
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <input
                          type="text"
                          placeholder="Add approval comments or rejection reason here..."
                          value={remarksMap[pass.id] || ''}
                          onChange={(e) => setRemarksMap({ ...remarksMap, [pass.id]: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                        />
                        <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
                          <button
                            onClick={() => handleReject(pass.id)}
                            className="px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold text-xs rounded-xl flex items-center justify-center cursor-pointer transition"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </button>
                          <button
                            onClick={() => handleApprove(pass.id)}
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center cursor-pointer transition shadow-md"
                          >
                            <Check className="h-4 w-4 mr-1 text-emerald-400" />
                            Approve Pass
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: HISTORICAL LOGS */}
          {activeTab === 'history' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pass ID</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Student Name</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reason</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Leave Scheduled</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Remarks</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100 text-xs">
                  {history.map((pass) => (
                    <tr key={pass.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-800">{pass.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-slate-800">{pass.student_name}</div>
                        <div className="text-[10px] text-slate-400 font-medium">Roll: {pass.student_roll_no}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800 max-w-xs truncate">{pass.reason}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                        {new Date(pass.exit_time).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(pass.status)}</td>
                      <td className="px-6 py-4 text-slate-500 italic max-w-xs truncate">
                        "{pass.remarks || 'No HOD remarks'}"
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {history.length === 0 && (
                <div className="text-center py-12 p-8 text-slate-400">
                  <FileText className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                  <span className="text-sm font-semibold">No historical records found for your department.</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LATE COMERS REGISTER */}
          {activeTab === 'late_come' && (
            <div className="p-6 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Late Come Register (Month-wise)</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Viewing self-reported late arrival timestamps logged by students in the {user.department} department.</p>
                </div>
              </div>

              {/* Stats mini grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Incidents</span>
                  <div className="text-xl font-black text-slate-800 mt-0.5">{lateEntries.length}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active This Month</span>
                  <div className="text-xl font-black text-amber-600 mt-0.5">
                    {(() => {
                      const currentMonth = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
                      return lateEntries.filter(e => {
                        const date = new Date(e.arrival_time);
                        return date.toLocaleString('en-US', { month: 'long', year: 'numeric' }) === currentMonth;
                      }).length;
                    })()}
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unique Students</span>
                  <div className="text-xl font-black text-slate-800 mt-0.5">
                    {new Set(lateEntries.map(e => e.student_id)).size}
                  </div>
                </div>
              </div>

              {/* Grouped Monthwise List */}
              {lateEntries.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Clock className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                  <span className="text-xs font-bold block">No late-comers recorded in your department yet.</span>
                </div>
              ) : (
                <div className="space-y-8">
                  {(() => {
                    const groups: Record<string, typeof lateEntries> = {};
                    lateEntries.forEach(entry => {
                      const date = new Date(entry.arrival_time);
                      const monthYear = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
                      if (!groups[monthYear]) {
                        groups[monthYear] = [];
                      }
                      groups[monthYear].push(entry);
                    });

                    // Sort months newest first
                    const sortedMonths = Object.keys(groups).sort((a, b) => {
                      return new Date(b).getTime() - new Date(a).getTime();
                    });

                    return sortedMonths.map(month => (
                      <div key={month} className="space-y-3">
                        <div className="flex items-center space-x-3 bg-slate-100/80 px-4 py-2 rounded-xl border border-slate-200/50">
                          <Calendar className="h-4 w-4 text-slate-600" />
                          <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">{month}</span>
                          <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {groups[month].length} late arrival{groups[month].length > 1 ? 's' : ''}
                          </span>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                          <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50/50">
                              <tr>
                                <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Student Name</th>
                                <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Roll No</th>
                                <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Arrival Time</th>
                                <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stated Reason</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100 text-xs text-slate-700">
                              {groups[month].map((entry) => (
                                <tr key={entry.id} className="hover:bg-slate-50/30">
                                  <td className="px-6 py-3 font-bold text-slate-800">{entry.student_name}</td>
                                  <td className="px-6 py-3 font-mono text-slate-500">{entry.student_roll_no}</td>
                                  <td className="px-6 py-3 font-semibold text-amber-700">
                                    {new Date(entry.arrival_time).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                  </td>
                                  <td className="px-6 py-3 max-w-xs truncate italic text-slate-600">
                                    "{entry.reason}"
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
