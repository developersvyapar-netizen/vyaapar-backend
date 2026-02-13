'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────────────────
interface AdminUser {
  id: string;
  loginId: string;
  email: string;
  name: string | null;
  role: string;
}

interface Salesperson {
  id: string;
  name: string | null;
  loginId: string;
  email: string;
  phone: string | null;
  createdAt: string;
  attendance: {
    totalDays: number;
    completedSessions: number;
    averageHoursPerSession: number;
    totalHoursWorked: number;
    lastAttendance: {
      date: string;
      loginTime: string;
      logoutTime: string | null;
      status: string;
      totalHours: number | null;
    } | null;
  };
  orders: { totalCount: number };
}

interface OrderLine {
  id: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  product: { id: string; name: string; sku: string };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: string;
  notes: string | null;
  createdAt: string;
  buyer: { id: string; name: string | null; loginId: string; role: string } | null;
  supplier: { id: string; name: string | null; loginId: string; role: string } | null;
  salesperson: { id: string; name: string | null; loginId: string } | null;
  orderLines: OrderLine[];
}

interface AttendanceLog {
  id: string;
  loginTime: string;
  logoutTime: string | null;
  date: string;
  totalHours: string | null;
  status: string;
  salesperson?: { id: string; name: string | null; loginId: string };
}

// ─── API helper ──────────────────────────────────────────────────────
async function api(method: string, path: string, token: string | null) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(path, { method, headers });
  return res.json().catch(() => ({ success: false, message: 'Failed to parse response' }));
}

