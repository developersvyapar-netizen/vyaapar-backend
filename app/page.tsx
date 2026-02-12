'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────────────────
interface ApiResponse {
  endpoint: string;
  method: string;
  status: number;
  body: Record<string, unknown>;
  timestamp: string;
}

interface User {
  id: string;
  loginId: string;
  email: string;
  name: string | null;
  role: string;
  isActive?: boolean;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  price: string | number;
  unit: string | null;
}

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: string | number;
  product: { id: string; name: string; sku: string; unit: string | null };
}

interface Cart {
  id: string;
  salespersonId: string;
  buyerId: string | null;
  supplierId: string | null;
  buyer: { id: string; name: string; loginId: string; role: string } | null;
  supplier: { id: string; name: string; loginId: string; role: string } | null;
  items: CartItem[];
}

// ─── API helper ──────────────────────────────────────────────────────
async function api(
  method: string,
  path: string,
  token: string | null,
  body?: unknown
): Promise<{ status: number; data: Record<string, unknown> }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(path, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json().catch(() => ({ error: 'Failed to parse JSON' }));
  return { status: res.status, data };
}

// ─── Styles ──────────────────────────────────────────────────────────
const colors = {
  bg: '#0a0a0a',
  surface: '#141414',
  surfaceHover: '#1a1a1a',
  border: '#262626',
  borderFocus: '#525252',
  text: '#fafafa',
  textMuted: '#a3a3a3',
  textDim: '#737373',
  primary: '#3b82f6',
  primaryHover: '#2563eb',
  success: '#22c55e',
  successBg: '#052e16',
  danger: '#ef4444',
  dangerBg: '#450a0a',
  dangerHover: '#dc2626',
  warning: '#f59e0b',
  warningBg: '#451a03',
  accent: '#8b5cf6',
};

const baseCard: React.CSSProperties = {
  background: colors.surface,
  border: `1px solid ${colors.border}`,
  borderRadius: '12px',
  padding: '20px',
};

const baseBtn: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: '8px',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '13px',
  transition: 'all 0.15s',
};

const primaryBtn: React.CSSProperties = {
  ...baseBtn,
  background: colors.primary,
  color: '#fff',
};

const dangerBtn: React.CSSProperties = {
  ...baseBtn,
  background: colors.danger,
  color: '#fff',
};

const ghostBtn: React.CSSProperties = {
  ...baseBtn,
  background: 'transparent',
  color: colors.textMuted,
  border: `1px solid ${colors.border}`,
};

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: '8px',
  border: `1px solid ${colors.border}`,
  background: colors.bg,
  color: colors.text,
  fontSize: '14px',
  outline: 'none',
  width: '100%',
};

const labelStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: colors.textMuted,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  marginBottom: '4px',
  display: 'block',
};

const badge = (color: string, bg: string): React.CSSProperties => ({
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: '4px',
  fontSize: '11px',
  fontWeight: 700,
  color,
  background: bg,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
});

