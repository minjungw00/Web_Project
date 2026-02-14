import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import App from './App';

describe('App', () => {
  it('renders the maintenance heading', () => {
    render(<App />);

    expect(screen.getByText(/Working on the site.../i)).not.toBeNull();
  });
});
