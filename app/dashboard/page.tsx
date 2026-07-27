'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import {
  ClientRow,
  JobRow,
  PlantLogRow,
  MaterialLogRow,
  LabourLogRow,
  MuckAwayLogRow,
} from '@/components/dashboard/types';

import ClientsManager from '@/components/dashboard/ClientsManager';
import JobsManager from '@/components/dashboard/JobsManager';
import PlantLogsManager from '@/components/dashboard/PlantLogsManager';
import MaterialLogsManager from '@/components/dashboard/MaterialLogsManager';
import LabourLogsManager from '@/components/dashboard/LabourLogsManager';
import MuckAwayLogsManager from '@/components/dashboard/MuckAwayLogsManager';

export interface DashboardJobSummary {
  job_id: string;
  site_name: string;
  client_name: string;
  quoted_price: number;
  plant_cost: number;
  material_cost: number;
  labour_cost: number;
  muck_cost: number;
  total_cost: number;
  profit: number;
  margin_pct: number;
  status: string;
}

function DashboardContent() {
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'clients' | 'plant' | 'materials' | 'labour' | 'muck'>('overview');

  // Data States
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [clients, setClients] = useState<ClientRow[]>([]);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [plantLogs, setPlantLogs] = useState<PlantLogRow[]>([]);
  const [materialLogs, setMaterialLogs] = useState<MaterialLogRow[]>([]);
  const [labourLogs, setLabourLogs] = useState<LabourLogRow[]>([]);
  const [muckAwayLogs, setMuckAwayLogs] = useState<MuckAwayLogRow[]>([]);

  // Live financial summaries
  const [jobSummaries, setJobSummaries] = useState<DashboardJobSummary[]>([]);

  const fetchData = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [clientsRes, jobsRes, plantRes, matRes, labRes, muckRes] = await Promise.all([
        supabase.from('clients').select('*'),
        supabase.from('jobs').select('*'),
        supabase.from('plant_logs').select('*'),
        supabase.from('material_logs').select('*'),
        supabase.from('labour_logs').select('*'),
        supabase.from('muck_away_logs').select('*'),
      ]);

      const clientsData = (clientsRes.data as ClientRow[]) || [];
      const jobsData = (jobsRes.data as JobRow[]) || [];
      const plantData = (plantRes.data as PlantLogRow[]) || [];
      const matData = (matRes.data as MaterialLogRow[]) || [];
      const labData = (labRes.data as LabourLogRow[]) || [];
      const muckData = (muckRes.data as MuckAwayLogRow[]) || [];

      setClients(clientsData);
      setJobs(jobsData);
      setPlantLogs(plantData);
      setMaterialLogs(matData);
      setLabourLogs(labData);
      setMuckAwayLogs(muckData);

      calculateSummaries(jobsData, clientsData, plantData, matData, labData, muckData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch data';
      console.error('Fetch error:', err);
      setFetchError(msg);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummaries = (
    jobsList: any[],
    clientsList: any[],
    plantList: any[],
    matList: any[],
    labList: any[],
    muckList: any[]
  ) => {
    const clientMap = new Map<string, string>();
    clientsList.forEach((c) => {
      clientMap.set(c.id, c.name || c.company_name || 'Unknown Client');
    });

    const summaries: DashboardJobSummary[] = jobsList.map((job) => {
      const jId = String(job.id || '');
      const quoted = Number(job.quoted_price || job.contract_value || job.quote_amount || 0);

      const plantCost = plantList
        .filter((p) => p.job_id === jId)
        .reduce((sum, p) => sum + Number(p.total_cost || p.cost || (Number(p.hire_rate || 0) * Number(p.days || 1)) || 0), 0);

      const materialCost = matList
        .filter((m) => m.job_id === jId)
        .reduce((sum, m) => sum + Number(m.total_cost || (Number(m.quantity || 0) * Number(m.unit_cost || 0)) || 0), 0);

      const labourCost = labList
        .filter((l) => l.job_id === jId)
        .reduce((sum, l) => sum + Number(l.total_cost || (Number(l.hours_worked || l.hours || 0) * Number(l.hourly_rate || l.rate || 0)) || 0), 0);

      const muckCost = muckList
        .filter((m) => m.job_id === jId)
        .reduce((sum, m) => sum + Number(m.total_cost || (Number(m.loads || 0) * Number(m.rate_per_load || m.rate || 0)) || 0), 0);

      const totalCost = plantCost + materialCost + labourCost + muckCost;
      const profit = quoted - totalCost;
      const marginPct = quoted > 0 ? (profit / quoted) * 100 : 0;

      return {
        job_id: jId,
        site_name: job.site_name || job.title || job.name || 'Unnamed Site',
        client_name: clientMap.get(job.client_id) || 'Unassigned Client',
        quoted_price: quoted,
        plant_cost: plantCost,
        material_cost: materialCost,
        labour_cost: labourCost,
        muck_cost: muckCost,
        total_cost: totalCost,
        profit,
        margin_pct: marginPct,
        status: job.status || 'Active',
      };
    });

    setJobSummaries(summaries);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalQuotedAll = jobSummaries.reduce((acc, curr) => acc + curr.quoted_price, 0);
  const totalCostAll = jobSummaries.reduce((acc, curr) => acc + curr.total_cost, 0);
  const totalProfitAll = totalQuotedAll - totalCostAll;
  const overallMarginAll = totalQuotedAll > 0 ? (totalProfitAll / totalQuotedAll) * 100 : 0;

  const formatGBP = (val: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 text-white p-2 rounded-lg font-bold text-xl">
              GW
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Groundsworky</h1>
              <p className="text-xs text-slate-400">Groundworks Site Cost & Margin Tracker</p>
            </div>
          </div>
          <button
            onClick={fetchData}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm rounded-md border border-slate-700 transition flex items-center gap-2"
          >
            <span>↻ Refresh Data</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-6 flex overflow-x-auto gap-2 pb-2">
          {[
            { id: 'overview', label: '📊 Financial Overview' },
            { id: 'jobs', label: '🏗️ Sites & Jobs' },
            { id: 'clients', label: '🏢 Clients' },
            { id: 'plant', label: '🚜 Plant Hire' },
            { id: 'materials', label: '🧱 Materials' },
            { id: 'labour', label: '👷 Labour' },
            { id: 'muck', label: '🚛 Muck Away' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {fetchError && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm flex justify-between items-center">
            <span>Database connection notice: {fetchError}. Standard view loaded.</span>
            <button
              onClick={fetchData}
              className="ml-4 underline hover:text-amber-900"
            >
              Retry
            </button>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Quoted Value</span>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatGBP(totalQuotedAll)}</p>
                <p className="text-xs text-gray-500 mt-1">{jobSummaries.length} active sites</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Actual Costs</span>
                <p className="text-2xl font-bold text-red-600 mt-1">{formatGBP(totalCostAll)}</p>
                <p className="text-xs text-gray-500 mt-1">Plant, materials, labour & muck away</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Gross Profit</span>
                <p className={`text-2xl font-bold mt-1 ${totalProfitAll >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatGBP(totalProfitAll)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Quoted minus actual costs</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Overall Margin</span>
                <p className={`text-2xl font-bold mt-1 ${overallMarginAll >= 20 ? 'text-emerald-600' : overallMarginAll >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
                  {overallMarginAll.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">Target margin: 20%+</p>
              </div>
            </div>

            {/* Detailed Financial Summary Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900">Site Margin Breakdown</h2>
                <span className="text-xs text-gray-500">Real-time cost tracking</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3">Site / Job</th>
                      <th className="px-6 py-3">Client</th>
                      <th className="px-6 py-3 text-right">Quoted</th>
                      <th className="px-6 py-3 text-right">Plant</th>
                      <th className="px-6 py-3 text-right">Materials</th>
                      <th className="px-6 py-3 text-right">Labour</th>
                      <th className="px-6 py-3 text-right">Muck Away</th>
                      <th className="px-6 py-3 text-right">Total Cost</th>
                      <th className="px-6 py-3 text-right">Profit</th>
                      <th className="px-6 py-3 text-right">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={10} className="text-center py-8 text-gray-500">
                          Loading site financial summaries...
                        </td>
                      </tr>
                    ) : jobSummaries.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="text-center py-8 text-gray-500">
                          No jobs found. Add a job in the Sites & Jobs tab to begin tracking.
                        </td>
                      </tr>
                    ) : (
                      jobSummaries.map((summary) => (
                        <tr key={summary.job_id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 font-semibold text-gray-900">{summary.site_name}</td>
                          <td className="px-6 py-4 text-gray-600">{summary.client_name}</td>
                          <td className="px-6 py-4 text-right font-medium text-gray-900">{formatGBP(summary.quoted_price)}</td>
                          <td className="px-6 py-4 text-right text-gray-600">{formatGBP(summary.plant_cost)}</td>
                          <td className="px-6 py-4 text-right text-gray-600">{formatGBP(summary.material_cost)}</td>
                          <td className="px-6 py-4 text-right text-gray-600">{formatGBP(summary.labour_cost)}</td>
                          <td className="px-6 py-4 text-right text-gray-600">{formatGBP(summary.muck_cost)}</td>
                          <td className="px-6 py-4 text-right font-semibold text-gray-900">{formatGBP(summary.total_cost)}</td>
                          <td className={`px-6 py-4 text-right font-bold ${summary.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {formatGBP(summary.profit)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              summary.margin_pct >= 20
                                ? 'bg-emerald-100 text-emerald-800'
                                : summary.margin_pct >= 0
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {summary.margin_pct.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'jobs' && <JobsManager jobs={jobs} clients={clients} summaries={jobSummaries} onRefresh={fetchData} />}
        {activeTab === 'clients' && <ClientsManager clients={clients} onRefresh={fetchData} />}
        {activeTab === 'plant' && <PlantLogsManager plantLogs={plantLogs} jobs={jobs} onRefresh={fetchData} />}
        {activeTab === 'materials' && <MaterialLogsManager materialLogs={materialLogs} jobs={jobs} onRefresh={fetchData} />}
        {activeTab === 'labour' && <LabourLogsManager labourLogs={labourLogs} jobs={jobs} onRefresh={fetchData} />}
        {activeTab === 'muck' && <MuckAwayLogsManager muckAwayLogs={muckAwayLogs} jobs={jobs} onRefresh={fetchData} />}
      </main>

      <footer className="mt-12 border-t border-gray-200 bg-white py-6 text-center text-xs text-gray-500">
        <p>Groundsworky Internal Cost & Margin Dashboard</p>
      </footer>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}