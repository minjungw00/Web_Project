import '@testing-library/jest-dom/vitest';
import { beforeEach } from 'vitest';

import i18n, { STORAGE_KEY } from '@/shared/i18n';

beforeEach(async () => {
  window.localStorage.setItem(STORAGE_KEY, 'en');
  await i18n.changeLanguage('en');
});