// ─── Helpers ─────────────────────────────────────────────────────────
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}
function fmtCurrency(v: string | number) {
  return `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const STATUS_COLORS: Record<string, { fg: string; bg: string }> = {
  PENDING: { fg: '#fbbf24', bg: '#451a03' },
  APPROVED: { fg: '#34d399', bg: '#052e16' },
  PROCESSING: { fg: '#60a5fa', bg: '#172554' },
  SHIPPED: { fg: '#818cf8', bg: '#1e1b4b' },
  DELIVERED: { fg: '#22c55e', bg: '#052e16' },
  REJECTED: { fg: '#f87171', bg: '#450a0a' },
  CANCELLED: { fg: '#a1a1aa', bg: '#27272a' },
  LOGGED_IN: { fg: '#34d399', bg: '#052e16' },
  LOGGED_OUT: { fg: '#60a5fa', bg: '#172554' },
  INCOMPLETE: { fg: '#fbbf24', bg: '#451a03' },
};

// ─── Styles ──────────────────────────────────────────────────────────
const c = {
  bg: '#09090b',
  s1: '#0f0f12',
  s2: '#18181b',
  s3: '#1f1f23',
  border: '#27272a',
  borderLight: '#3f3f46',
  text: '#fafafa',
  t2: '#a1a1aa',
  t3: '#71717a',
  t4: '#52525b',
  blue: '#3b82f6',
  green: '#22c55e',
  red: '#ef4444',
  amber: '#f59e0b',
};

// ─── Main Component ──────────────────────────────────────────────────
export default function AdminPortal() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loginId, setLoginId] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Dashboard state
  type Tab = 'overview' | 'orders' | 'salespersons' | 'attendance';
  const [tab, setTab] = useState<Tab>('overview');
  const [salespersons, setSalespersons] = useState<Salesperson[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersPagination, setOrdersPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [attendance, setAttendance] = useState<AttendanceLog[]>([]);
  const [attPagination, setAttPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderFilter, setOrderFilter] = useState('');
  const [loading, setLoading] = useState(false);

  // Stats
  const [stats, setStats] = useState({ totalOrders: 0, pendingOrders: 0, totalSalespersons: 0 });

  // ─── Auth ────────────────────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers,
        body: JSON.stringify({ loginId, password }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const { token: t, user: u } = data.data;
        if (u.role !== 'ADMIN' && u.role !== 'DEVELOPER') {
          setLoginError('Access denied. Admin credentials required.');
          return;
        }
        setToken(t);
        setUser(u);
      } else {
        setLoginError(data.message || 'Login failed');
      }
    } catch {
      setLoginError('Connection error');
    } finally {
      setLoggingIn(false);
    }
  }

  // ─── Data loaders ────────────────────────────────────────────────
  const loadSalespersons = useCallback(async () => {
    if (!token) return;
    const data = await api('GET', '/api/admin/salespersons', token);
    if (data.success) {
      setSalespersons(data.data.salespersons || []);
      setStats((s) => ({ ...s, totalSalespersons: data.data.total || 0 }));
    }
  }, [token]);

  const loadOrders = useCallback(async (page = 1, status = '') => {
    if (!token) return;
    setLoading(true);
    let url = `/api/admin/orders?page=${page}&limit=15`;
    if (status) url += `&status=${status}`;
    const data = await api('GET', url, token);
    if (data.success) {
      setOrders(data.data.orders || []);
      setOrdersPagination(data.data.pagination || { page: 1, total: 0, totalPages: 0 });
      if (!status && page === 1) {
        setStats((s) => ({ ...s, totalOrders: data.data.pagination?.total || 0 }));
      }
    }
    setLoading(false);
  }, [token]);

  const loadPendingCount = useCallback(async () => {
    if (!token) return;
    const data = await api('GET', '/api/admin/orders?status=PENDING&limit=1', token);
    if (data.success) {
      setStats((s) => ({ ...s, pendingOrders: data.data.pagination?.total || 0 }));
    }
  }, [token]);

  const loadAttendance = useCallback(async (page = 1) => {
    if (!token) return;
    setLoading(true);
    const data = await api('GET', `/api/attendance/all?page=${page}&limit=20`, token);
    if (data.success) {
      setAttendance(data.data.records || []);
      setAttPagination({
        page: data.data.pagination?.page || 1,
        total: data.data.pagination?.total || 0,
        totalPages: data.data.pagination?.totalPages || 0,
      });
    }
    setLoading(false);
  }, [token]);

  const loadOrderDetail = useCallback(async (id: string) => {
    if (!token) return;
    const data = await api('GET', `/api/orders/${id}`, token);
    if (data.success) setSelectedOrder(data.data);
  }, [token]);

  // Initial load
  useEffect(() => {
    if (token) {
      loadSalespersons();
      loadOrders(1, '');
      loadPendingCount();
    }
  }, [token, loadSalespersons, loadOrders, loadPendingCount]);

  // ─── Login Screen ────────────────────────────────────────────────
  if (!token) {
    return (
      <div style={{ background: c.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', system-ui, sans-serif", color: c.text }}>
        <div style={{ width: 380 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: '-1px' }}>
              Vyapar<span style={{ color: c.blue }}>Xpress</span>
            </h1>
            <p style={{ color: c.t3, fontSize: 13, marginTop: 4 }}>Admin Portal</p>
          </div>
          <form onSubmit={handleLogin} style={{ background: c.s1, border: `1px solid ${c.border}`, borderRadius: 12, padding: 24 }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: c.t3, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Login ID</label>
              <input
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${c.border}`, background: c.bg, color: c.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: c.t3, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${c.border}`, background: c.bg, color: c.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            {loginError && <p style={{ color: c.red, fontSize: 13, margin: '0 0 12px' }}>{loginError}</p>}
            <button
              type="submit"
              disabled={loggingIn}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: c.blue, color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
            >
              {loggingIn ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ─── Dashboard ───────────────────────────────────────────────────
  const Badge = ({ status }: { status: string }) => {
    const sc = STATUS_COLORS[status] || { fg: c.t2, bg: c.s3 };
    return (
      <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, color: sc.fg, background: sc.bg, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
        {status}
      </span>
    );
  };

  const StatCard = ({ label, value, accent }: { label: string; value: string | number; accent?: string }) => (
    <div style={{ background: c.s1, border: `1px solid ${c.border}`, borderRadius: 12, padding: '20px 24px', flex: 1, minWidth: 180 }}>
      <p style={{ fontSize: 12, color: c.t3, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 800, margin: '6px 0 0', color: accent || c.text, letterSpacing: '-0.5px' }}>{value}</p>
    </div>
  );

  // ─── Order Detail Modal ──────────────────────────────────────────
  const OrderDetail = ({ order, onClose }: { order: Order; onClose: () => void }) => (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)' }} />
      <div style={{ position: 'relative', background: c.s1, border: `1px solid ${c.border}`, borderRadius: 16, padding: 28, width: 580, maxHeight: '85vh', overflowY: 'auto', zIndex: 101 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{order.orderNumber}</h2>
            <p style={{ margin: '4px 0 0', color: c.t3, fontSize: 13 }}>{fmtDate(order.createdAt)}</p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Badge status={order.status} />
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: c.t3, cursor: 'pointer', fontSize: 18, padding: 4 }}>&#x2715;</button>
          </div>
        </div>

        {/* Parties */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Buyer', data: order.buyer },
            { label: 'Supplier', data: order.supplier },
            { label: 'Salesperson', data: order.salesperson },
          ].map((p) => (
            <div key={p.label} style={{ background: c.s2, borderRadius: 8, padding: '10px 12px' }}>
              <p style={{ fontSize: 10, color: c.t4, margin: 0, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>{p.label}</p>
              {p.data ? (
                <>
                  <p style={{ fontSize: 13, fontWeight: 600, margin: '4px 0 0' }}>{p.data.name || p.data.loginId}</p>
                  <p style={{ fontSize: 11, color: c.t3, margin: '2px 0 0' }}>{'role' in p.data ? (p.data as { role: string }).role : 'SALESPERSON'}</p>
                </>
              ) : (
                <p style={{ fontSize: 13, color: c.t4, margin: '4px 0 0' }}>Self-order</p>
              )}
            </div>
          ))}
        </div>

        {/* Order Lines */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: c.t3, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Items</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ color: c.t4, textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                <th style={{ padding: '6px 0', fontWeight: 600 }}>Product</th>
                <th style={{ padding: '6px 0', fontWeight: 600, textAlign: 'right' }}>Qty</th>
                <th style={{ padding: '6px 0', fontWeight: 600, textAlign: 'right' }}>Price</th>
                <th style={{ padding: '6px 0', fontWeight: 600, textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.orderLines.map((line) => (
                <tr key={line.id} style={{ borderTop: `1px solid ${c.border}` }}>
                  <td style={{ padding: '8px 0' }}>
                    <span style={{ fontWeight: 600 }}>{line.product.name}</span>
                    <span style={{ color: c.t4, fontSize: 11, marginLeft: 6 }}>{line.product.sku}</span>
                  </td>
                  <td style={{ padding: '8px 0', textAlign: 'right', color: c.t2 }}>{line.quantity}</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', color: c.t2 }}>{fmtCurrency(line.unitPrice)}</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600 }}>{fmtCurrency(line.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 0', borderTop: `1px solid ${c.border}` }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 12, color: c.t3, margin: 0 }}>Total Amount</p>
            <p style={{ fontSize: 22, fontWeight: 800, margin: '2px 0 0', color: c.green }}>{fmtCurrency(order.totalAmount)}</p>
          </div>
        </div>

        {order.notes && (
          <div style={{ background: c.s2, borderRadius: 8, padding: '10px 12px', marginTop: 8 }}>
            <p style={{ fontSize: 11, color: c.t4, margin: 0, textTransform: 'uppercase', fontWeight: 700 }}>Notes</p>
            <p style={{ fontSize: 13, color: c.t2, margin: '4px 0 0' }}>{order.notes}</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ background: c.bg, minHeight: '100vh', fontFamily: "'Inter', system-ui, sans-serif", color: c.text }}>
      {/* ─── Sidebar ─── */}
      <aside style={{ position: 'fixed', top: 0, left: 0, width: 220, height: '100vh', background: c.s1, borderRight: `1px solid ${c.border}`, display: 'flex', flexDirection: 'column', zIndex: 40 }}>
        <div style={{ padding: '20px 20px 16px' }}>
          <h1 style={{ fontSize: 17, fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
            Vyapar<span style={{ color: c.blue }}>Xpress</span>
          </h1>
          <p style={{ color: c.t4, fontSize: 11, margin: '2px 0 0' }}>Admin Dashboard</p>
        </div>
        <nav style={{ padding: '0 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {([
            ['overview', 'Overview'],
            ['orders', 'Orders'],
            ['salespersons', 'Salespersons'],
            ['attendance', 'Attendance'],
          ] as [Tab, string][]).map(([id, label]) => (
            <button
              key={id}
              onClick={() => {
                setTab(id);
                setSelectedOrder(null);
                if (id === 'attendance') loadAttendance(1);
                if (id === 'orders') loadOrders(1, '');
                if (id === 'salespersons') loadSalespersons();
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                textAlign: 'left',
                background: tab === id ? c.s3 : 'transparent',
                color: tab === id ? c.text : c.t3,
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </nav>
        <div style={{ padding: '16px 20px', borderTop: `1px solid ${c.border}` }}>
          <p style={{ fontSize: 12, fontWeight: 600, margin: 0, color: c.t2 }}>{user?.name || user?.loginId}</p>
          <p style={{ fontSize: 11, color: c.t4, margin: '2px 0 0' }}>{user?.role}</p>
          <button
            onClick={() => { setToken(null); setUser(null); }}
            style={{ marginTop: 10, fontSize: 12, color: c.t4, background: 'none', border: `1px solid ${c.border}`, borderRadius: 6, padding: '4px 12px', cursor: 'pointer' }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <main style={{ marginLeft: 220, padding: '28px 32px', maxWidth: 1100 }}>

        {/* ═══ Overview Tab ═══ */}
        {tab === 'overview' && (
          <>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 24px', letterSpacing: '-0.5px' }}>Overview</h2>
            <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
              <StatCard label="Total Orders" value={stats.totalOrders} />
              <StatCard label="Pending Orders" value={stats.pendingOrders} accent={c.amber} />
              <StatCard label="Salespersons" value={stats.totalSalespersons} accent={c.blue} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Recent Orders */}
              <div style={{ background: c.s1, border: `1px solid ${c.border}`, borderRadius: 12, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Recent Orders</h3>
                  <button onClick={() => { setTab('orders'); loadOrders(1, ''); }} style={{ fontSize: 12, color: c.blue, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>View all</button>
                </div>
                {orders.slice(0, 5).map((o) => (
                  <div
                    key={o.id}
                    onClick={() => loadOrderDetail(o.id)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: `1px solid ${c.border}`, cursor: 'pointer' }}
                  >
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{o.orderNumber}</span>
                      <span style={{ fontSize: 12, color: c.t4, marginLeft: 8 }}>{fmtDate(o.createdAt)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: c.t2 }}>{fmtCurrency(o.totalAmount)}</span>
                      <Badge status={o.status} />
                    </div>
                  </div>
                ))}
                {orders.length === 0 && <p style={{ fontSize: 13, color: c.t4 }}>No orders found.</p>}
              </div>

              {/* Salesperson Summary */}
              <div style={{ background: c.s1, border: `1px solid ${c.border}`, borderRadius: 12, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Salespersons</h3>
                  <button onClick={() => { setTab('salespersons'); loadSalespersons(); }} style={{ fontSize: 12, color: c.blue, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>View all</button>
                </div>
                {salespersons.slice(0, 5).map((sp) => (
                  <div key={sp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: `1px solid ${c.border}` }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{sp.name || sp.loginId}</span>
                      <span style={{ fontSize: 11, color: c.t4, marginLeft: 6 }}>{sp.loginId}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 12, color: c.t3 }}>{sp.orders.totalCount} orders</span>
                      {sp.attendance.lastAttendance && <Badge status={sp.attendance.lastAttendance.status} />}
                    </div>
                  </div>
                ))}
                {salespersons.length === 0 && <p style={{ fontSize: 13, color: c.t4 }}>No salespersons found.</p>}
              </div>
            </div>
          </>
        )}

        {/* ═══ Orders Tab ═══ */}
        {tab === 'orders' && !selectedOrder && (
          <>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 16px', letterSpacing: '-0.5px' }}>Orders</h2>
            <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
              {[{ v: '', l: 'All' }, { v: 'PENDING', l: 'Pending' }, { v: 'APPROVED', l: 'Approved' }, { v: 'DELIVERED', l: 'Delivered' }, { v: 'CANCELLED', l: 'Cancelled' }].map((f) => (
                <button
                  key={f.v}
                  onClick={() => { setOrderFilter(f.v); loadOrders(1, f.v); }}
                  style={{ padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: orderFilter === f.v ? c.s3 : 'transparent', color: orderFilter === f.v ? c.text : c.t3 }}
                >
                  {f.l}
                </button>
              ))}
            </div>
            {/* Orders table */}
            <div style={{ background: c.s1, border: `1px solid ${c.border}`, borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${c.border}`, color: c.t4, textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Order</th>
                    <th style={{ padding: '12px 8px', fontWeight: 600 }}>Buyer</th>
                    <th style={{ padding: '12px 8px', fontWeight: 600 }}>Supplier</th>
                    <th style={{ padding: '12px 8px', fontWeight: 600 }}>Amount</th>
                    <th style={{ padding: '12px 8px', fontWeight: 600 }}>Date</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: c.t4 }}>Loading...</td></tr>
                  ) : orders.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: c.t4 }}>No orders found.</td></tr>
                  ) : orders.map((o) => (
                    <tr
                      key={o.id}
                      onClick={() => loadOrderDetail(o.id)}
                      style={{ borderTop: `1px solid ${c.border}`, cursor: 'pointer', transition: 'background 0.1s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = c.s2)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{o.orderNumber}</td>
                      <td style={{ padding: '12px 8px', color: c.t2 }}>{o.buyer?.name || o.buyer?.loginId || '—'}</td>
                      <td style={{ padding: '12px 8px', color: c.t2 }}>{o.supplier?.name || o.supplier?.loginId || '—'}</td>
                      <td style={{ padding: '12px 8px', fontWeight: 600 }}>{fmtCurrency(o.totalAmount)}</td>
                      <td style={{ padding: '12px 8px', color: c.t3 }}>{fmtDate(o.createdAt)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}><Badge status={o.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {ordersPagination.totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 16 }}>
                <button
                  disabled={ordersPagination.page <= 1}
                  onClick={() => loadOrders(ordersPagination.page - 1, orderFilter)}
                  style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${c.border}`, background: 'transparent', color: ordersPagination.page <= 1 ? c.t4 : c.t2, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                >
                  Previous
                </button>
                <span style={{ fontSize: 12, color: c.t3 }}>Page {ordersPagination.page} of {ordersPagination.totalPages}</span>
                <button
                  disabled={ordersPagination.page >= ordersPagination.totalPages}
                  onClick={() => loadOrders(ordersPagination.page + 1, orderFilter)}
                  style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${c.border}`, background: 'transparent', color: ordersPagination.page >= ordersPagination.totalPages ? c.t4 : c.t2, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* ═══ Salespersons Tab ═══ */}
        {tab === 'salespersons' && (
          <>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 20px', letterSpacing: '-0.5px' }}>Salespersons</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {salespersons.length === 0 ? (
                <div style={{ background: c.s1, border: `1px solid ${c.border}`, borderRadius: 12, padding: 24, textAlign: 'center', color: c.t4 }}>No salespersons found.</div>
              ) : salespersons.map((sp) => (
                <div key={sp.id} style={{ background: c.s1, border: `1px solid ${c.border}`, borderRadius: 12, padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{sp.name || sp.loginId}</h3>
                      <p style={{ fontSize: 12, color: c.t3, margin: '2px 0 0' }}>{sp.loginId} &middot; {sp.email} {sp.phone ? ` · ${sp.phone}` : ''}</p>
                    </div>
                    {sp.attendance.lastAttendance && <Badge status={sp.attendance.lastAttendance.status} />}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                    {[
                      { label: 'Days Worked', value: sp.attendance.totalDays },
                      { label: 'Avg Hours/Day', value: sp.attendance.averageHoursPerSession || '—' },
                      { label: 'Total Hours', value: sp.attendance.totalHoursWorked || '—' },
                      { label: 'Total Orders', value: sp.orders.totalCount },
                      { label: 'Last Active', value: sp.attendance.lastAttendance ? fmtDate(sp.attendance.lastAttendance.date) : '—' },
                    ].map((s) => (
                      <div key={s.label} style={{ background: c.s2, borderRadius: 8, padding: '10px 12px' }}>
                        <p style={{ fontSize: 10, color: c.t4, margin: 0, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>{s.label}</p>
                        <p style={{ fontSize: 16, fontWeight: 700, margin: '4px 0 0' }}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                  {sp.attendance.lastAttendance && (
                    <div style={{ marginTop: 12, display: 'flex', gap: 16, fontSize: 12, color: c.t3 }}>
                      <span>Login: <span style={{ color: c.t2, fontWeight: 600 }}>{fmtTime(sp.attendance.lastAttendance.loginTime)}</span></span>
                      {sp.attendance.lastAttendance.logoutTime && (
                        <span>Logout: <span style={{ color: c.t2, fontWeight: 600 }}>{fmtTime(sp.attendance.lastAttendance.logoutTime)}</span></span>
                      )}
                      {sp.attendance.lastAttendance.totalHours !== null && (
                        <span>Hours: <span style={{ color: c.t2, fontWeight: 600 }}>{sp.attendance.lastAttendance.totalHours}h</span></span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ═══ Attendance Tab ═══ */}
        {tab === 'attendance' && (
          <>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 20px', letterSpacing: '-0.5px' }}>Attendance Logs</h2>
            <div style={{ background: c.s1, border: `1px solid ${c.border}`, borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${c.border}`, color: c.t4, textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Salesperson</th>
                    <th style={{ padding: '12px 8px', fontWeight: 600 }}>Date</th>
                    <th style={{ padding: '12px 8px', fontWeight: 600 }}>Login</th>
                    <th style={{ padding: '12px 8px', fontWeight: 600 }}>Logout</th>
                    <th style={{ padding: '12px 8px', fontWeight: 600 }}>Hours</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: c.t4 }}>Loading...</td></tr>
                  ) : attendance.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: c.t4 }}>No attendance records found.</td></tr>
                  ) : attendance.map((log) => (
                    <tr key={log.id} style={{ borderTop: `1px solid ${c.border}` }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{log.salesperson?.name || log.salesperson?.loginId || '—'}</td>
                      <td style={{ padding: '12px 8px', color: c.t2 }}>{fmtDate(log.date)}</td>
                      <td style={{ padding: '12px 8px', color: c.t2 }}>{fmtTime(log.loginTime)}</td>
                      <td style={{ padding: '12px 8px', color: c.t2 }}>{log.logoutTime ? fmtTime(log.logoutTime) : '—'}</td>
                      <td style={{ padding: '12px 8px', color: c.t2 }}>{log.totalHours ? `${Number(log.totalHours).toFixed(2)}h` : '—'}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}><Badge status={log.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {attPagination.totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 16 }}>
                <button
                  disabled={attPagination.page <= 1}
                  onClick={() => loadAttendance(attPagination.page - 1)}
                  style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${c.border}`, background: 'transparent', color: attPagination.page <= 1 ? c.t4 : c.t2, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                >
                  Previous
                </button>
                <span style={{ fontSize: 12, color: c.t3 }}>Page {attPagination.page} of {attPagination.totalPages}</span>
                <button
                  disabled={attPagination.page >= attPagination.totalPages}
                  onClick={() => loadAttendance(attPagination.page + 1)}
                  style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${c.border}`, background: 'transparent', color: attPagination.page >= attPagination.totalPages ? c.t4 : c.t2, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Order detail modal */}
        {selectedOrder && <OrderDetail order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
      </main>
    </div>
  );
}
