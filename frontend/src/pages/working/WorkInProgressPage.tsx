import { useTranslation } from 'react-i18next';

import workingImage from '@/assets/minjungw00_working_nobg.png';
import '@/shared/styles/status-page.css';

const WorkInProgressPage = (): React.ReactElement => {
  const { t } = useTranslation();

  return (
    <section aria-live="polite" className="status-page">
      <img
        alt={t('status.working.imageAlt')}
        className="status-page-media"
        src={workingImage}
      />
      <div className="status-page-copy">
        <h1>{t('status.working.title')}</h1>
        <p>{t('status.working.description')}</p>
      </div>
    </section>
  );
};

export default WorkInProgressPage;
