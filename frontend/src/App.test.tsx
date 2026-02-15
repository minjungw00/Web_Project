import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import HomePage from '@/pages/home/HomePage';

describe('HomePage', () => {
  it('renders the maintenance heading', () => {
    render(<HomePage />);

    expect(screen.getByText(/Working on the site.../i)).not.toBeNull();
  });
});
