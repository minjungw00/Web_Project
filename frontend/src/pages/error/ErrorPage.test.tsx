import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import ErrorPage from '@/pages/error/ErrorPage';
import i18n from '@/shared/i18n';

describe('ErrorPage i18n', () => {
  it('renders localized fallback content and switches language', async () => {
    render(
      <MemoryRouter>
        <ErrorPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: 'Something went wrong.' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Unexpected error')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Back to Home' }),
    ).toBeInTheDocument();

    await i18n.changeLanguage('ko');

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: '문제가 발생했습니다.' }),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText('예기치 않은 오류가 발생했습니다.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '홈으로 이동' }),
    ).toBeInTheDocument();
  });

  it('renders custom message when provided', () => {
    render(
      <MemoryRouter>
        <ErrorPage message="Custom error" />
      </MemoryRouter>,
    );

    expect(screen.getByText('Custom error')).toBeInTheDocument();
  });
});
