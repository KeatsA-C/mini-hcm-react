import { auth } from '../config/firebase';
import { API_BASE_URL } from '../config/env';

// ─── Shared helper ────────────────────────────────────────────────────────────

async function getToken(): Promise<string> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Not authenticated');
  return token;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PunchMetrics {
  workDate: string;
  regularHours: number;
  overtimeHours: number;
  nightDiffHours: number;
  lateMinutes: number;
  undertimeMinutes: number;
  totalWorkedHours: number;
}

export interface PunchInResponse {
  message: string;
  id: string;
  punchIn: string;
}

export interface PunchOutResponse {
  message: string;
  id: string;
  punchOut: string;
  metrics: PunchMetrics;
}

export interface AttendanceRecord {
  id: string;
  uid: string;
  punchIn: string;
  punchOut: string | null;
  metrics?: PunchMetrics;
  createdAt: string;
  adminEdited: boolean;
}

export interface DailySummary {
  uid: string;
  workDate: string;
  regularHours: number;
  overtimeHours: number;
  nightDiffHours: number;
  lateMinutes: number;
  undertimeMinutes: number;
  totalWorkedHours: number;
  punches: { attendanceId: string; punchIn: string; punchOut: string }[];
  updatedAt: string;
}

export interface WeeklySummaryTotals {
  regularHours: number;
  overtimeHours: number;
  nightDiffHours: number;
  lateMinutes: number;
  undertimeMinutes: number;
  totalWorkedHours: number;
}

export interface WeeklySummary {
  uid: string;
  startDate: string;
  endDate: string;
  totals: WeeklySummaryTotals;
  days: DailySummary[];
}

export interface PunchStatus {
  isPunchedIn: boolean;
  currentPunch: {
    id: string;
    punchIn: string;
    punchOut: string | null;
  } | null;
}

// ─── API calls ────────────────────────────────────────────────────────────────

/** POST /api/attendance/punch-in */
export async function punchIn(): Promise<PunchInResponse> {
  const token = await getToken();
  const res = await fetch(`${API_BASE_URL}/api/attendance/punch-in`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const text = await res.text();
    let msg = `Punch-in failed (${res.status})`;
    try {
      msg = JSON.parse(text)?.message ?? msg;
    } catch {
      msg = text || msg;
    }
    console.error('[punch-in error]', text);
    throw new Error(msg);
  }
  return res.json() as Promise<PunchInResponse>;
}

/** POST /api/attendance/punch-out */
export async function punchOut(): Promise<PunchOutResponse> {
  const token = await getToken();
  const res = await fetch(`${API_BASE_URL}/api/attendance/punch-out`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const text = await res.text();
    let msg = `Punch-out failed (${res.status})`;
    try {
      msg = JSON.parse(text)?.message ?? msg;
    } catch {
      msg = text || msg;
    }
    console.error('[punch-out error]', text);
    throw new Error(msg);
  }
  return res.json() as Promise<PunchOutResponse>;
}

/** GET /api/attendance/status */
export async function fetchPunchStatus(): Promise<PunchStatus> {
  const token = await getToken();
  const res = await fetch(`${API_BASE_URL}/api/attendance/status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message ?? `Failed to fetch punch status (${res.status})`);
  return data as PunchStatus;
}

/** GET /api/attendance/history */
export async function fetchAttendanceHistory(params?: {
  startDate?: string;
  endDate?: string;
}): Promise<AttendanceRecord[]> {
  const token = await getToken();
  const qs = new URLSearchParams();
  if (params?.startDate) qs.set('startDate', params.startDate);
  if (params?.endDate) qs.set('endDate', params.endDate);
  const url = `${API_BASE_URL}/api/attendance/history${qs.toString() ? `?${qs}` : ''}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message ?? `Failed to fetch history (${res.status})`);
  return data as AttendanceRecord[];
}

/** GET /api/attendance/summary/daily */
export async function fetchDailySummary(date?: string): Promise<DailySummary> {
  const token = await getToken();
  const qs = date ? `?date=${date}` : '';
  const res = await fetch(`${API_BASE_URL}/api/attendance/summary/daily${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message ?? `Failed to fetch daily summary (${res.status})`);
  return data as DailySummary;
}

/** GET /api/attendance/summary/weekly */
export async function fetchWeeklySummary(params?: {
  startDate?: string;
  endDate?: string;
}): Promise<WeeklySummary> {
  const token = await getToken();
  const qs = new URLSearchParams();
  if (params?.startDate) qs.set('startDate', params.startDate);
  if (params?.endDate) qs.set('endDate', params.endDate);
  const url = `${API_BASE_URL}/api/attendance/summary/weekly${qs.toString() ? `?${qs}` : ''}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message ?? `Failed to fetch weekly summary (${res.status})`);
  return data as WeeklySummary;
}
