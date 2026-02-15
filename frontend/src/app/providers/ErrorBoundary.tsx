import { isRouteErrorResponse, useRouteError } from 'react-router-dom';

const ErrorBoundary = (): React.ReactElement => {
  const error = useRouteError();
  let message = 'Unexpected error';

  if (isRouteErrorResponse(error)) {
    message = `${error.status} ${error.statusText}`;
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div>
      <h1>Something went wrong</h1>
      <p>{message}</p>
    </div>
  );
};

export default ErrorBoundary;
