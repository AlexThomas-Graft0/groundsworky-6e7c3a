'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import {
  ClientRow,
  JobRow,
  PlantLogRow,
  MaterialLogRow,
  LabourLogRow,
  MuckAwayLogRow,
  JobFinancialSummary,
} from '@/components/dashboard/types';

import ClientsManager from '@/components/dashboard/ClientsManager';
import JobsManager from '@/components/dashboard/JobsManager';
import PlantLogsManager from '@/components/dashboard/PlantLogsManager';
import MaterialLogsManager from '@/components/dashboard/MaterialLogsManager';
import LabourLogsManager from '@/components/dashboard/LabourLogsManager';
import MuckAwayLogsManager from '@/components/dashboard/MuckAwayLogsManager';

export default function DashboardPage() {
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

  // Calculate live financial summaries for every job
  const [jobSummaries, setJobSummaries] = useState<JobFinancialSummary[]>([]);