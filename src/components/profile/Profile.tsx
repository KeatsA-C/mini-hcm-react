import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Calendar, Building2, MapPin, LogOut, ShieldCheck, AlertCircle } from 'lucide-react';
import { signOut } from 'firebase/auth';
import Avatar from './Avatar';
import PunchButton, { type PunchState } from './PunchButton';
import Button from '../Button';
import { auth } from '../../config/firebase';
import { ProfileSkeleton } from './ProfileSkeleton';
import { fetchUserDetails as fetchUserDetailsFromStore } from '../../store/authStore';
import { DEPARTMENTS } from '../../data/departments';
import {
  punchIn as apiPunchIn,
  punchOut as apiPunchOut,
  fetchPunchStatus,
  fetchDailySummary,
  type PunchMetrics,
} from '../../store/attendanceStore';

interface UserData {
  name: string;
  position: string;
  department: string;
  timezone: string;
  role?: string;
  employeeId?: string;
  avatarSrc?: string;
}

function fmtTime(iso: string, timezone?: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone,
  });
}

export default function Profile(): React.ReactElement {
  const navigate = useNavigate();
  const [punchState, setPunchState] = useState<PunchState>('in');
  const [punchLog, setPunchLog] = useState<string>('Not yet punched today');
  const [punchError, setPunchError] = useState<string | null>(null);
  const [todayMetrics, setTodayMetrics] = useState<PunchMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [timezone, setTimezone] = useState<string | undefined>(undefined);
  const [currentTime, setCurrentTime] = useState('');

  const fetchUserDetails = async (): Promise<void> => {
    const timeoutId = setTimeout(() => {
      setError('Request timeout. Please try again.');
      setLoading(false);
    }, 10000);

    try {
      const user = auth.currentUser;
      if (!user) {
        clearTimeout(timeoutId);
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      const data = await fetchUserDetailsFromStore();
      clearTimeout(timeoutId);

      if (!data) {
        throw new Error('Failed to fetch user details');
      }

      const tz = data.timezone || undefined;
      setTimezone(tz);

      const deptEntry = DEPARTMENTS.find((d) => d.value === data.department);
      const deptLabel = deptEntry?.label ?? data.department ?? 'N/A';
      const posLabel =
        deptEntry?.positions.find((p) => p.value === data.position)?.label ??
        data.position ??
        'Employee';

      setUserData({
        name: `${data.firstName} ${data.lastName}` || 'User',
        position: posLabel,
        department: deptLabel,
        timezone: data.timezone || 'UTC',
        role: data.role,
        employeeId: data.email,
        avatarSrc: undefined,
      });
      setLoading(false);
    } catch (err) {
      clearTimeout(timeoutId);
      setError('Failed to load user profile. Please try again.');
      setLoading(false);
      console.error('Error fetching user details:', err);
    }
  };

  const initializePunchState = async (tz?: string): Promise<void> => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const status = await fetchPunchStatus();

      if (status.isPunchedIn && status.currentPunch) {
        setPunchState('out');
        setPunchLog(`Punched in at ${fmtTime(status.currentPunch.punchIn, tz)}`);
      } else {
        setPunchState('in');
      }

      try {
        const summary = await fetchDailySummary(today);
        setTodayMetrics({
          workDate: summary.workDate,
          regularHours: summary.regularHours,
          overtimeHours: summary.overtimeHours,
          nightDiffHours: summary.nightDiffHours,
          lateMinutes: summary.lateMinutes,
          undertimeMinutes: summary.undertimeMinutes,
          totalWorkedHours: summary.totalWorkedHours,
        });
      } catch (summaryErr) {
        console.warn('[initializePunchState] Failed to load daily summary:', summaryErr);
      }
    } catch (statusErr) {
      console.error('[initializePunchState] Failed to fetch punch status:', statusErr);
    }
  };

  useEffect(() => {
    fetchUserDetails();
  }, []);

  useEffect(() => {
    if (!loading && !error) {
      initializePunchState(timezone);
    }
  }, [loading]);

  useEffect(() => {
    function tick() {
      setCurrentTime(
        new Date().toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
          timeZone: timezone,
        }),
      );
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timezone]);

  const handlePunch = async (): Promise<void> => {
    setPunchError(null);
    try {
      if (punchState === 'in') {
        const res = await apiPunchIn();
        setPunchLog(`Punched in at ${fmtTime(res.punchIn, timezone)}`);
        setPunchState('out');
      } else {
        const res = await apiPunchOut();
        setPunchLog(`Punched out at ${fmtTime(res.punchOut, timezone)}`);
        setPunchState('in');
        setTodayMetrics(res.metrics);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Punch failed. Please try again.';
      setPunchError(msg);
    }
  };

  const handleLogout = async (): Promise<void> => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading || error || !userData) {
    return <ProfileSkeleton errorMessage={error} />;
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const isPrivileged = userData.role === 'admin' || userData.role === 'superadmin';

  return (
    <div className="relative w-full max-w-[360px]">
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />

      <div className="relative rounded-2xl border border-white/[0.08] bg-[#1c1c1c] overflow-hidden shadow-[0_8px_16px_rgba(175,175,175,0.25)]">
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

        <div className="relative h-24 bg-gradient-to-br from-blue-500/[0.07] via-transparent to-purple-500/[0.05]">
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '20px 20px',
            }}
          />
        </div>

        <div className="flex justify-center -mt-11 mb-4 relative z-10">
          <Avatar src={userData.avatarSrc} name={userData.name} size={88} />
        </div>

        <div className="flex flex-col items-center gap-1 px-6 mb-5">
          <h1 className="font-sans text-[18px] font-bold text-neutral-100 tracking-tight">
            {userData.name}
          </h1>
          <p className="font-mono text-[12px] text-neutral-500 tracking-wide">
            {userData.position}
          </p>

          <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/[0.08] border border-blue-500/20 font-mono text-[10px] text-blue-400 tracking-wide">
              <Building2 size={9} /> {userData.department}
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.07] font-mono text-[10px] text-neutral-500 tracking-wide">
              <MapPin size={9} /> {userData.timezone}
            </span>
          </div>
        </div>

        <div className="mx-6 h-px bg-white/[0.05] mb-5" />

        <div className="flex flex-col items-center gap-3 px-6 mb-5">
          <PunchButton state={punchState} onToggle={handlePunch} />

          {punchError && (
            <div className="flex items-center gap-2 w-full px-3 py-2 rounded-md bg-red-500/10 border border-red-500/25">
              <AlertCircle size={12} className="text-red-400 shrink-0" />
              <p className="font-mono text-[11px] text-red-400 leading-snug">{punchError}</p>
            </div>
          )}

          {isPrivileged && (
            <Button mode="blue" onClick={() => navigate('/admin')}>
              <ShieldCheck size={14} />
              Admin Dashboard
            </Button>
          )}
          <Button mode="red" onClick={handleLogout}>
            <LogOut size={14} />
            Logout
          </Button>
        </div>

        {todayMetrics && (
          <>
            <div className="mx-6 h-px bg-white/[0.05] mb-4" />
            <div className="px-6 mb-5">
              <p className="font-mono text-[9px] text-neutral-600 tracking-widest uppercase mb-3">
                Today's Summary
              </p>
              <div className="grid grid-cols-3 gap-x-4 gap-y-3">
                {[
                  {
                    label: 'Regular',
                    value: `${todayMetrics.regularHours.toFixed(2)}h`,
                    color: 'text-green-400',
                  },
                  {
                    label: 'OT',
                    value:
                      todayMetrics.overtimeHours > 0
                        ? `${todayMetrics.overtimeHours.toFixed(2)}h`
                        : '—',
                    color: todayMetrics.overtimeHours > 0 ? 'text-amber-400' : 'text-neutral-700',
                  },
                  {
                    label: 'Night Diff',
                    value:
                      todayMetrics.nightDiffHours > 0
                        ? `${todayMetrics.nightDiffHours.toFixed(2)}h`
                        : '—',
                    color: todayMetrics.nightDiffHours > 0 ? 'text-purple-400' : 'text-neutral-700',
                  },
                  {
                    label: 'Late',
                    value: todayMetrics.lateMinutes > 0 ? `${todayMetrics.lateMinutes}m` : '—',
                    color: todayMetrics.lateMinutes > 0 ? 'text-red-400' : 'text-neutral-700',
                  },
                  {
                    label: 'Undertime',
                    value:
                      todayMetrics.undertimeMinutes > 0 ? `${todayMetrics.undertimeMinutes}m` : '—',
                    color: todayMetrics.undertimeMinutes > 0 ? 'text-red-400' : 'text-neutral-700',
                  },
                  {
                    label: 'Total',
                    value: `${todayMetrics.totalWorkedHours.toFixed(2)}h`,
                    color: 'text-blue-400',
                  },
                ].map((m) => (
                  <div key={m.label} className="flex flex-col gap-0.5">
                    <span className="font-mono text-[9px] text-neutral-600 tracking-widest uppercase">
                      {m.label}
                    </span>
                    <span className={`font-mono text-[12px] font-semibold ${m.color}`}>
                      {m.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="mx-6 h-px bg-white/[0.05] mb-4" />

        {/* Live clock */}
        {currentTime && (
          <div className="flex items-center justify-center gap-2 mb-3 px-6">
            <Clock size={13} className="text-blue-400/60" />
            <span className="font-mono text-[15px] font-semibold text-neutral-200 tabular-nums tracking-wide">
              {currentTime}
            </span>
            {userData?.timezone && (
              <span className="font-mono text-[9px] text-neutral-600 tracking-widest uppercase">
                {userData.timezone}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between px-6 pb-5">
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-neutral-700">
            <Calendar size={11} />
            <span>{today}</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-neutral-700">
            <Clock size={11} />
            <span>{punchLog}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
