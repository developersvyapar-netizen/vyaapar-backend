import Link from 'next/link';

export default function Home() {
  return (
    <div
      style={{
        background: '#09090b',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        color: '#fafafa',
      }}
    >
      <h1
        style={{
          fontSize: 48,
          fontWeight: 800,
          letterSpacing: '-1.5px',
          margin: 0,
        }}
      >
        Vyapar<span style={{ color: '#3b82f6' }}>Xpress</span>
      </h1>
      <p style={{ color: '#71717a', fontSize: 16, marginTop: 8, letterSpacing: '0.5px' }}>
        Supply chain management, simplified.
      </p>
      <Link
        href="/admin-portal"
        style={{
          marginTop: 40,
          padding: '10px 24px',
          borderRadius: 8,
          border: '1px solid #27272a',
          color: '#a1a1aa',
          fontSize: 13,
          textDecoration: 'none',
          fontWeight: 500,
          transition: 'all 0.15s',
        }}
      >
        Admin Portal
      </Link>
    </div>
  );
}
