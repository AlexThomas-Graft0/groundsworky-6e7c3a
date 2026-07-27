'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ClientRow } from './types';

interface ClientsManagerProps {
  clients: ClientRow[];
  onRefresh: () => void;
}

export default function ClientsManager({ clients, onRefresh }: ClientsManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const openCreateModal = () => {
    setEditingId(null);
    setCompanyName('');
    setContactName('');
    setEmail('');
    setPhone('');
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (client: ClientRow) => {
    setEditingId(client.id);
    setCompanyName(client.company_name);
    setContactName(client.contact_name || '');
    setEmail(client.email || '');
    setPhone(client.phone || '');
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setCompanyName('');
    setContactName('');
    setEmail('');
    setPhone('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setErrorMsg('Company Name is required.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const payload = {
      company_name: companyName.trim(),
      contact_name: contactName.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
    };

    if (editingId) {
      const { error } = await supabase
        .from('clients')
        .update(payload)
        .eq('id', editingId);

      if (error) {
        setErrorMsg(`Failed to update client: ${error.message}`);
      } else {
        setSuccessMsg('Client updated successfully.');
        closeModal();
        onRefresh();
      }
    } else {
      const { error } = await supabase.from('clients').insert([payload]);

      if (error) {
        setErrorMsg(`Failed to add client: ${error.message}`);
      } else {
        setSuccessMsg('New client added successfully.');
        closeModal();
        onRefresh();
      }
    }
    setLoading(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will remove associated jobs.`)) {
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const { error } = await supabase.from('clients').delete().eq('id', id);

    if (error) {
      setErrorMsg(`Failed to delete client: ${error.message}`);
    } else {
      setSuccessMsg('Client deleted successfully.');
      onRefresh();
    }
    setLoading(false);
  };

  const filteredClients = clients.filter(
    (c) =>
      c.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.contact_name && c.contact_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-5 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-amber-400">Clients & Developers Directory</h2>
          <p className="text-xs text-slate-300 mt-1">
            Manage housebuilders, main contractors, and commercial client contacts across South Wales.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search clients..."
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
            Add Client
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
              <th className="px-5 py-3">Company Name</th>
              <th className="px-5 py-3">Contact Person</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Phone</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredClients.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate-400 italic">
                  No clients found. Click "Add Client" to register a new developer or contractor.
                </td>
              </tr>
            ) : (
              filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-slate-900">{client.company_name}</td>
                  <td className="px-5 py-3.5">{client.contact_name || <span className="text-slate-400 italic">N/A</span>}</td>
                  <td className="px-5 py-3.5 font-mono text-xs">{client.email || <span className="text-slate-400 italic">N/A</span>}</td>
                  <td className="px-5 py-3.5 font-mono text-xs">{client.phone || <span className="text-slate-400 italic">N/A</span>}</td>
                  <td className="px-5 py-3.5 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(client)}
                      className="px-2.5 py-1 text-xs font-semibold rounded text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(client.id, client.company_name)}
                      disabled={loading}
                      className="px-2.5 py-1 text-xs font-semibold rounded text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-amber-400">{editingId ? 'Edit Client' : 'Add New Client'}</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-white text-lg">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Redrow Homes South Wales"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Name</label>
                <input
                  type="text"
                  placeholder="e.g. Gareth Thomas (Commercial Manager)"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="gareth@redrow.co.uk"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="01685 881234"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
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
                  {loading ? 'Saving...' : editingId ? 'Update Client' : 'Create Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}