import React, { useState } from 'react';

import './App.css';
import working from './assets/minjungw00_working_nobg.png';

interface HealthResponse {
  status?: string;
  [key: string]: unknown;
}

const App = (): React.ReactElement => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<HealthResponse | null>(null);
  const [dbLoading, setDbLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [dbData, setDbData] = useState<HealthResponse | null>(null);

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

  const checkDbHealth = async (): Promise<void> => {
    setDbLoading(true);
    setDbError(null);
    setDbData(null);
    try {
      const resp = await fetch('/api/db/health');
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }
      const json = (await resp.json()) as HealthResponse;
      setDbData(json);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setDbError(msg);
    } finally {
      setDbLoading(false);
    }
  };

  return (
    <React.Fragment>
      <div>
        <a
          href="https://github.com/minjungw00/Web_Project"
          rel="noreferrer"
          target="_blank"
        >
          <img alt="Working" className="logo" src={working} />
        </a>
      </div>
      <h1>Working on the site...</h1>
      <p>현재 사이트가 작업 중입니다.</p>
      <div className="card">
        <button onClick={() => setCount((prev) => prev + 1)} type="button">
          count is {count}
        </button>
        <button onClick={checkServerHealth} type="button">
          {loading ? '서버 상태 확인 중…' : '서버 상태 확인 (/api/health)'}
        </button>
        {Boolean(error) && (
          <p style={{ color: 'crimson' }}>요청 실패: {error}</p>
        )}
        {Boolean(data) && (
          <pre className="response-block">{JSON.stringify(data, null, 2)}</pre>
        )}
        <button onClick={checkDbHealth} type="button">
          {dbLoading ? 'DB 상태 확인 중…' : 'DB 상태 확인 (/api/db/health)'}
        </button>
        {Boolean(dbError) && (
          <p style={{ color: 'crimson' }}>요청 실패: {dbError}</p>
        )}
        {Boolean(dbData) && (
          <pre className="response-block">
            {JSON.stringify(dbData, null, 2)}
          </pre>
        )}
      </div>
    </React.Fragment>
  );
};

export default App;
