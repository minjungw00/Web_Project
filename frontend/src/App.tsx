import React, { useState } from 'react';

import './App.css';
import reactLogo from './assets/react.svg';

interface HealthResponse {
  status?: string;
  [key: string]: unknown;
}

const App = (): React.ReactElement => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<HealthResponse | null>(null);

  const checkServerHealth = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const resp = await fetch('/api/health');
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }
      const json = (await resp.json()) as HealthResponse;
      setData(json);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <React.Fragment>
      <div>
        <a href="https://vite.dev" rel="noreferrer" target="_blank">
          <img alt="Vite logo" className="logo" src="/vite.svg" />
        </a>
        <a href="https://react.dev" rel="noreferrer" target="_blank">
          <img alt="React logo" className="logo react" src={reactLogo} />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((prev) => prev + 1)} type="button">
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
        <hr />
        <button onClick={checkServerHealth} type="button">
          {loading ? '서버 상태 확인 중…' : '서버 상태 확인 (/api/health)'}
        </button>
        {Boolean(error) && (
          <p style={{ color: 'crimson' }}>요청 실패: {error}</p>
        )}
        {data ? (
          <pre
            style={{
              textAlign: 'left',
              background: '#111827',
              color: '#e5e7eb',
              padding: '12px',
              borderRadius: 8,
              overflowX: 'auto',
              marginTop: 8,
            }}
          >
            {JSON.stringify(data, null, 2)}
          </pre>
        ) : null}
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </React.Fragment>
  );
};

export default App;
