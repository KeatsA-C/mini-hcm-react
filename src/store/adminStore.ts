import { auth } from '../config/firebase';
import { API_BASE_URL } from '../config/env';
import type { AttendanceRecord } from './attendanceStore';

// ─── Shared helper ────────────────────────────────────────────────────────────

async function getToken(): Promise<string> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Not authenticated');
  return token;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserSummary {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  timezone: string;
  role: string;
  schedule: { start: string; end: string };
  createdAt: string;
}

export interface AdminDailyEntry {
  uid: string;
  workDate: string;
  regularHours: number;
  overtimeHours: number;
  nightDiffHours: number;
  lateMinutes: number;
  undertimeMinutes: number;
  totalWorkedHours: number;
  punches: { attendanceId: string; punchIn: string; punchOut: string | null }[];
  employee: {
    firstName: string;
    lastName: string;
    department: string;
    position: string;
  };
}

export interface AdminDailyReport {
  date: string;
  count: number;
  data: AdminDailyEntry[];
}

export interface AdminWeeklyEntry {
  uid: string;
  totals: {
    regularHours: number;
    overtimeHours: number;
    nightDiffHours: number;
    lateMinutes: number;
    undertimeMinutes: number;
    totalWorkedHours: number;
  };
  employee: {
    firstName: string;
    lastName: string;
    department: string;
    position: string;
  };
  days: AdminDailyEntry[];
}

export interface AdminWeeklyReport {
  startDate: string;
  endDate: string;
  count: number;
  data: AdminWeeklyEntry[];
}

export interface UpdatePunchPayload {
  punchIn?: string;
  punchOut?: string;
}

export interface UpdatePunchResponse {
  message: string;
  id: string;
  punchIn: string;
  punchOut: string | null;
  metrics: {
    workDate: string;
    regularHours: number;
    overtimeHours: number;
    nightDiffHours: number;
    lateMinutes: number;
    undertimeMinutes: number;
    totalWorkedHours: number;
  };
  adminEdited: boolean;
}

// ─── API calls ────────────────────────────────────────────────────────────────

/** GET /api/user/all  (admin / superadmin) */
export async function fetchAllUsers(): Promise<UserSummary[]> {
  const token = await getToken();
  const res = await fetch(`${API_BASE_URL}/api/user/all`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message ?? `Failed to fetch users (${res.status})`);
  return data as UserSummary[];
}

/** GET /api/admin/reports/daily  (admin / superadmin) */
export async function fetchAdminDailyReport(date?: string): Promise<AdminDailyReport> {
  const token = await getToken();
  const qs = date ? `?date=${date}` : '';
  const res = await fetch(`${API_BASE_URL}/api/admin/reports/daily${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message ?? `Failed to fetch daily report (${res.status})`);
  return data as AdminDailyReport;
}

/** GET /api/admin/reports/weekly  (admin / superadmin) */
export async function fetchAdminWeeklyReport(params?: {
  startDate?: string;
  endDate?: string;
}): Promise<AdminWeeklyReport> {
  const token = await getToken();
  const qs = new URLSearchParams();
  if (params?.startDate) qs.set('startDate', params.startDate);
  if (params?.endDate) qs.set('endDate', params.endDate);
  const url = `${API_BASE_URL}/api/admin/reports/weekly${qs.toString() ? `?${qs}` : ''}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message ?? `Failed to fetch weekly report (${res.status})`);
  return data as AdminWeeklyReport;
}

/** GET /api/admin/punches/:uid  (admin / superadmin) */
export async function fetchUserPunches(
  uid: string,
  params?: { startDate?: string; endDate?: string },
): Promise<AttendanceRecord[]> {
  const token = await getToken();
  const qs = new URLSearchParams();
  if (params?.startDate) qs.set('startDate', params.startDate);
  if (params?.endDate) qs.set('endDate', params.endDate);
  const url = `${API_BASE_URL}/api/admin/punches/${uid}${qs.toString() ? `?${qs}` : ''}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message ?? `Failed to fetch punches (${res.status})`);
  return data as AttendanceRecord[];
}

/** PUT /api/admin/punches/:punchId  (admin / superadmin) */
export async function updatePunch(
  punchId: string,
  payload: UpdatePunchPayload,
): Promise<UpdatePunchResponse> {
  const token = await getToken();
  const res = await fetch(`${API_BASE_URL}/api/admin/punches/${punchId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message ?? `Failed to update punch (${res.status})`);
  return data as UpdatePunchResponse;
}

/** POST /api/user/grant-admin  (superadmin only) */
export async function grantAdmin(uid: string): Promise<{ message: string }> {
  const token = await getToken();
  const res = await fetch(`${API_BASE_URL}/api/user/grant-admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ uid }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message ?? `Failed to grant admin (${res.status})`);
  return data as { message: string };
}

/** POST /api/user/revoke-admin  (superadmin only) */
export async function revokeAdmin(uid: string): Promise<{ message: string }> {
  const token = await getToken();
  const res = await fetch(`${API_BASE_URL}/api/user/revoke-admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ uid }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message ?? `Failed to revoke admin (${res.status})`);
  return data as { message: string };
}
