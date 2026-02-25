import { useTranslation } from 'react-i18next';
import { isRouteErrorResponse, useRouteError } from 'react-router-dom';

import ErrorPage from '@/pages/error/ErrorPage';

const ErrorBoundary = (): React.ReactElement => {
  const { t } = useTranslation();
  const error = useRouteError();
  let message = t('status.error.fallbackMessage');

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      message = t('status.error.notFound');
    } else {
      message = `${error.status} ${error.statusText}`;
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  return <ErrorPage message={message} />;
};

export default ErrorBoundary;
