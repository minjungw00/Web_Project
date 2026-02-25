import { isRouteErrorResponse, useRouteError } from 'react-router-dom';

import ErrorPage from '@/pages/error/ErrorPage';

const ErrorBoundary = (): React.ReactElement => {
  const error = useRouteError();
  let message = 'Unexpected error';

  if (isRouteErrorResponse(error)) {
    message = `${error.status} ${error.statusText}`;
  } else if (error instanceof Error) {
    message = error.message;
  }

  return <ErrorPage message={message} />;
};

export default ErrorBoundary;
