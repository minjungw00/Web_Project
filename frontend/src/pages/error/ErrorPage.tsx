import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import '@/shared/styles/status-page.css';

interface ErrorPageProps {
  message?: string;
}

const ErrorPage = ({ message }: ErrorPageProps): React.ReactElement => {
  const { t } = useTranslation();

  return (
    <section aria-live="polite" className="status-page">
      <div className="status-page-copy">
        <h1>{t('status.error.title')}</h1>
        <p>{message ?? t('status.error.fallbackMessage')}</p>
      </div>
      <Link className="status-page-link" to="/">
        {t('status.error.goHome')}
      </Link>
    </section>
  );
};

ErrorPage.defaultProps = {
  message: undefined,
};

export default ErrorPage;
