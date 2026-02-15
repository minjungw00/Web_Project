import React from 'react';

import type { ReactNode } from 'react';

interface SeoProviderProps {
  children: ReactNode;
}

const SeoProvider = ({ children }: SeoProviderProps): React.ReactElement => (
  <React.Fragment>{children}</React.Fragment>
);

export default SeoProvider;
