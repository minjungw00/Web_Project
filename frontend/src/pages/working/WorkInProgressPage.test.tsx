import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import WorkInProgressPage from '@/pages/working/WorkInProgressPage';
import i18n from '@/shared/i18n';

describe('WorkInProgressPage i18n', () => {
  it('renders localized content and switches language', async () => {
    render(<WorkInProgressPage />);

    expect(
      screen.getByRole('heading', {
        name: 'This page is currently under construction.',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'We are preparing better content. Please check back soon.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByAltText('Work in progress image')).toBeInTheDocument();

    await i18n.changeLanguage('ko');

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: '현재 작업 중인 페이지입니다.' }),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText('더 나은 내용으로 준비 중입니다. 조금만 기다려 주세요.'),
    ).toBeInTheDocument();
    expect(screen.getByAltText('작업 중 안내 이미지')).toBeInTheDocument();
  });
});
