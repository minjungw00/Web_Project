import { RouterProvider as ReactRouterProvider } from 'react-router-dom';

import router from '@/app/routes';

const RouterProvider = (): React.ReactElement => (
  <ReactRouterProvider router={router} />
);

export default RouterProvider;
