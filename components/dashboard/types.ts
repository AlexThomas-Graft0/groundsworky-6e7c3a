export interface ClientRow {
  id: string;
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
}

export interface JobRow {
  id: string;
  client_id: string | null;
  job_code: string;
  name: string;
  location: string | null;
  contract_value: number;
  status: 'quoted' | 'active' | 'completed' | 'on_hold';
  start_date: string | null;
  target_completion_date: string | null;
  created_at: string;
}

export interface PlantLogRow {
  id: string;
  job_id: string | null;
  item_description: string;
  category: 'excavator' | 'dumper' | 'roller' | 'compactor' | 'other';
  hire_type: 'hired_in' | 'owned';
  daily_rate: number;
  estimated_days: number;
  actual_days: number;
  notes: string | null;
  created_at: string;
}

export interface MaterialLogRow {
  id: string;
  job_id: string | null;
  item_name: string;
  category: 'aggregates' | 'concrete' | 'drainage' | 'reinforcement' | 'sundries';
  unit_type: string;
  unit_cost: number;
  estimated_qty: number;
  actual_qty: number;
  supplier: string | null;
  created_at: string;
}

export interface LabourLogRow {
  id: string;
  job_id: string | null;
  worker_or_role: string;
  rate_type: 'day_rate' | 'hourly';
  rate_amount: number;
  estimated_units: number;
  actual_units: number;
  date_logged: string;
  created_at: string;
}

export interface MuckAwayLogRow {
  id: string;
  job_id: string | null;
  waste_type: 'inert' | 'non_hazardous' | 'hazardous' | 'green';
  cost_per_load: number;
  estimated_loads: number;
  actual_loads: number;
  total_tonnage: number;
  ticket_reference: string | null;
  created_at: string;
}

export interface JobFinancialSummary {
  job: JobRow;
  clientName: string;
  plantCostEst: number;
  plantCostAct: number;
  materialCostEst: number;
  materialCostAct: number;
  labourCostEst: number;
  labourCostAct: number;
  muckCostEst: number;
  muckCostAct: number;
  totalCostEst: number;
  totalCostAct: number;
  netProfit: number;
  marginPct: number;
  riskStatus: 'ON TARGET' | 'MARGIN WARNING' | 'OVER BUDGET';
}