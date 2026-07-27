'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { MaterialLogRow, JobRow } from './types';

interface MaterialLogsManagerProps {
  materialLogs: MaterialLogRow[];
  jobs: JobRow[];
  onRefresh: () => void;
}

export default function MaterialLogsManager({ materialLogs, jobs, onRefresh }: MaterialLogsManagerProps) {
  const [selectedJobId, setSelectedJobId] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [jobId, setJobId] = useState('');
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState<'aggregates' | 'concrete' | 'drainage' | 'reinforcement' | 'sundries'>('aggregates');
  const [unitType, setUnitType] = useState('tonnes');
  const [unitCost, setUnitCost] = useState<number>(24);
  const [estimatedQty, setEstimatedQty] = useState<number>(100);
  const [actualQty, setActualQty] = useState<number>(100);
  const [supplier, setSupplier] = useState('');

  const openCreateModal = () => {
    setEditingId(null);
    setJobId(jobs[0]?.id || '');
    setItemName('Type 1 MOT Sub-base Aggregate');
    setCategory('aggregates');
    setUnitType('tonnes');
    setUnitCost(24.5);
    setEstimatedQty(120);
    setActualQty(120);
    setSupplier('Tarmac / CEMEX');
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (log: MaterialLogRow) => {
    setEditingId(log.id);
    setJobId(log.job_id || '');
    setItemName(log.item_name);
    setCategory(log.category);
    setUnitType(log.unit_type);
    setUnitCost(log.unit_cost);
    setEstimatedQty(log.estimated_qty);
    setActualQty(log.actual_qty);
    setSupplier(log.supplier || '');
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
    if (!itemName.trim() || !jobId) {
      setErrorMsg('Please select a job site and enter material name.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const payload = {
      job_id: jobId,
      item_name: itemName.trim(),
      category: category,
      unit_type: unitType.trim() || 'tonnes',
      unit_cost: Number(unitCost) || 0,
      estimated_qty: Number(estimatedQty) || 0,
      actual_qty: Number(actualQty) || 0,
      supplier: supplier.trim() || null,
    };

    if (editingId) {
      const { error } = await supabase.from('material_logs').update(payload).eq('id', editingId);
      if (error) {
        setErrorMsg(`Failed to update material log: ${error.message}`);
      } else {
        setSuccessMsg('Material entry updated.');
        closeModal();
        onRefresh();
      }
    } else {
      const { error } = await supabase.from('material_logs').insert([payload]);
      if (error) {
        setErrorMsg(`Failed to add material log: ${error.message}`);
      } else {
        setSuccessMsg('New site material delivery logged.');
        closeModal();
        onRefresh();
      }
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this material log?')) return;

    setLoading(true);
    const { error } = await supabase.from('material_logs').delete().eq('id', id);
    if (error) {
      setErrorMsg(`Failed to delete material log: ${error.message}`);
    } else {
      setSuccessMsg('Material log removed.');
      onRefresh();
    }
    setLoading(false);
  };

  const filteredLogs = materialLogs.filter((log) =>
    selectedJobId === 'all' ? true : log.job_id === selectedJobId
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-5 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-amber-400">Site Materials Tracker</h2>
          <p className="text-xs text-slate-300 mt-1">
            Log deliveries of aggregates, ready-mix concrete, drainage pipes & mesh to compare estimated vs actual quantities.
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
            Log Delivery
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
              <th className="px-4 py-3">Material Item</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3 text-right">Unit Cost</th>
              <th className="px-4 py-3 text-center">Qty (Est / Act)</th>
              <th className="px-4 py-3 text-right">Supplier</th>
              <th className="px-4 py-3 text-right">Total Cost</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-slate-400 italic">
                  No materials logged for this site filter.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const job = jobs.find((j) => j.id === log.job_id);
                const actCost = log.unit_cost * log.actual_qty;
                const diffQty = log.actual_qty - log.estimated_qty;

                return (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                      {job?.job_code || 'N/A'}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900">{log.item_name}</td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded text-xs uppercase font-semibold bg-slate-100 border border-slate-200 text-slate-700">
                        {log.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono">£{log.unit_cost.toFixed(2)} / {log.unit_type}</td>
                    <td className="px-4 py-3.5 text-center font-mono">
                      <span>{log.estimated_qty} / </span>
                      <span className={`font-bold ${diffQty > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                        {log.actual_qty} {log.unit_type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium">{log.supplier || '-'}</td>
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
              <h3 className="font-bold text-amber-400">{editingId ? 'Edit Material Entry' : 'Log Material Delivery'}</h3>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. C35 Ready-Mix Concrete"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  >
                    <option value="aggregates">Aggregates</option>
                    <option value="concrete">Concrete</option>
                    <option value="drainage">Drainage Pipe</option>
                    <option value="reinforcement">Reinforcement Mesh/Steel</option>
                    <option value="sundries">Sundries & Tools</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier</label>
                  <input
                    type="text"
                    placeholder="e.g. Marshalls / Tarmac"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Type</label>
                  <input
                    type="text"
                    placeholder="tonnes, m3, metres"
                    value={unitType}
                    onChange={(e) => setUnitType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Cost (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={unitCost}
                    onChange={(e) => setUnitCost(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Est. Qty</label>
                  <input
                    type="number"
                    step="0.1"
                    value={estimatedQty}
                    onChange={(e) => setEstimatedQty(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Actual Delivered Qty</label>
                <input
                  type="number"
                  step="0.1"
                  value={actualQty}
                  onChange={(e) => setActualQty(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
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
                  {loading ? 'Saving...' : editingId ? 'Update Material Entry' : 'Save Material Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}