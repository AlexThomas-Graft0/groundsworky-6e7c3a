'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { LabourLogRow, JobRow } from './types';

interface LabourLogsManagerProps {
  labourLogs: LabourLogRow[];
  jobs: JobRow[];
  onRefresh: () => void;
}

export default function LabourLogsManager({ labourLogs, jobs, onRefresh }: LabourLogsManagerProps) {
  const [selectedJobId, setSelectedJobId] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [jobId, setJobId] = useState('');
  const [workerOrRole, setWorkerOrRole] = useState('');
  const [rateType, setRateType] = useState<'day_rate' | 'hourly'>('day_rate');
  const [rateAmount, setRateAmount] = useState<number>(180);
  const [estimatedUnits, setEstimatedUnits] = useState<number>(5);
  const [actualUnits, setActualUnits] = useState<number>(5);
  const [dateLogged, setDateLogged] = useState('2025-02-15');

  const openCreateModal = () => {
    setEditingId(null);
    setJobId(jobs[0]?.id || '');
    setWorkerOrRole('360 Machine Driver / Groundworker');
    setRateType('day_rate');
    setRateAmount(210);
    setEstimatedUnits(5);
    setActualUnits(5);
    setDateLogged('2025-02-15');
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (log: LabourLogRow) => {
    setEditingId(log.id);
    setJobId(log.job_id || '');
    setWorkerOrRole(log.worker_or_role);
    setRateType(log.rate_type);
    setRateAmount(log.rate_amount);
    setEstimatedUnits(log.estimated_units);
    setActualUnits(log.actual_units);
    setDateLogged(log.date_logged || '2025-02-15');
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerOrRole.trim() || !jobId) {
      setErrorMsg('Please select a job site and enter worker name or gang role.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const payload = {
      job_id: jobId,
      worker_or_role: workerOrRole.trim(),
      rate_type: rateType,
      rate_amount: Number(rateAmount) || 0,
      estimated_units: Number(estimatedUnits) || 0,
      actual_units: Number(actualUnits) || 0,
      date_logged: dateLogged || '2025-02-15',
    };

    if (editingId) {
      const { error } = await supabase.from('labour_logs').update(payload).eq('id', editingId);
      if (error) {
        setErrorMsg(`Failed to update labour log: ${error.message}`);
      } else {
        setSuccessMsg('Timesheet entry updated.');
        closeModal();
        onRefresh();
      }
    } else {
      const { error } = await supabase.from('labour_logs').insert([payload]);
      if (error) {
        setErrorMsg(`Failed to add labour log: ${error.message}`);
      } else {
        setSuccessMsg('Site timesheet / gang shift logged.');
        closeModal();
        onRefresh();
      }
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this labour entry?')) return;

    setLoading(true);
    const { error } = await supabase.from('labour_logs').delete().eq('id', id);
    if (error) {
      setErrorMsg(`Failed to delete labour log: ${error.message}`);
    } else {
      setSuccessMsg('Labour log removed.');
      onRefresh();
    }
    setLoading(false);
  };

  const filteredLogs = labourLogs.filter((log) =>
    selectedJobId === 'all' ? true : log.job_id === selectedJobId
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-5 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-amber-400">Labour & Gang Allocation Log</h2>
          <p className="text-xs text-slate-300 mt-1">
            Track site operative shifts, machine drivers, sub-contractors, and day rates vs original tender estimate.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-slate-900 text-sm bg-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
          >
            <option value="all">All Sites / Jobs</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.job_code} - {j.name}
              </option>
            ))}
          </select>
          <button
            onClick={openCreateModal}
            className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-semibold px-4 py-1.5 rounded-lg text-sm transition-all shadow-sm flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Save Timesheet
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="mx-5 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="font-bold text-red-600 hover:text-red-900">&times;</button>
        </div>
      )}
      {successMsg && (
        <div className="mx-5 mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="font-bold text-emerald-600 hover:text-emerald-900">&times;</button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-100 text-slate-700 font-semibold text-xs uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Job Code</th>
              <th className="px-4 py-3">Worker / Role</th>
              <th className="px-4 py-3">Date Logged</th>
              <th className="px-4 py-3 text-right">Rate (£)</th>
              <th className="px-4 py-3 text-center">Units / Days (Est / Act)</th>
              <th className="px-4 py-3 text-right">Total Labour Cost</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-slate-400 italic">
                  No labour timesheets logged for this site filter.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const job = jobs.find((j) => j.id === log.job_id);
                const actCost = log.rate_amount * log.actual_units;
                const diffUnits = log.actual_units - log.estimated_units;

                return (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                      {job?.job_code || 'N/A'}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900">{log.worker_or_role}</td>
                    <td className="px-4 py-3.5 font-mono text-xs">{log.date_logged || '-'}</td>
                    <td className="px-4 py-3.5 text-right font-mono">
                      £{log.rate_amount.toFixed(2)} / {log.rate_type === 'day_rate' ? 'day' : 'hr'}
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono">
                      <span>{log.estimated_units} / </span>
                      <span className={`font-bold ${diffUnits > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                        {log.actual_units}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">
                      £{actCost.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(log)}
                        className="px-2.5 py-1 text-xs font-semibold rounded text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(log.id)}
                        disabled={loading}
                        className="px-2.5 py-1 text-xs font-semibold rounded text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-amber-400">{editingId ? 'Edit Labour Entry' : 'Record Labour / Timesheet'}</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-white text-lg">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[85vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Site / Job *</label>
                <select
                  required
                  value={jobId}
                  onChange={(e) => setJobId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                >
                  <option value="">-- Select Job Site --</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.job_code} - {j.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Worker or Role Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Groundworker 1 (Sewer Pipe Layer)"
                  value={workerOrRole}
                  onChange={(e) => setWorkerOrRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Rate Structure</label>
                  <select
                    value={rateType}
                    onChange={(e) => setRateType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  >
                    <option value="day_rate">Day Rate (£ / day)</option>
                    <option value="hourly">Hourly Rate (£ / hr)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date Logged</label>
                  <input
                    type="date"
                    value={dateLogged}
                    onChange={(e) => setDateLogged(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Rate Amount (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={rateAmount}
                    onChange={(e) => setRateAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Est. Units</label>
                  <input
                    type="number"
                    step="0.5"
                    value={estimatedUnits}
                    onChange={(e) => setEstimatedUnits(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Actual Worked</label>
                  <input
                    type="number"
                    step="0.5"
                    value={actualUnits}
                    onChange={(e) => setActualUnits(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-amber-400 text-slate-950 hover:bg-amber-500 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingId ? 'Update Labour Entry' : 'Save Labour Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}