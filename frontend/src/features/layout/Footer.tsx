import { RiGithubFill, RiMailLine, RiSparkling2Line } from '@remixicon/react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { STORAGE_KEY } from '@/shared/i18n';
import { Category } from '@/shared/ui';

const Footer = (): React.ReactElement => {
  const { i18n, t } = useTranslation();
  const currentLanguage = i18n.resolvedLanguage?.startsWith('ko') ? 'ko' : 'en';

  const changeLanguage = (language: 'en' | 'ko'): void => {
    i18n.changeLanguage(language).catch(() => undefined);
    window.localStorage.setItem(STORAGE_KEY, language);
  };

  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        <div className="app-footer-meta">
          <Link className="app-brand" to="/">
            <span aria-hidden="true" className="app-footer-brand-icon-wrap">
              <RiSparkling2Line
                aria-hidden="true"
                className="app-footer-brand-icon"
              />
            </span>
            <span className="app-brand-name">minjungw00</span>
          </Link>
          <small>{t('footer.rights')}</small>
        </div>
        <div className="app-footer-links">
          <div className="app-footer-socials">
            <a
              aria-label="github"
              className="app-footer-icon"
              href="https://github.com/minjungw00/Web_Project"
              rel="noreferrer"
              target="_blank"
            >
              <RiGithubFill
                aria-hidden="true"
                className="app-footer-social-icon"
              />
            </a>
            <a
              aria-label="email"
              className="app-footer-icon"
              href="mailto:mjwoo0707@gmail.com"
            >
              <RiMailLine
                aria-hidden="true"
                className="app-footer-social-icon"
              />
            </a>
          </div>
          <nav
            aria-label={t('footer.legal.ariaLabel')}
            className="app-footer-legal"
          >
            <a className="app-footer-legal-link" href="#privacy">
              {t('footer.legal.privacy')}
            </a>
            <a className="app-footer-legal-link" href="#cookie">
              {t('footer.legal.cookie')}
            </a>
          </nav>
          <div
            aria-label={t('footer.language.label')}
            className="app-footer-language"
            role="group"
          >
            <Category
              aria-pressed={currentLanguage === 'ko'}
              onClick={() => changeLanguage('ko')}
              selected={currentLanguage === 'ko'}
            >
              {t('footer.language.ko')}
            </Category>
            <Category
              aria-pressed={currentLanguage === 'en'}
              onClick={() => changeLanguage('en')}
              selected={currentLanguage === 'en'}
            >
              {t('footer.language.en')}
            </Category>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
