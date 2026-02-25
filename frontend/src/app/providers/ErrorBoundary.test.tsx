import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ErrorBoundary from '@/app/providers/ErrorBoundary';
import i18n from '@/shared/i18n';

const mockedUseRouteError = vi.fn<() => unknown>();
const mockedIsRouteErrorResponse = vi.fn<(value: unknown) => boolean>();

vi.mock('react-router-dom', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useRouteError: mockedUseRouteError,
  isRouteErrorResponse: mockedIsRouteErrorResponse,
}));

describe('ErrorBoundary', () => {
  beforeEach(async () => {
    mockedUseRouteError.mockReset();
    mockedIsRouteErrorResponse.mockReset();
    await i18n.changeLanguage('en');
  });

  it('renders localized not-found message for route 404 errors', () => {
    mockedUseRouteError.mockReturnValue({
      status: 404,
      statusText: 'Not Found',
    });
    mockedIsRouteErrorResponse.mockReturnValue(true);

    render(<ErrorBoundary />);

    expect(screen.getByText('404 Not Found')).toBeInTheDocument();
  });

  it('renders translated 404 message in Korean', async () => {
    mockedUseRouteError.mockReturnValue({
      status: 404,
      statusText: 'Not Found',
    });
    mockedIsRouteErrorResponse.mockReturnValue(true);
    await i18n.changeLanguage('ko');

    render(<ErrorBoundary />);

    await waitFor(() => {
      expect(
        screen.getByText('404 페이지를 찾을 수 없습니다.'),
      ).toBeInTheDocument();
    });
  });

  it('renders thrown error message for generic errors', () => {
    mockedUseRouteError.mockReturnValue(new Error('boom'));
    mockedIsRouteErrorResponse.mockReturnValue(false);

    render(<ErrorBoundary />);

    expect(screen.getByText('boom')).toBeInTheDocument();
  });
});
