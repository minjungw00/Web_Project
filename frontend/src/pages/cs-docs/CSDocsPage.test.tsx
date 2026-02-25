import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import CSDocsPage from '@/pages/cs-docs/CSDocsPage';

describe('CSDocsPage', () => {
  it('renders docs hero content', () => {
    render(<CSDocsPage />);

    expect(
      screen.getByRole('heading', { name: /cs docs/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/knowledge graph based on neuron-synapse connections/i),
    ).toBeInTheDocument();
  });
});
