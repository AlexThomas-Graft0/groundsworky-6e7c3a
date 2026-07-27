'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { MuckAwayLogRow, JobRow } from './types';

interface MuckAwayLogsManagerProps {
  muckAwayLogs: MuckAwayLogRow[];
  jobs: JobRow[];
  onRefresh: () => void;
}

export default function MuckAwayLogsManager({ muckAwayLogs, jobs, onRefresh }: MuckAwayLogsManagerProps) {
  const [selectedJobId, setSelectedJobId] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [jobId, setJobId] = useState('');
  const [wasteType, setWasteType] = useState<'inert' | 'non_hazardous' | 'hazardous' | 'green'>('inert');
  const [costPerLoad, setCostPerLoad] = useState<number>(185);
  const [estimatedLoads, setEstimatedLoads] = useState<number>(12);
  const [actualLoads, setActualLoads] = useState<number>(12);
  const [totalTonnage, setTotalTonnage] = useState<number>(210);
  const [ticketReference, setTicketReference] = useState('');

  const openCreateModal = () => {
    setEditingId(null);
    setJobId(jobs[0]?.id || '');
    setWasteType('inert');
    setCostPerLoad(185);
    setEstimatedLoads(10);
    setActualLoads(10);
    setTotalTonnage(180);
    setTicketReference(`TK-${Math.floor(100000 + Math.random() * 900000)}`);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (log: MuckAwayLogRow) => {
    setEditingId(log.id);
    setJobId(log.job_id || '');
    setWasteType(log.waste_type);
    setCostPerLoad(log.cost_per_load);
    setEstimatedLoads(log.estimated_loads);
    setActualLoads(log.actual_loads);
    setTotalTonnage(log.total_tonnage);
    setTicketReference(log.ticket_reference || '');
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleTicketUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setErrorMsg(null);

    const fileName = `tipper-ticket-${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    const { data, error } = await supabase.storage
      .from('groundsworky_6e7c3a')
      .upload(fileName, file, { upsert: true });

    if (error) {
      setErrorMsg(`Ticket photo upload failed: ${error.message}`);
    } else {
      const publicUrl = supabase.storage
        .from('groundsworky_6e7c3a')
        .getPublicUrl(fileName).data.publicUrl;

      setTicketReference((prev) => (prev ? `${prev} (Photo: ${publicUrl})` : `Ticket Photo: ${publicUrl}`));
      setSuccessMsg('Tipper ticket image uploaded.');
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobId) {
      setErrorMsg('Please select a target job site.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const payload = {
      job_id: jobId,
      waste_type: wasteType,
      cost_per_load: Number(costPerLoad) || 0,
      estimated_loads: Number(estimatedLoads) || 0,
      actual_loads: Number(actualLoads) || 0,
      total_tonnage: Number(totalTonnage) || 0,
      ticket_reference: ticketReference.trim() || null,
    };

    if (editingId) {
      const { error } = await supabase.from('muck_away_logs').update(payload).eq('id', editingId);
      if (error) {
        setErrorMsg(`Failed to update muck away log: ${error.message}`);
      } else {
        setSuccessMsg('Muck away entry updated.');
        closeModal();
        onRefresh();
      }
    } else {
      const { error } = await supabase.from('muck_away_logs').insert([payload]);
      if (error) {
        setErrorMsg(`Failed to add muck away log: ${error.message}`);
      } else {
        setSuccessMsg('Muck away tipper load recorded.');
        closeModal();
        onRefresh();
      }
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this muck away log?')) return;

    setLoading(true);
    const { error } = await supabase.from('muck_away_logs').delete().eq('id', id);
    if (error) {
      setErrorMsg(`Failed to delete muck away log: ${error.message}`);
    } else {
      setSuccessMsg('Muck away log removed.');
      onRefresh();
    }
    setLoading(false);
  };

  const filteredLogs = muckAwayLogs.filter((log) =>
    selectedJobId === 'all' ? true : log.job_id === selectedJobId
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-5 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-amber-400">Muck Away & Tipper Waste Log</h2>
          <p className="text-xs text-slate-300 mt-1">
            Log site soil clearance, inert muck loads, tonnage, and tipper ticket numbers to track cartaway expenditure.
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
            Record Tipper Load
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
              <th className="px-4 py-3">Waste Category</th>
              <th className="px-4 py-3">Ticket / Ref</th>
              <th className="px-4 py-3 text-right">Cost / Load</th>
              <th className="px-4 py-3 text-center">Loads (Est / Act)</th>
              <th className="px-4 py-3 text-right">Total Tonnage</th>
              <th className="px-4 py-3 text-right">Total Muck Cost</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-slate-400 italic">
                  No muck away loads logged for this site filter.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const job = jobs.find((j) => j.id === log.job_id);
                const actCost = log.cost_per_load * log.actual_loads;
                const diffLoads = log.actual_loads - log.estimated_loads;

                return (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                      {job?.job_code || 'N/A'}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded text-xs uppercase font-semibold bg-slate-100 border border-slate-200 text-slate-700">
                        {log.waste_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs">{log.ticket_reference || '-'}</td>
                    <td className="px-4 py-3.5 text-right font-mono">£{log.cost_per_load.toFixed(2)}</td>
                    <td className="px-4 py-3.5 text-center font-mono">
                      <span>{log.estimated_loads} / </span>
                      <span className={`font-bold ${diffLoads > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                        {log.actual_loads}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono">{log.total_tonnage} t</td>
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
              <h3 className="font-bold text-amber-400">{editingId ? 'Edit Tipper Entry' : 'Record Muck Away Load'}</h3>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Waste Type</label>
                  <select
                    value={wasteType}
                    onChange={(e) => setWasteType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  >
                    <option value="inert">Inert Soil & Stone</option>
                    <option value="non_hazardous">Non-Hazardous</option>
                    <option value="hazardous">Hazardous Waste</option>
                    <option value="green">Green / Organic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cost Per Load (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={costPerLoad}
                    onChange={(e) => setCostPerLoad(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Est. Loads</label>
                  <input
                    type="number"
                    value={estimatedLoads}
                    onChange={(e) => setEstimatedLoads(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Actual Loads</label>
                  <input
                    type="number"
                    value={actualLoads}
                    onChange={(e) => setActualLoads(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Tonnage</label>
                  <input
                    type="number"
                    step="0.1"
                    value={totalTonnage}
                    onChange={(e) => setTotalTonnage(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ticket Reference Number / Scan</label>
                <input
                  type="text"
                  placeholder="e.g. TK-889123 / Weighbridge Slip #4"
                  value={ticketReference}
                  onChange={(e) => setTicketReference(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
                <div className="mt-2 flex items-center gap-2">
                  <label className="cursor-pointer text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-lg border border-slate-300 inline-flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    {uploading ? 'Uploading...' : 'Upload Tipper Ticket Scan'}
                    <input type="file" accept="image/*,.pdf" onChange={handleTicketUpload} className="hidden" />
                  </label>
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
                  disabled={loading || uploading}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-amber-400 text-slate-950 hover:bg-amber-500 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingId ? 'Update Muck Entry' : 'Save Muck Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}