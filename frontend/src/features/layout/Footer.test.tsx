import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import Footer from '@/features/layout/Footer';
import { STORAGE_KEY } from '@/shared/i18n';

describe('Footer i18n switch', () => {
  it('switches language between English and Korean', async () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );

    expect(screen.getByText('Privacy')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '한국어' }));

    await waitFor(() => {
      expect(screen.getByText('개인정보')).toBeInTheDocument();
    });
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('ko');

    fireEvent.click(screen.getByRole('button', { name: 'English' }));

    await waitFor(() => {
      expect(screen.getByText('Privacy')).toBeInTheDocument();
    });
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('en');
  });
});
