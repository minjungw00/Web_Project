import RouterProvider from '@/app/providers/RouterProvider';
import SeoProvider from '@/app/providers/SeoProvider';

const App = (): React.ReactElement => (
  <SeoProvider>
    <RouterProvider />
  </SeoProvider>
);

export default App;
