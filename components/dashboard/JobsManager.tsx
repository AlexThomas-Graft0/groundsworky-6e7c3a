'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ClientRow, JobRow, JobFinancialSummary } from './types';

interface JobsManagerProps {
  jobs: JobRow[];
  clients: ClientRow[];
  summaries: JobFinancialSummary[];
  onRefresh: () => void;
}

export default function JobsManager({ jobs, clients, summaries, onRefresh }: JobsManagerProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [clientId, setClientId] = useState('');
  const [jobCode, setJobCode] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [contractValue, setContractValue] = useState<number>(0);
  const [status, setStatus] = useState<'quoted' | 'active' | 'completed' | 'on_hold'>('active');
  const [startDate, setStartDate] = useState('');
  const [targetCompletionDate, setTargetCompletionDate] = useState('');

  const openCreateModal = () => {
    setEditingId(null);
    setClientId(clients[0]?.id || '');
    setJobCode(`GW-${Math.floor(1000 + Math.random() * 9000)}`);
    setName('');
    setLocation('Bedlinog / Merthyr Tydfil');
    setContractValue(45000);
    setStatus('active');
    setStartDate('2025-02-01');
    setTargetCompletionDate('2025-06-30');
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (job: JobRow) => {
    setEditingId(job.id);
    setClientId(job.client_id || '');
    setJobCode(job.job_code);
    setName(job.name);
    setLocation(job.location || '');
    setContractValue(job.contract_value || 0);
    setStatus(job.status);
    setStartDate(job.start_date || '');
    setTargetCompletionDate(job.target_completion_date || '');
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
    if (!name.trim() || !jobCode.trim()) {
      setErrorMsg('Job Code and Job Name are required.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const payload = {
      client_id: clientId || null,
      job_code: jobCode.trim(),
      name: name.trim(),
      location: location.trim() || null,
      contract_value: Number(contractValue) || 0,
      status: status,
      start_date: startDate || null,
      target_completion_date: targetCompletionDate || null,
    };

    if (editingId) {
      const { error } = await supabase.from('jobs').update(payload).eq('id', editingId);
      if (error) {
        setErrorMsg(`Failed to update job: ${error.message}`);
      } else {
        setSuccessMsg('Job setup updated successfully.');
        closeModal();
        onRefresh();
      }
    } else {
      const { error } = await supabase.from('jobs').insert([payload]);
      if (error) {
        setErrorMsg(`Failed to create job: ${error.message}`);
      } else {
        setSuccessMsg('New job setup & budget contract created.');
        closeModal();
        onRefresh();
      }
    }
    setLoading(false);
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to delete job ${code}? All logs linked to this site will be deleted!`)) {
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const { error } = await supabase.from('jobs').delete().eq('id', id);

    if (error) {
      setErrorMsg(`Failed to delete job: ${error.message}`);
    } else {
      setSuccessMsg('Job deleted successfully.');
      onRefresh();
    }
    setLoading(false);
  };

  const filteredSummaries = summaries.filter((s) => {
    const matchStatus = statusFilter === 'all' || s.job.status === statusFilter;
    const matchSearch =
      s.job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.job.job_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.job.location && s.job.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      s.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-5 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-amber-400">Sites & Job Contracts Directory</h2>
          <p className="text-xs text-slate-300 mt-1">
            Setup new site contracts, set baseline contract values, and monitor ongoing commercial financial status.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-slate-900 text-sm bg-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Sites</option>
            <option value="quoted">Quoted / Tender</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
          </select>
          <input
            type="text"
            placeholder="Search code, site or client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-slate-900 text-sm bg-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <button
            onClick={openCreateModal}
            className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-semibold px-4 py-1.5 rounded-lg text-sm transition-all shadow-sm flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Job
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
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Site Name / Location</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3 text-right">Contract Value</th>
              <th className="px-4 py-3 text-right">Total Actual Cost</th>
              <th className="px-4 py-3 text-right">Margin £ / %</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredSummaries.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-slate-400 italic">
                  No site contracts match your criteria. Click "Create New Job" to begin.
                </td>
              </tr>
            ) : (
              filteredSummaries.map((s) => {
                const j = s.job;
                let badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                if (s.riskStatus === 'MARGIN WARNING') badgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
                if (s.riskStatus === 'OVER BUDGET') badgeColor = 'bg-red-100 text-red-800 border-red-300 font-bold animate-pulse';

                return (
                  <tr key={j.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-900">{j.job_code}</td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-900">{j.name}</div>
                      <div className="text-xs text-slate-500">{j.location || 'South Wales'}</div>
                    </td>
                    <td className="px-4 py-3.5 font-medium">{s.clientName}</td>
                    <td className="px-4 py-3.5 text-right font-mono font-semibold text-slate-900">
                      £{j.contract_value.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-slate-800">
                      £{s.totalCostAct.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono">
                      <div className={`font-bold ${s.netProfit < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                        £{s.netProfit.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-slate-500">
                        {s.marginPct.toFixed(1)}%
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-1">
                        <span className="inline-block px-2 py-0.5 text-xs rounded border font-semibold text-center uppercase bg-slate-100 text-slate-800 border-slate-300">
                          {j.status}
                        </span>
                        <span className={`inline-block px-2 py-0.5 text-[10px] rounded border font-bold text-center ${badgeColor}`}>
                          {s.riskStatus}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(j)}
                        className="px-2.5 py-1 text-xs font-semibold rounded text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(j.id, j.job_code)}
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
              <h3 className="font-bold text-amber-400">{editingId ? 'Edit Site Contract' : 'Create New Site Setup'}</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-white text-lg">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Job Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="GW-101"
                    value={jobCode}
                    onChange={(e) => setJobCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Client *</label>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  >
                    <option value="">-- Select Client --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Site / Contract Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Plot 12 Bryn Heulog Deep Drainage & Concreting"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
                <input
                  type="text"
                  placeholder="e.g. Bedlinog, Merthyr Tydfil, CF46"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quoted Contract Value (£) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={contractValue}
                    onChange={(e) => setContractValue(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  >
                    <option value="quoted">Quoted / Tender</option>
                    <option value="active">Active Site</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Completion Date</label>
                  <input
                    type="date"
                    value={targetCompletionDate}
                    onChange={(e) => setTargetCompletionDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
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
                  {loading ? 'Saving...' : editingId ? 'Update Job' : 'Create Job Setup'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}