// ─── Main App ────────────────────────────────────────────────────────
export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [logs, setLogs] = useState<ApiResponse[]>([]);

  // Data
  const [products, setProducts] = useState<Product[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [cart, setCart] = useState<Cart | null>(null);
  const [orders, setOrders] = useState<unknown[]>([]);

  // Form state
  const [loginId, setLoginId] = useState('salesperson1');
  const [password, setPassword] = useState('password123');
  const [checkoutNotes, setCheckoutNotes] = useState('');

  // Loading
  const [loading, setLoading] = useState<string | null>(null);

  const log = useCallback((entry: ApiResponse) => {
    setLogs((prev) => [entry, ...prev].slice(0, 50));
  }, []);

  const call = useCallback(
    async (method: string, path: string, body?: unknown, label?: string) => {
      const tag = label || `${method} ${path}`;
      setLoading(tag);
      try {
        const { status, data } = await api(method, path, token, body);
        log({
          endpoint: path,
          method,
          status,
          body: data,
          timestamp: new Date().toLocaleTimeString(),
        });
        return { status, data };
      } finally {
        setLoading(null);
      }
    },
    [token, log]
  );

  // ─── Auth ────────────────────────────────────────────────────────
  async function handleLogin() {
    setLoading('login');
    const { status, data } = await api('POST', '/api/auth/login', null, { loginId, password });
    log({ endpoint: '/api/auth/login', method: 'POST', status, body: data, timestamp: new Date().toLocaleTimeString() });
    if (data.success && data.data) {
      const d = data.data as { token: string; user: User };
      setToken(d.token);
      setCurrentUser(d.user);
    }
    setLoading(null);
  }

  function handleLogout() {
    setToken(null);
    setCurrentUser(null);
    setCart(null);
    setProducts([]);
    setAllUsers([]);
    setOrders([]);
  }

  // ─── Data loaders ────────────────────────────────────────────────
  const loadProducts = useCallback(async () => {
    const res = await call('GET', '/api/products', undefined, 'Load Products');
    if (res?.data?.success) setProducts((res.data.data as Product[]) || []);
  }, [call]);

  const loadUsers = useCallback(async () => {
    const res = await call('GET', '/api/users', undefined, 'Load Users');
    if (res?.data?.success) setAllUsers((res.data.data as User[]) || []);
  }, [call]);

  const loadCart = useCallback(async () => {
    const res = await call('GET', '/api/cart', undefined, 'Load Cart');
    if (res?.data?.success) setCart((res.data.data as Cart) || null);
  }, [call]);

  const loadOrders = useCallback(async () => {
    const res = await call('GET', '/api/dashboard/salesperson', undefined, 'Load Orders');
    if (res?.data?.success) {
      const d = res.data.data as { orders: unknown[] };
      setOrders(d?.orders || []);
    }
  }, [call]);

  useEffect(() => {
    if (token) {
      loadProducts();
      loadUsers();
      loadCart();
      loadOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ─── Cart actions ────────────────────────────────────────────────
  async function addToCart(productId: string, quantity: number) {
    await call('POST', '/api/cart/items', { productId, quantity }, 'Add to Cart');
    loadCart();
  }

  async function removeFromCart(itemId: string) {
    await call('DELETE', `/api/cart/items/${itemId}`, undefined, 'Remove Item');
    loadCart();
  }

  async function updateCartItem(itemId: string, quantity: number) {
    await call('PUT', `/api/cart/items/${itemId}`, { quantity }, 'Update Item');
    loadCart();
  }

  async function setBuyer(buyerId: string) {
    await call('PUT', '/api/cart/buyer', { buyerId }, 'Set Buyer');
    loadCart();
  }

  async function setSupplier(supplierId: string) {
    await call('PUT', '/api/cart/supplier', { supplierId }, 'Set Supplier');
    loadCart();
  }

  async function clearCart() {
    await call('DELETE', '/api/cart', undefined, 'Clear Cart');
    loadCart();
  }

  async function handleCheckout() {
    const body = checkoutNotes ? { notes: checkoutNotes } : {};
    const res = await call('POST', '/api/cart/checkout', body, 'Checkout');
    if (res?.data?.success) {
      setCheckoutNotes('');
      loadCart();
      loadOrders();
    }
  }

  async function checkHealth() {
    await call('GET', '/api/health', undefined, 'Health Check');
  }

  // ─── Render: Login ───────────────────────────────────────────────
  if (!token) {
    return (
      <div style={{ background: colors.bg, minHeight: '100vh', color: colors.text, fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div style={{ maxWidth: 420, margin: '0 auto', padding: '80px 20px' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Vyaapar</h1>
            <p style={{ color: colors.textMuted, marginTop: 4, fontSize: 14 }}>API Testing Console</p>
          </div>

          <div style={baseCard}>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Login ID</label>
              <input style={inputStyle} value={loginId} onChange={(e) => setLoginId(e.target.value)} placeholder="e.g. salesperson1" />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Password</label>
              <input style={inputStyle} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" />
            </div>
            <button style={{ ...primaryBtn, width: '100%', padding: '10px' }} onClick={handleLogin} disabled={loading === 'login'}>
              {loading === 'login' ? 'Logging in...' : 'Login'}
            </button>
          </div>

          <div style={{ ...baseCard, marginTop: 16 }}>
            <p style={{ fontSize: 12, color: colors.textDim, margin: 0, marginBottom: 8 }}>Seed Accounts:</p>
            {[
              { id: 'admin', pw: 'admin123', role: 'ADMIN' },
              { id: 'salesperson1', pw: 'password123', role: 'SALESPERSON' },
              { id: 'retailer1', pw: 'password123', role: 'RETAILER' },
              { id: 'distributor1', pw: 'password123', role: 'DISTRIBUTOR' },
              { id: 'stockist1', pw: 'password123', role: 'STOCKIST' },
            ].map((a) => (
              <button
                key={a.id}
                onClick={() => { setLoginId(a.id); setPassword(a.pw); }}
                style={{ ...ghostBtn, fontSize: 12, padding: '4px 10px', margin: '2px 4px 2px 0' }}
              >
                {a.id} <span style={{ color: colors.textDim }}>({a.role})</span>
              </button>
            ))}
          </div>

          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <button onClick={checkHealth} style={{ ...ghostBtn, fontSize: 12 }}>
              Check /api/health
            </button>
          </div>

          {/* Log panel on login page */}
          {logs.length > 0 && <LogPanel logs={logs} onClear={() => setLogs([])} />}
        </div>
      </div>
    );
  }

  // ─── Render: Main App ────────────────────────────────────────────
  const buyers = allUsers.filter((u) => ['RETAILER', 'DISTRIBUTOR', 'STOCKIST'].includes(u.role));
  const suppliers = allUsers.filter((u) => ['DISTRIBUTOR', 'STOCKIST', 'ADMIN', 'DEVELOPER'].includes(u.role));

  return (
    <div style={{ background: colors.bg, minHeight: '100vh', color: colors.text, fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <header style={{ background: colors.surface, borderBottom: `1px solid ${colors.border}`, padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Vyaapar</h1>
          {currentUser && (
            <span style={badge(colors.primary, '#172554')}>
              {currentUser.role}
            </span>
          )}
          {currentUser && <span style={{ fontSize: 13, color: colors.textMuted }}>{currentUser.name || currentUser.loginId}</span>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {loading && <span style={{ fontSize: 12, color: colors.warning, alignSelf: 'center' }}>{loading}...</span>}
          <button onClick={() => { loadProducts(); loadUsers(); loadCart(); loadOrders(); }} style={ghostBtn}>Refresh All</button>
          <button onClick={handleLogout} style={dangerBtn}>Logout</button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, padding: 24, maxWidth: 1400, margin: '0 auto' }}>
        {/* ─── Left Column ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Products */}
          <section style={baseCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Products</h2>
              <button onClick={loadProducts} style={{ ...ghostBtn, fontSize: 11, padding: '4px 10px' }}>Reload</button>
            </div>
            {products.length === 0 ? (
              <p style={{ color: colors.textDim, fontSize: 13 }}>No products found. Run seed first.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {products.map((p) => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: colors.bg, borderRadius: 8, border: `1px solid ${colors.border}` }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</span>
                      <span style={{ color: colors.textDim, fontSize: 12, marginLeft: 8 }}>{p.sku}</span>
                      <br />
                      <span style={{ color: colors.success, fontSize: 13, fontWeight: 600 }}>₹{Number(p.price).toFixed(2)}</span>
                      {p.unit && <span style={{ color: colors.textDim, fontSize: 12 }}> / {p.unit}</span>}
                    </div>
                    <button onClick={() => addToCart(p.id, 1)} style={{ ...primaryBtn, fontSize: 12, padding: '6px 12px' }}>
                      + Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Users (Buyer / Supplier selection) */}
          <section style={baseCard}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, marginBottom: 16 }}>Set Buyer &amp; Supplier</h2>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Buyer (Retailer / Distributor / Stockist)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {buyers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setBuyer(u.id)}
                    style={{
                      ...ghostBtn,
                      fontSize: 12,
                      padding: '5px 10px',
                      ...(cart?.buyerId === u.id ? { borderColor: colors.success, color: colors.success } : {}),
                    }}
                  >
                    {u.name || u.loginId} <span style={{ color: colors.textDim }}>({u.role})</span>
                  </button>
                ))}
                {buyers.length === 0 && <span style={{ color: colors.textDim, fontSize: 12 }}>No buyers available</span>}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Supplier (Distributor / Stockist / Admin)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {suppliers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setSupplier(u.id)}
                    style={{
                      ...ghostBtn,
                      fontSize: 12,
                      padding: '5px 10px',
                      ...(cart?.supplierId === u.id ? { borderColor: colors.success, color: colors.success } : {}),
                    }}
                  >
                    {u.name || u.loginId} <span style={{ color: colors.textDim }}>({u.role})</span>
                  </button>
                ))}
                {suppliers.length === 0 && <span style={{ color: colors.textDim, fontSize: 12 }}>No suppliers available</span>}
              </div>
            </div>
          </section>

          {/* Orders */}
          <section style={baseCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Recent Orders</h2>
              <button onClick={loadOrders} style={{ ...ghostBtn, fontSize: 11, padding: '4px 10px' }}>Reload</button>
            </div>
            {(orders as Array<Record<string, unknown>>).length === 0 ? (
              <p style={{ color: colors.textDim, fontSize: 13 }}>No orders yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(orders as Array<Record<string, unknown>>).slice(0, 10).map((o, i) => (
                  <div key={i} style={{ padding: '10px 12px', background: colors.bg, borderRadius: 8, border: `1px solid ${colors.border}`, fontSize: 13 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600 }}>{o.orderNumber as string}</span>
                      <span style={badge(
                        o.status === 'PENDING' ? colors.warning : o.status === 'APPROVED' ? colors.success : colors.danger,
                        o.status === 'PENDING' ? colors.warningBg : o.status === 'APPROVED' ? colors.successBg : colors.dangerBg
                      )}>
                        {o.status as string}
                      </span>
                    </div>
                    <div style={{ color: colors.textDim, fontSize: 12, marginTop: 4 }}>
                      ₹{Number(o.totalAmount).toFixed(2)} &middot; {new Date(o.createdAt as string).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ─── Right Column ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Cart */}
          <section style={{ ...baseCard, border: `1px solid ${colors.borderFocus}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                Cart
                {cart?.items?.length ? <span style={{ color: colors.textMuted, fontWeight: 400 }}> ({cart.items.length} items)</span> : null}
              </h2>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={loadCart} style={{ ...ghostBtn, fontSize: 11, padding: '4px 10px' }}>Reload</button>
                <button onClick={clearCart} style={{ ...ghostBtn, fontSize: 11, padding: '4px 10px', color: colors.danger, borderColor: colors.danger }}>Clear</button>
              </div>
            </div>

            {/* Buyer/Supplier Info */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, padding: '8px 12px', background: colors.bg, borderRadius: 8, border: `1px solid ${colors.border}` }}>
                <span style={{ fontSize: 11, color: colors.textDim, textTransform: 'uppercase', fontWeight: 600 }}>Buyer</span>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>
                  {cart?.buyer ? (
                    <>{cart.buyer.name || cart.buyer.loginId} <span style={{ color: colors.textDim, fontWeight: 400 }}>({cart.buyer.role})</span></>
                  ) : (
                    <span style={{ color: colors.danger }}>Not set</span>
                  )}
                </div>
              </div>
              <div style={{ flex: 1, padding: '8px 12px', background: colors.bg, borderRadius: 8, border: `1px solid ${colors.border}` }}>
                <span style={{ fontSize: 11, color: colors.textDim, textTransform: 'uppercase', fontWeight: 600 }}>Supplier</span>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>
                  {cart?.supplier ? (
                    <>{cart.supplier.name || cart.supplier.loginId} <span style={{ color: colors.textDim, fontWeight: 400 }}>({cart.supplier.role})</span></>
                  ) : (
                    <span style={{ color: colors.danger }}>Not set</span>
                  )}
                </div>
              </div>
            </div>

            {/* Cart Items */}
            {(!cart?.items || cart.items.length === 0) ? (
              <p style={{ color: colors.textDim, fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Cart is empty. Add products from the left panel.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {cart.items.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: colors.bg, borderRadius: 8, border: `1px solid ${colors.border}` }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{item.product.name}</span>
                      <span style={{ color: colors.textDim, fontSize: 12, marginLeft: 6 }}>{item.product.sku}</span>
                      <br />
                      <span style={{ color: colors.textMuted, fontSize: 12 }}>₹{Number(item.unitPrice).toFixed(2)} x {item.quantity} = </span>
                      <span style={{ color: colors.success, fontSize: 13, fontWeight: 600 }}>₹{(Number(item.unitPrice) * item.quantity).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button onClick={() => updateCartItem(item.id, Math.max(1, item.quantity - 1))} style={{ ...ghostBtn, padding: '4px 8px', fontSize: 12 }}>-</button>
                      <span style={{ fontSize: 14, fontWeight: 600, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                      <button onClick={() => updateCartItem(item.id, item.quantity + 1)} style={{ ...ghostBtn, padding: '4px 8px', fontSize: 12 }}>+</button>
                      <button onClick={() => removeFromCart(item.id)} style={{ ...ghostBtn, padding: '4px 8px', fontSize: 12, color: colors.danger, borderColor: colors.danger, marginLeft: 4 }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Cart Total */}
            {cart?.items && cart.items.length > 0 && (
              <div style={{ padding: '12px', background: colors.bg, borderRadius: 8, border: `1px solid ${colors.border}`, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700 }}>
                  <span>Total</span>
                  <span style={{ color: colors.success }}>
                    ₹{cart.items.reduce((s, i) => s + Number(i.unitPrice) * i.quantity, 0).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Checkout */}
            <div style={{ marginBottom: 8 }}>
              <label style={labelStyle}>Order Notes (optional)</label>
              <input
                style={inputStyle}
                value={checkoutNotes}
                onChange={(e) => setCheckoutNotes(e.target.value)}
                placeholder="Any notes for this order..."
              />
            </div>
            <button
              onClick={handleCheckout}
              disabled={!cart?.items?.length || !cart?.buyerId || !cart?.supplierId || loading === 'Checkout'}
              style={{
                ...primaryBtn,
                width: '100%',
                padding: '12px',
                fontSize: 15,
                opacity: (!cart?.items?.length || !cart?.buyerId || !cart?.supplierId) ? 0.4 : 1,
                background: colors.success,
              }}
            >
              {loading === 'Checkout' ? 'Processing...' : 'Checkout — Create Order'}
            </button>
            {(!cart?.buyerId || !cart?.supplierId) && cart?.items && cart.items.length > 0 && (
              <p style={{ color: colors.warning, fontSize: 12, marginTop: 8, textAlign: 'center' }}>
                Set both buyer and supplier before checkout.
              </p>
            )}
          </section>

          {/* API Response Log */}
          <LogPanel logs={logs} onClear={() => setLogs([])} />
        </div>
      </div>
    </div>
  );
}

// ─── Log Panel Component ─────────────────────────────────────────────
function LogPanel({ logs, onClear }: { logs: ApiResponse[]; onClear: () => void }) {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <section style={{ ...baseCard, marginTop: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
          API Responses <span style={{ color: colors.textDim, fontWeight: 400, fontSize: 13 }}>({logs.length})</span>
        </h2>
        <button onClick={onClear} style={{ ...ghostBtn, fontSize: 11, padding: '4px 10px' }}>Clear</button>
      </div>
      <div style={{ maxHeight: 500, overflowY: 'auto' }}>
        {logs.length === 0 ? (
          <p style={{ color: colors.textDim, fontSize: 13 }}>No API calls yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {logs.map((entry, i) => {
              const isError = entry.status >= 400;
              const isExpanded = expanded === i;
              return (
                <div
                  key={i}
                  style={{
                    background: colors.bg,
                    borderRadius: 8,
                    border: `1px solid ${isError ? '#7f1d1d' : colors.border}`,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    onClick={() => setExpanded(isExpanded ? null : i)}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={badge(
                        isError ? colors.danger : colors.success,
                        isError ? colors.dangerBg : colors.successBg
                      )}>
                        {entry.status}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted }}>{entry.method}</span>
                      <span style={{ fontSize: 12, color: colors.text }}>{entry.endpoint}</span>
                    </div>
                    <span style={{ fontSize: 11, color: colors.textDim }}>{entry.timestamp}</span>
                  </div>
                  {isExpanded && (
                    <div style={{ padding: '0 12px 12px', borderTop: `1px solid ${colors.border}` }}>
                      <pre style={{
                        margin: '8px 0 0',
                        padding: 12,
                        background: '#0d0d0d',
                        borderRadius: 6,
                        fontSize: 12,
                        lineHeight: 1.5,
                        color: isError ? '#fca5a5' : '#bbf7d0',
                        overflow: 'auto',
                        maxHeight: 300,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}>
                        {JSON.stringify(entry.body, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
