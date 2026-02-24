import { useState, useEffect, useCallback, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Clock,
  TrendingUp,
  Moon,
  AlertTriangle,
  Calendar,
  Search,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Save,
  X,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Loader2,
  ShieldCheck,
  ShieldOff,
} from 'lucide-react';
import StatCard from '../components/admin/StatCard';
import {
  fetchAdminDailyReport,
  fetchAdminWeeklyReport,
  fetchUserPunches as fetchUserPunchesAPI,
  fetchAllUsers,
  updatePunch,
  grantAdmin,
  revokeAdmin,
  assignSchedule,
  type AdminDailyEntry,
  type AdminWeeklyEntry,
  type UserSummary,
} from '../store/adminStore';
import { fetchUserDetails } from '../store/authStore';
import { DEPARTMENTS } from '../data/departments';
import type { AttendanceRecord } from '../store/attendanceStore';

type TabKey = 'daily' | 'weekly' | 'punches' | 'users';

type DisplayStatus = 'complete' | 'incomplete' | 'absent';

interface DailyDisplayRow {
  uid: string;
  name: string;
  department: string;
  shift: string;
  timeIn: string | null;
  timeOut: string | null;
  regular: number;
  ot: number;
  nd: number;
  lateMin: number;
  undertimeMin: number;
  status: DisplayStatus;
}

function fmtHr(h: number) {
  return h === 0 ? '—' : `${h.toFixed(2)}h`;
}

function fmtMin(m: number) {
  if (m === 0) return '—';
  const h = Math.floor(m / 60);
  const min = m % 60;
  return h > 0 ? `${h}h ${min}m` : `${min}m`;
}

function toZonedHHMM(iso: string, timezone?: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone || 'UTC',
  });
}

/**
 * Rebuild a UTC ISO string by replacing the time portion with newHHMM
 * expressed in the given timezone. Without a timezone the old UTC-direct
 * behaviour is preserved (fallback only).
 */
function rebuildISO(originalISO: string, newHHMM: string, timezone?: string): string {
  const [h, m] = newHHMM.split(':').map(Number);
  if (!timezone) {
    const base = new Date(originalISO);
    base.setUTCHours(h, m, 0, 0);
    return base.toISOString();
  }
  // Get the date portion as seen in the target timezone (YYYY-MM-DD)
  const localDate = new Date(originalISO).toLocaleDateString('en-CA', { timeZone: timezone });
  // Build a candidate by naively treating h:m as UTC
  const candidate = new Date(
    `${localDate}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00.000Z`,
  );
  // Determine what hour:min the timezone actually shows for that candidate
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(candidate);
  const tzH = parseInt(parts.find((p) => p.type === 'hour')!.value.replace('24', '0'));
  const tzM = parseInt(parts.find((p) => p.type === 'minute')!.value);
  // Shift candidate so that timezone shows the intended h:m
  const diffMs = ((h - tzH) * 60 + (m - tzM)) * 60 * 1000;
  return new Date(candidate.getTime() + diffMs).toISOString();
}

function getWeekDates(ref: Date): { start: string; end: string } {
  const day = ref.getDay();
  const mon = new Date(ref);
  mon.setDate(ref.getDate() - (day === 0 ? 6 : day - 1));
  mon.setHours(0, 0, 0, 0);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return { start: mon.toISOString().slice(0, 10), end: sun.toISOString().slice(0, 10) };
}

const statusConfig: Record<
  DisplayStatus,
  { label: string; icon: React.ReactElement; cls: string }
> = {
  complete: {
    label: 'Complete',
    icon: <CheckCircle2 size={12} />,
    cls: 'text-green-400 bg-green-500/10 border-green-500/20',
  },
  incomplete: {
    label: 'Incomplete',
    icon: <MinusCircle size={12} />,
    cls: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  },
  absent: {
    label: 'Absent',
    icon: <XCircle size={12} />,
    cls: 'text-red-400 bg-red-500/10 border-red-500/20',
  },
};

