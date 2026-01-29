export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Vyaapar API</h1>
      <p>Backend is running. Use /api routes.</p>
      <p>
        <a href="/api/health">/api/health</a> — Health check
      </p>
    </main>
  );
}
