import { Link } from 'react-router-dom';

import '@/shared/styles/status-page.css';

interface ErrorPageProps {
  message: string;
}

const ErrorPage = ({ message }: ErrorPageProps): React.ReactElement => (
  <section aria-live="polite" className="status-page">
    <div className="status-page-copy">
      <h1>문제가 발생했습니다.</h1>
      <p>{message}</p>
    </div>
    <Link className="status-page-link" to="/">
      홈으로 이동
    </Link>
  </section>
);

export default ErrorPage;