function Th({ children, right = false }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th
      className={`px-4 py-3 font-mono text-[10px] text-neutral-500 tracking-widest uppercase whitespace-nowrap ${right ? 'text-right' : 'text-left'}`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  right = false,
  muted = false,
}: {
  children: React.ReactNode;
  right?: boolean;
  muted?: boolean;
}) {
  return (
    <td
      className={`px-4 py-3.5 font-mono text-[12px] whitespace-nowrap ${right ? 'text-right' : ''} ${muted ? 'text-neutral-600' : 'text-neutral-300'}`}
    >
      {children}
    </td>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [tab, setTab] = useState<TabKey>('daily');
  const [search, setSearch] = useState('');

  const [dailyDate, setDailyDate] = useState(new Date().toISOString().slice(0, 10));
  const [dailyReport, setDailyReport] = useState<AdminDailyEntry[]>([]);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [dailyError, setDailyError] = useState<string | null>(null);

  const [weekDates, setWeekDates] = useState(() => getWeekDates(new Date()));
  const [weeklyReport, setWeeklyReport] = useState<AdminWeeklyEntry[]>([]);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [weeklyError, setWeeklyError] = useState<string | null>(null);

  const [allUsers, setAllUsers] = useState<UserSummary[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const [currentRole, setCurrentRole] = useState<string>('');

  const [roleToggling, setRoleToggling] = useState<Record<string, boolean>>({});
  const [roleError, setRoleError] = useState<string | null>(null);

  const [selectedUserId, setSelectedUserId] = useState('');
  const [userPunches, setUserPunches] = useState<AttendanceRecord[]>([]);
  const [punchesLoading, setPunchesLoading] = useState(false);
  const [punchesError, setPunchesError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPunchIn, setEditPunchIn] = useState('');
  const [editPunchOut, setEditPunchOut] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [scheduleEditUID, setScheduleEditUID] = useState<string | null>(null);
  const [schedEditStart, setSchedEditStart] = useState('');
  const [schedEditEnd, setSchedEditEnd] = useState('');
  const [schedEditTimezone, setSchedEditTimezone] = useState('');
  const [schedSaving, setSchedSaving] = useState(false);
  const [schedError, setSchedError] = useState<string | null>(null);

  const loadDailyReport = useCallback(async (date: string) => {
    setDailyLoading(true);
    setDailyError(null);
    try {
      const res = await fetchAdminDailyReport(date);
      setDailyReport(res.data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load daily report';
      // 404 = no data for that date, not a real error
      if (!msg.includes('404')) setDailyError(msg);
      setDailyReport([]);
    } finally {
      setDailyLoading(false);
    }
  }, []);

  const loadWeeklyReport = useCallback(async (start: string, end: string) => {
    setWeeklyLoading(true);
    setWeeklyError(null);
    try {
      const res = await fetchAdminWeeklyReport({ startDate: start, endDate: end });
      setWeeklyReport(res.data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load weekly report';
      if (!msg.includes('404')) setWeeklyError(msg);
      setWeeklyReport([]);
    } finally {
      setWeeklyLoading(false);
    }
  }, []);

  const loadAllUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      setAllUsers(await fetchAllUsers());
    } catch {
      // non-critical — absent detection just won't work
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const loadUserPunches = useCallback(async (uid: string) => {
    setPunchesLoading(true);
    setPunchesError(null);
    try {
      setUserPunches(await fetchUserPunchesAPI(uid));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load punches';
      if (!msg.includes('404')) setPunchesError(msg);
      setUserPunches([]);
    } finally {
      setPunchesLoading(false);
    }
  }, []);

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    loadAllUsers();
    loadDailyReport(new Date().toISOString().slice(0, 10));
    loadWeeklyReport(getWeekDates(new Date()).start, getWeekDates(new Date()).end);
    // Fetch current viewer's role for grant/revoke gating
    fetchUserDetails()
      .then((d) => {
        if (d?.role) setCurrentRole(d.role);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadDailyReport(dailyDate);
  }, [dailyDate]);
  useEffect(() => {
    loadWeeklyReport(weekDates.start, weekDates.end);
  }, [weekDates]);
  useEffect(() => {
    if (selectedUserId) loadUserPunches(selectedUserId);
    else setUserPunches([]);
  }, [selectedUserId]);

  // ── KPIs (computed from live data) ────────────────────────────────────────

  const totalEmployees = allUsers.length;
  const present = dailyReport.length;
  const totalOT = dailyReport.reduce((s, r) => s + r.overtimeHours, 0);
  const totalND = dailyReport.reduce((s, r) => s + r.nightDiffHours, 0);
  const lateCount = dailyReport.filter((r) => r.lateMinutes > 0).length;
  const presentWithHours = dailyReport.filter((r) => r.regularHours > 0);
  const avgRegular =
    presentWithHours.length > 0
      ? presentWithHours.reduce((s, r) => s + r.regularHours, 0) / presentWithHours.length
      : 0;

  // ── Build daily display rows (present + absent) ───────────────────────────

  const dailyDisplayRows: DailyDisplayRow[] = [
    ...dailyReport.map((r): DailyDisplayRow => {
      const allPunchedOut = r.punches.every((p) => p.punchOut !== null);
      const empUser = allUsers.find((u) => u.uid === r.uid);
      const shift = empUser?.schedule;
      const empTZ = empUser?.timezone;
      const latestPunch = r.punches[r.punches.length - 1];
      return {
        uid: r.uid,
        name: `${r.employee.firstName} ${r.employee.lastName}`,
        department: r.employee.department,
        shift: shift ? `${shift.start}–${shift.end}` : '—',
        timeIn: latestPunch?.punchIn ? toZonedHHMM(latestPunch.punchIn, empTZ) : null,
        timeOut: latestPunch?.punchOut ? toZonedHHMM(latestPunch.punchOut, empTZ) : null,
        regular: r.regularHours,
        ot: r.overtimeHours,
        nd: r.nightDiffHours,
        lateMin: r.lateMinutes,
        undertimeMin: r.undertimeMinutes,
        status: allPunchedOut ? 'complete' : 'incomplete',
      };
    }),
    ...allUsers
      .filter((u) => !dailyReport.some((r) => r.uid === u.uid))
      .map(
        (u): DailyDisplayRow => ({
          uid: u.uid,
          name: `${u.firstName} ${u.lastName}`,
          department: u.department,
          shift: u.schedule ? `${u.schedule.start}–${u.schedule.end}` : '—',
          timeIn: null,
          timeOut: null,
          regular: 0,
          ot: 0,
          nd: 0,
          lateMin: 0,
          undertimeMin: 0,
          status: 'absent',
        }),
      ),
  ];

  // ── Search filtering ──────────────────────────────────────────────────────

  const q = search.toLowerCase();
  const filteredDaily = dailyDisplayRows.filter(
    (r) => r.name.toLowerCase().includes(q) || r.department.toLowerCase().includes(q),
  );
  const filteredWeekly = weeklyReport.filter(
    (r) =>
      `${r.employee.firstName} ${r.employee.lastName}`.toLowerCase().includes(q) ||
      r.employee.department.toLowerCase().includes(q),
  );

  // ── Punch edit handlers ───────────────────────────────────────────────────

  function startEdit(record: AttendanceRecord) {
    const empTZ = allUsers.find((u) => u.uid === record.uid)?.timezone;
    setEditingId(record.id);
    setEditPunchIn(toZonedHHMM(record.punchIn, empTZ));
    setEditPunchOut(record.punchOut ? toZonedHHMM(record.punchOut, empTZ) : '');
    setEditError(null);
  }

  async function saveEdit(record: AttendanceRecord) {
    const empTZ = allUsers.find((u) => u.uid === record.uid)?.timezone;
    setEditSaving(true);
    setEditError(null);
    try {
      const payload: { punchIn?: string; punchOut?: string } = {
        punchIn: rebuildISO(record.punchIn, editPunchIn, empTZ),
      };
      if (editPunchOut && record.punchOut) {
        payload.punchOut = rebuildISO(record.punchOut, editPunchOut, empTZ);
      }
      await updatePunch(record.id, payload);
      setEditingId(null);
      if (selectedUserId) loadUserPunches(selectedUserId);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setEditSaving(false);
    }
  }

  // ── Week navigation ───────────────────────────────────────────────────────

  function shiftWeek(dir: -1 | 1) {
    setWeekDates((prev) => {
      const d = new Date(prev.start);
      d.setDate(d.getDate() + dir * 7);
      return getWeekDates(d);
    });
  }

  function shiftDay(dir: -1 | 1) {
    const d = new Date(dailyDate);
    d.setDate(d.getDate() + dir);
    setDailyDate(d.toISOString().slice(0, 10));
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    });

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'daily', label: 'Daily Report' },
    { key: 'weekly', label: 'Weekly Report' },
    { key: 'punches', label: 'Punch Logs' },
    { key: 'users', label: 'Users' },
  ];

  // ── Schedule edit ─────────────────────────────────────────────────────────

  function startSchedEdit(u: UserSummary) {
    setScheduleEditUID(u.uid);
    setSchedEditStart(u.schedule?.start ?? '');
    setSchedEditEnd(u.schedule?.end ?? '');
    setSchedEditTimezone(u.timezone ?? '');
    setSchedError(null);
  }

  async function saveSchedule(u: UserSummary) {
    setSchedSaving(true);
    setSchedError(null);
    try {
      const payload: { schedule?: { start: string; end: string }; timezone?: string } = {};
      if (schedEditStart && schedEditEnd) {
        payload.schedule = { start: schedEditStart, end: schedEditEnd };
      }
      if (schedEditTimezone.trim()) {
        payload.timezone = schedEditTimezone.trim();
      }
      if (!payload.schedule && !payload.timezone) {
        setSchedError('Provide at least a schedule or timezone.');
        setSchedSaving(false);
        return;
      }
      const updated = await assignSchedule(u.uid, payload);
      setAllUsers((prev) =>
        prev.map((usr) =>
          usr.uid === u.uid
            ? {
                ...usr,
                schedule: updated.schedule,
                timezone: updated.timezone,
                updatedAt: updated.updatedAt,
              }
            : usr,
        ),
      );
      setScheduleEditUID(null);
    } catch (err) {
      setSchedError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSchedSaving(false);
    }
  }

  // ── Grant / Revoke admin ──────────────────────────────────────────────────

  const handleRoleToggle = async (u: UserSummary) => {
    setRoleError(null);
    setRoleToggling((prev) => ({ ...prev, [u.uid]: true }));
    try {
      if (u.role === 'admin') {
        await revokeAdmin(u.uid);
      } else {
        await grantAdmin(u.uid);
      }
      // Refresh user list to reflect new role
      setAllUsers(await fetchAllUsers());
    } catch (err) {
      setRoleError(err instanceof Error ? err.message : 'Role update failed');
    } finally {
      setRoleToggling((prev) => ({ ...prev, [u.uid]: false }));
    }
  };

  // ── Loading row helper ────────────────────────────────────────────────────

  function LoadingRow({ cols }: { cols: number }) {
    return (
      <tr>
        <td colSpan={cols} className="px-4 py-12 text-center">
          <Loader2 size={18} className="animate-spin text-neutral-600 mx-auto" />
        </td>
      </tr>
    );
  }

  function ErrorRow({ cols, message }: { cols: number; message: string }) {
    return (
      <tr>
        <td colSpan={cols} className="px-4 py-10 text-center font-mono text-[12px] text-red-500">
          {message}
        </td>
      </tr>
    );
  }

  function EmptyRow({ cols, message = 'No records found.' }: { cols: number; message?: string }) {
    return (
      <tr>
        <td
          colSpan={cols}
          className="px-4 py-12 text-center font-mono text-[12px] text-neutral-700"
        >
          {message}
        </td>
      </tr>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#141414]">
      {/* ── Sticky Header ── */}
      <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#141414]/90 backdrop-blur-md">
        <div className="max-w-screen-xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/panel')}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/[0.08] bg-white/[0.03] text-neutral-400 hover:text-neutral-200 hover:border-white/20 hover:bg-white/[0.06] transition-all duration-150 cursor-pointer"
            >
              <ArrowLeft size={14} />
            </button>
            <div className="h-5 w-px bg-white/[0.08]" />
            <div>
              <h1 className="font-sans text-[15px] font-semibold text-neutral-100 leading-none">
                Admin Dashboard
              </h1>
              <p className="font-mono text-[10px] text-neutral-600 mt-0.5 tracking-wide">{today}</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/[0.08] border border-purple-500/20 font-mono text-[10px] text-purple-400 tracking-wide">
            <Users size={10} /> Admin
          </span>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="max-w-screen-xl mx-auto px-6 py-8 space-y-8">
        {/* ── KPI Cards ── */}
        <section>
          <p className="font-mono text-[10px] text-neutral-600 tracking-widest uppercase mb-4">
            Today's Overview
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatCard
              label="Total Employees"
              value={usersLoading ? '—' : totalEmployees}
              icon={<Users />}
              accent="blue"
              sublabel="Registered"
            />
            <StatCard
              label="Present Today"
              value={dailyLoading ? '—' : present}
              icon={<CheckCircle2 />}
              accent="green"
              sublabel={dailyLoading ? '' : `${totalEmployees - present} absent`}
            />
            <StatCard
              label="Avg Regular Hrs"
              value={dailyLoading ? '—' : `${avgRegular.toFixed(2)}h`}
              icon={<Clock />}
              accent="blue"
              sublabel="Of those present"
            />
            <StatCard
              label="Total OT Hours"
              value={dailyLoading ? '—' : `${totalOT.toFixed(2)}h`}
              icon={<TrendingUp />}
              accent="amber"
              sublabel="Overtime accumulated"
            />
            <StatCard
              label="Night Diff Hrs"
              value={dailyLoading ? '—' : `${totalND.toFixed(2)}h`}
              icon={<Moon />}
              accent="purple"
              sublabel={
                dailyLoading ? '' : `${lateCount} late arrival${lateCount !== 1 ? 's' : ''}`
              }
            />
          </div>
        </section>

        {/* ── Tab Nav + Controls ── */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
            {/* Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-white/[0.03] border border-white/[0.06] w-fit">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-4 py-1.5 rounded-md font-mono text-[11px] tracking-wide transition-all duration-150 cursor-pointer ${
                    tab === t.key
                      ? 'bg-blue-500/15 border border-blue-500/30 text-blue-400'
                      : 'text-neutral-500 hover:text-neutral-300 border border-transparent'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex-1" />

            {/* Daily date navigation */}
            {tab === 'daily' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => shiftDay(-1)}
                  className="p-1.5 rounded-md border border-white/[0.08] bg-white/[0.03] text-neutral-500 hover:text-neutral-300 hover:border-white/20 transition-all duration-150 cursor-pointer"
                >
                  <ChevronLeft size={13} />
                </button>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/[0.08] bg-white/[0.03]">
                  <Calendar size={12} className="text-neutral-500" />
                  <input
                    type="date"
                    value={dailyDate}
                    onChange={(e) => setDailyDate(e.target.value)}
                    className="font-mono text-[11px] text-neutral-400 bg-transparent outline-none cursor-pointer"
                  />
                </div>
                <button
                  onClick={() => shiftDay(1)}
                  className="p-1.5 rounded-md border border-white/[0.08] bg-white/[0.03] text-neutral-500 hover:text-neutral-300 hover:border-white/20 transition-all duration-150 cursor-pointer"
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            )}

            {/* Weekly week navigation */}
            {tab === 'weekly' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => shiftWeek(-1)}
                  className="p-1.5 rounded-md border border-white/[0.08] bg-white/[0.03] text-neutral-500 hover:text-neutral-300 hover:border-white/20 transition-all duration-150 cursor-pointer"
                >
                  <ChevronLeft size={13} />
                </button>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/[0.08] bg-white/[0.03]">
                  <Calendar size={12} className="text-neutral-500" />
                  <span className="font-mono text-[11px] text-neutral-400">
                    {weekDates.start} – {weekDates.end}
                  </span>
                </div>
                <button
                  onClick={() => shiftWeek(1)}
                  className="p-1.5 rounded-md border border-white/[0.08] bg-white/[0.03] text-neutral-500 hover:text-neutral-300 hover:border-white/20 transition-all duration-150 cursor-pointer"
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            )}

            {/* Search (not on punch logs — has its own user selector) */}
            {tab !== 'punches' && (
              <div className="relative">
                <Search
                  size={12}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600 pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Search employee..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-4 py-1.5 rounded-md border border-white/[0.08] bg-white/[0.03] font-mono text-[11px] text-neutral-300 placeholder:text-neutral-600 outline-none focus:border-blue-500/40 focus:bg-blue-500/[0.04] transition-all duration-150 w-48"
                />
              </div>
            )}
          </div>

          {/* ══ Daily Report ══ */}
          {tab === 'daily' && (
            <div className="rounded-xl border border-white/[0.08] bg-[#1c1c1c] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <Th>Employee</Th>
                      <Th>Shift</Th>
                      <Th>Time In</Th>
                      <Th>Time Out</Th>
                      <Th right>Regular</Th>
                      <Th right>OT</Th>
                      <Th right>Night Diff</Th>
                      <Th right>Late</Th>
                      <Th right>Undertime</Th>
                      <Th>Status</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyLoading ? (
                      <LoadingRow cols={10} />
                    ) : dailyError ? (
                      <ErrorRow cols={10} message={dailyError} />
                    ) : filteredDaily.length === 0 ? (
                      <EmptyRow cols={10} />
                    ) : (
                      filteredDaily.map((row, idx) => {
                        const sc = statusConfig[row.status];
                        return (
                          <tr
                            key={row.uid}
                            className={`border-b border-white/[0.04] transition-colors hover:bg-white/[0.02] ${idx % 2 !== 0 ? 'bg-white/[0.01]' : ''}`}
                          >
                            <td className="px-4 py-3.5">
                              <p className="font-mono text-[12px] text-neutral-200 whitespace-nowrap">
                                {row.name}
                              </p>
                              <p className="font-mono text-[10px] text-neutral-600 mt-0.5">
                                {row.department}
                              </p>
                            </td>
                            <Td muted>{row.shift}</Td>
                            <Td>{row.timeIn ?? <span className="text-neutral-700">—</span>}</Td>
                            <Td>{row.timeOut ?? <span className="text-neutral-700">—</span>}</Td>
                            <Td right>
                              <span className="text-green-400">{fmtHr(row.regular)}</span>
                            </Td>
                            <Td right>
                              <span className={row.ot > 0 ? 'text-amber-400' : 'text-neutral-700'}>
                                {fmtHr(row.ot)}
                              </span>
                            </Td>
                            <Td right>
                              <span className={row.nd > 0 ? 'text-purple-400' : 'text-neutral-700'}>
                                {fmtHr(row.nd)}
                              </span>
                            </Td>
                            <Td right>
                              <span
                                className={row.lateMin > 0 ? 'text-red-400' : 'text-neutral-700'}
                              >
                                {fmtMin(row.lateMin)}
                              </span>
                            </Td>
                            <Td right>
                              <span
                                className={
                                  row.undertimeMin > 0 ? 'text-red-400' : 'text-neutral-700'
                                }
                              >
                                {fmtMin(row.undertimeMin)}
                              </span>
                            </Td>
                            <td className="px-4 py-3.5">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-mono text-[10px] tracking-wide ${sc.cls}`}
                              >
                                {sc.icon} {sc.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Daily totals footer */}
              {!dailyLoading && (
                <div className="border-t border-white/[0.06] px-4 py-3 grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {[
                    {
                      label: 'Total Regular',
                      value: `${dailyReport.reduce((s, r) => s + r.regularHours, 0).toFixed(2)}h`,
                      cls: 'text-green-400',
                    },
                    { label: 'Total OT', value: `${totalOT.toFixed(2)}h`, cls: 'text-amber-400' },
                    { label: 'Total ND', value: `${totalND.toFixed(2)}h`, cls: 'text-purple-400' },
                    { label: 'Late Arrivals', value: `${lateCount}`, cls: 'text-red-400' },
                    {
                      label: 'Absent',
                      value: `${dailyDisplayRows.filter((r) => r.status === 'absent').length}`,
                      cls: 'text-neutral-500',
                    },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="font-mono text-[9px] text-neutral-600 tracking-widest uppercase">
                        {item.label}
                      </p>
                      <p className={`font-mono text-[14px] font-semibold mt-0.5 ${item.cls}`}>
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ Weekly Report ══ */}
          {tab === 'weekly' && (
            <div className="rounded-xl border border-white/[0.08] bg-[#1c1c1c] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <Th>Employee</Th>
                      <Th right>Days Worked</Th>
                      <Th right>Regular Hrs</Th>
                      <Th right>OT Hrs</Th>
                      <Th right>Night Diff</Th>
                      <Th right>Total Late</Th>
                      <Th right>Total Undertime</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {weeklyLoading ? (
                      <LoadingRow cols={7} />
                    ) : weeklyError ? (
                      <ErrorRow cols={7} message={weeklyError} />
                    ) : filteredWeekly.length === 0 ? (
                      <EmptyRow cols={7} />
                    ) : (
                      filteredWeekly.map((row, idx) => (
                        <tr
                          key={row.uid}
                          className={`border-b border-white/[0.04] transition-colors hover:bg-white/[0.02] ${idx % 2 !== 0 ? 'bg-white/[0.01]' : ''}`}
                        >
                          <td className="px-4 py-3.5">
                            <p className="font-mono text-[12px] text-neutral-200 whitespace-nowrap">
                              {row.employee.firstName} {row.employee.lastName}
                            </p>
                            <p className="font-mono text-[10px] text-neutral-600 mt-0.5">
                              {row.employee.department}
                            </p>
                          </td>
                          <Td right>
                            <span className="text-blue-400">{row.days.length} / 5</span>
                          </Td>
                          <Td right>
                            <span className="text-green-400">{fmtHr(row.totals.regularHours)}</span>
                          </Td>
                          <Td right>
                            <span
                              className={
                                row.totals.overtimeHours > 0 ? 'text-amber-400' : 'text-neutral-700'
                              }
                            >
                              {fmtHr(row.totals.overtimeHours)}
                            </span>
                          </Td>
                          <Td right>
                            <span
                              className={
                                row.totals.nightDiffHours > 0
                                  ? 'text-purple-400'
                                  : 'text-neutral-700'
                              }
                            >
                              {fmtHr(row.totals.nightDiffHours)}
                            </span>
                          </Td>
                          <Td right>
                            <span
                              className={
                                row.totals.lateMinutes > 0 ? 'text-red-400' : 'text-neutral-700'
                              }
                            >
                              {fmtMin(row.totals.lateMinutes)}
                            </span>
                          </Td>
                          <Td right>
                            <span
                              className={
                                row.totals.undertimeMinutes > 0
                                  ? 'text-red-400'
                                  : 'text-neutral-700'
                              }
                            >
                              {fmtMin(row.totals.undertimeMinutes)}
                            </span>
                          </Td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Weekly totals footer */}
              {!weeklyLoading && weeklyReport.length > 0 && (
                <div className="border-t border-white/[0.06] px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    {
                      label: 'Total Regular',
                      value: `${weeklyReport.reduce((s, r) => s + r.totals.regularHours, 0).toFixed(2)}h`,
                      cls: 'text-green-400',
                    },
                    {
                      label: 'Total OT',
                      value: `${weeklyReport.reduce((s, r) => s + r.totals.overtimeHours, 0).toFixed(2)}h`,
                      cls: 'text-amber-400',
                    },
                    {
                      label: 'Total ND',
                      value: `${weeklyReport.reduce((s, r) => s + r.totals.nightDiffHours, 0).toFixed(2)}h`,
                      cls: 'text-purple-400',
                    },
                    {
                      label: 'Total Late',
                      value: fmtMin(weeklyReport.reduce((s, r) => s + r.totals.lateMinutes, 0)),
                      cls: 'text-red-400',
                    },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="font-mono text-[9px] text-neutral-600 tracking-widest uppercase">
                        {item.label}
                      </p>
                      <p className={`font-mono text-[14px] font-semibold mt-0.5 ${item.cls}`}>
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ Punch Logs ══ */}
          {tab === 'punches' && (
            <div className="rounded-xl border border-white/[0.08] bg-[#1c1c1c] overflow-hidden">
              {/* Controls row */}
              <div className="px-4 py-3 border-b border-white/[0.06] flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Users size={12} className="text-neutral-600" />
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="font-mono text-[11px] text-neutral-300 bg-white/[0.04] border border-white/[0.08] rounded-md px-2 py-1 outline-none focus:border-blue-500/40 transition-colors min-w-[200px] cursor-pointer"
                  >
                    <option value="" className="bg-[#1c1c1c]">
                      {usersLoading ? 'Loading users…' : '— Select employee —'}
                    </option>
                    {allUsers.map((u) => (
                      <option key={u.uid} value={u.uid} className="bg-[#1c1c1c]">
                        {u.firstName} {u.lastName} ({u.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <AlertTriangle size={12} className="text-amber-400" />
                  <span className="font-mono text-[10px] text-amber-400/80">
                    Edits trigger metric recomputation.
                  </span>
                </div>
              </div>

              {/* Edit error banner */}
              {editError && (
                <div className="px-4 py-2 border-b border-white/[0.06] bg-red-500/[0.06]">
                  <p className="font-mono text-[11px] text-red-400">{editError}</p>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <Th>Employee</Th>
                      <Th>Date</Th>
                      <Th>Punch In (Local)</Th>
                      <Th>Punch Out (Local)</Th>
                      <Th>Edited</Th>
                      <Th>Action</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {!selectedUserId ? (
                      <EmptyRow cols={6} message="Select an employee to view punch records." />
                    ) : punchesLoading ? (
                      <LoadingRow cols={6} />
                    ) : punchesError ? (
                      <ErrorRow cols={6} message={punchesError} />
                    ) : userPunches.length === 0 ? (
                      <EmptyRow cols={6} message="No punch records found for this employee." />
                    ) : (
                      userPunches.map((row, idx) => {
                        const isEditing = editingId === row.id;
                        const empTZ = allUsers.find((u) => u.uid === row.uid)?.timezone;
                        return (
                          <tr
                            key={row.id}
                            className={`border-b border-white/[0.04] transition-colors hover:bg-white/[0.02] ${idx % 2 !== 0 ? 'bg-white/[0.01]' : ''}`}
                          >
                            {/* Employee (from allUsers lookup) */}
                            <td className="px-4 py-3.5">
                              {(() => {
                                const u = allUsers.find((u) => u.uid === row.uid);
                                return u ? (
                                  <>
                                    <p className="font-mono text-[12px] text-neutral-200 whitespace-nowrap">
                                      {u.firstName} {u.lastName}
                                    </p>
                                    <p className="font-mono text-[10px] text-neutral-600 mt-0.5">
                                      {u.department}
                                    </p>
                                  </>
                                ) : (
                                  <p className="font-mono text-[12px] text-neutral-600">—</p>
                                );
                              })()}
                            </td>

                            {/* Date */}
                            <Td muted>{fmtDate(row.punchIn)}</Td>

                            {/* Punch In */}
                            <td className="px-4 py-3.5">
                              {isEditing ? (
                                <input
                                  type="time"
                                  value={editPunchIn}
                                  onChange={(e) => setEditPunchIn(e.target.value)}
                                  className="font-mono text-[12px] text-neutral-200 bg-white/[0.05] border border-blue-500/40 rounded px-2 py-0.5 outline-none focus:border-blue-500/70 transition-colors w-24"
                                />
                              ) : (
                                <span className="font-mono text-[12px] text-neutral-300">
                                  {toZonedHHMM(row.punchIn, empTZ)}
                                </span>
                              )}
                            </td>

                            {/* Punch Out */}
                            <td className="px-4 py-3.5">
                              {isEditing ? (
                                row.punchOut ? (
                                  <input
                                    type="time"
                                    value={editPunchOut}
                                    onChange={(e) => setEditPunchOut(e.target.value)}
                                    className="font-mono text-[12px] text-neutral-200 bg-white/[0.05] border border-blue-500/40 rounded px-2 py-0.5 outline-none focus:border-blue-500/70 transition-colors w-24"
                                  />
                                ) : (
                                  <span className="font-mono text-[11px] text-neutral-700">
                                    No punch-out
                                  </span>
                                )
                              ) : (
                                <span
                                  className={`font-mono text-[12px] ${row.punchOut ? 'text-neutral-300' : 'text-neutral-700'}`}
                                >
                                  {row.punchOut ? toZonedHHMM(row.punchOut, empTZ) : '—'}
                                </span>
                              )}
                            </td>

                            {/* Admin edited badge */}
                            <td className="px-4 py-3.5">
                              {row.adminEdited ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-mono text-[10px] tracking-wide text-amber-400 bg-amber-500/10 border-amber-500/20">
                                  Edited
                                </span>
                              ) : (
                                <span className="font-mono text-[10px] text-neutral-700">—</span>
                              )}
                            </td>

                            {/* Action */}
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-1.5">
                                {isEditing ? (
                                  <>
                                    <button
                                      onClick={() => saveEdit(row)}
                                      disabled={editSaving}
                                      className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-green-500/30 bg-green-500/10 text-green-400 font-mono text-[10px] hover:bg-green-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                                    >
                                      {editSaving ? (
                                        <Loader2 size={10} className="animate-spin" />
                                      ) : (
                                        <Save size={10} />
                                      )}
                                      Save
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingId(null);
                                        setEditError(null);
                                      }}
                                      disabled={editSaving}
                                      className="flex items-center gap-1 px-2 py-1 rounded-md border border-white/[0.08] bg-white/[0.03] text-neutral-500 font-mono text-[10px] hover:text-neutral-300 hover:border-white/20 transition-all cursor-pointer disabled:opacity-50"
                                    >
                                      <X size={10} />
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => startEdit(row)}
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-white/[0.08] bg-white/[0.03] text-neutral-500 font-mono text-[10px] hover:text-neutral-300 hover:border-white/20 hover:bg-white/[0.06] transition-all cursor-pointer"
                                  >
                                    <Edit2 size={10} /> Edit
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {/* ══ Users ══ */}
          {tab === 'users' && (
            <div className="rounded-xl border border-white/[0.08] bg-[#1c1c1c] overflow-hidden">
              {(roleError || schedError) && (
                <div className="px-4 py-2 border-b border-white/[0.06] bg-red-500/[0.06]">
                  <p className="font-mono text-[11px] text-red-400">{roleError ?? schedError}</p>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <Th>Employee</Th>
                      <Th>Department</Th>
                      <Th>Position</Th>
                      <Th>Role</Th>
                      <Th>Schedule</Th>
                      <Th>Actions</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersLoading ? (
                      <LoadingRow cols={6} />
                    ) : allUsers.length === 0 ? (
                      <EmptyRow cols={6} message="No users found." />
                    ) : (
                      allUsers
                        .filter((u) => {
                          const q = search.toLowerCase();
                          return (
                            u.firstName.toLowerCase().includes(q) ||
                            u.lastName.toLowerCase().includes(q) ||
                            u.email.toLowerCase().includes(q)
                          );
                        })
                        .map((u, idx) => {
                          const deptLabel =
                            DEPARTMENTS.find((d) => d.value === u.department)?.label ??
                            u.department;
                          const posLabel =
                            DEPARTMENTS.find((d) => d.value === u.department)?.positions.find(
                              (p) => p.value === u.position,
                            )?.label ?? u.position;
                          const roleBadge =
                            u.role === 'superadmin'
                              ? 'text-purple-400 bg-purple-500/10 border-purple-500/20'
                              : u.role === 'admin'
                                ? 'text-blue-400 bg-blue-500/10 border-blue-500/20'
                                : 'text-neutral-500 bg-white/[0.03] border-white/[0.08]';
                          const isToggling = !!roleToggling[u.uid];
                          const isSchedEditing = scheduleEditUID === u.uid;
                          return (
                            <Fragment key={u.uid}>
                              <tr
                                className={`border-b border-white/[0.04] transition-colors hover:bg-white/[0.02] ${
                                  idx % 2 === 0 ? '' : 'bg-white/[0.01]'
                                }`}
                              >
                                <td className="px-4 py-3.5">
                                  <p className="font-mono text-[12px] text-neutral-200 whitespace-nowrap">
                                    {u.firstName} {u.lastName}
                                  </p>
                                  <p className="font-mono text-[10px] text-neutral-600 mt-0.5">
                                    {u.email}
                                  </p>
                                </td>
                                <Td muted>{deptLabel}</Td>
                                <Td muted>{posLabel}</Td>
                                <td className="px-4 py-3.5">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-mono text-[10px] tracking-wide capitalize ${roleBadge}`}
                                  >
                                    {u.role}
                                  </span>
                                </td>
                                {/* Schedule column */}
                                <td className="px-4 py-3.5">
                                  {u.schedule?.start && u.schedule?.end ? (
                                    <div className="flex flex-col gap-0.5">
                                      <span className="font-mono text-[11px] text-neutral-300">
                                        {u.schedule.start}–{u.schedule.end}
                                      </span>
                                      <span className="font-mono text-[10px] text-neutral-600">
                                        {u.timezone || '—'}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="font-mono text-[11px] text-neutral-700">
                                      —
                                    </span>
                                  )}
                                </td>
                                {/* Actions column */}
                                <td className="px-4 py-3.5">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {/* Edit Schedule – available to all admins */}
                                    <button
                                      onClick={() =>
                                        isSchedEditing
                                          ? setScheduleEditUID(null)
                                          : startSchedEdit(u)
                                      }
                                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-mono text-[10px] tracking-wide transition-all duration-150 cursor-pointer ${
                                        isSchedEditing
                                          ? 'bg-white/[0.06] border-white/20 text-neutral-300'
                                          : 'bg-white/[0.03] border-white/[0.08] text-neutral-500 hover:text-neutral-300 hover:border-white/20 hover:bg-white/[0.06]'
                                      }`}
                                    >
                                      <Clock size={10} />
                                      {isSchedEditing ? 'Cancel' : 'Schedule'}
                                    </button>
                                    {/* Grant/Revoke Admin – superadmin only */}
                                    {currentRole === 'superadmin' && u.role !== 'superadmin' && (
                                      <button
                                        onClick={() => handleRoleToggle(u)}
                                        disabled={isToggling}
                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-mono text-[10px] tracking-wide transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                                          u.role === 'admin'
                                            ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                                            : 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20'
                                        }`}
                                      >
                                        {isToggling ? (
                                          <Loader2 size={10} className="animate-spin" />
                                        ) : u.role === 'admin' ? (
                                          <ShieldOff size={10} />
                                        ) : (
                                          <ShieldCheck size={10} />
                                        )}
                                        {isToggling
                                          ? 'Saving…'
                                          : u.role === 'admin'
                                            ? 'Revoke Admin'
                                            : 'Grant Admin'}
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                              {/* Inline schedule editor */}
                              {isSchedEditing && (
                                <tr
                                  key={`${u.uid}-sched-edit`}
                                  className="border-b border-white/[0.04] bg-blue-500/[0.03]"
                                >
                                  <td colSpan={6} className="px-4 py-4">
                                    <div className="flex flex-wrap items-end gap-4">
                                      <div className="flex flex-col gap-1">
                                        <label className="font-mono text-[9px] text-neutral-600 tracking-widest uppercase">
                                          Shift Start (HH:MM)
                                        </label>
                                        <input
                                          type="time"
                                          value={schedEditStart}
                                          onChange={(e) => setSchedEditStart(e.target.value)}
                                          className="font-mono text-[12px] text-neutral-200 bg-white/[0.05] border border-blue-500/40 rounded px-2 py-1 outline-none focus:border-blue-500/70 transition-colors w-32"
                                        />
                                      </div>
                                      <div className="flex flex-col gap-1">
                                        <label className="font-mono text-[9px] text-neutral-600 tracking-widest uppercase">
                                          Shift End (HH:MM)
                                        </label>
                                        <input
                                          type="time"
                                          value={schedEditEnd}
                                          onChange={(e) => setSchedEditEnd(e.target.value)}
                                          className="font-mono text-[12px] text-neutral-200 bg-white/[0.05] border border-blue-500/40 rounded px-2 py-1 outline-none focus:border-blue-500/70 transition-colors w-32"
                                        />
                                      </div>
                                      <div className="flex flex-col gap-1">
                                        <label className="font-mono text-[9px] text-neutral-600 tracking-widest uppercase">
                                          Timezone (IANA)
                                        </label>
                                        <input
                                          type="text"
                                          value={schedEditTimezone}
                                          onChange={(e) => setSchedEditTimezone(e.target.value)}
                                          placeholder="e.g. Asia/Manila"
                                          className="font-mono text-[12px] text-neutral-200 bg-white/[0.05] border border-blue-500/40 rounded px-2 py-1 outline-none focus:border-blue-500/70 transition-colors placeholder:text-neutral-700 w-44"
                                        />
                                      </div>
                                      <div className="flex items-center gap-2 pb-0.5">
                                        <button
                                          onClick={() => saveSchedule(u)}
                                          disabled={schedSaving}
                                          className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-green-500/30 bg-green-500/10 text-green-400 font-mono text-[10px] hover:bg-green-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                                        >
                                          {schedSaving ? (
                                            <Loader2 size={10} className="animate-spin" />
                                          ) : (
                                            <Save size={10} />
                                          )}
                                          Save
                                        </button>
                                        <button
                                          onClick={() => {
                                            setScheduleEditUID(null);
                                            setSchedError(null);
                                          }}
                                          disabled={schedSaving}
                                          className="flex items-center gap-1 px-2 py-1 rounded-md border border-white/[0.08] bg-white/[0.03] text-neutral-500 font-mono text-[10px] hover:text-neutral-300 hover:border-white/20 transition-all cursor-pointer disabled:opacity-50"
                                        >
                                          <X size={10} />
                                        </button>
                                      </div>
                                      {schedError && (
                                        <p className="font-mono text-[11px] text-red-400 self-end pb-0.5">
                                          {schedError}
                                        </p>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
