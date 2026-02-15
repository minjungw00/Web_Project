import { Fragment, useState } from 'react';

import '@/App.css';
import working from '@/assets/minjungw00_working_nobg.png';

interface HealthResponse {
  status?: string;
  [key: string]: unknown;
}

const HomePage = (): React.ReactElement => {
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
      const resp = await fetch('/api/actuator/health');
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
    <Fragment>
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
      <p>The site is currently under construction.</p>
      <div className="card">
        <button onClick={() => setCount((prev) => prev + 1)} type="button">
          count is {count}
        </button>
        <button onClick={checkServerHealth} type="button">
          {loading
            ? 'Checking server status...'
            : 'Check server status (/api/actuator/health)'}
        </button>
        {Boolean(error) && (
          <p style={{ color: 'crimson' }}>Request failed: {error}</p>
        )}
        {Boolean(data) && (
          <pre className="response-block">{JSON.stringify(data, null, 2)}</pre>
        )}
        <button onClick={checkDbHealth} type="button">
          {dbLoading
            ? 'Checking DB status...'
            : 'Check DB status (/api/db/health)'}
        </button>
        {Boolean(dbError) && (
          <p style={{ color: 'crimson' }}>Request failed: {dbError}</p>
        )}
        {Boolean(dbData) && (
          <pre className="response-block">
            {JSON.stringify(dbData, null, 2)}
          </pre>
        )}
      </div>
    </Fragment>
  );
};

export default HomePage;
