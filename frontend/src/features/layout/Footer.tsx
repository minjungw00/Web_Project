import { RiGithubFill, RiMailLine, RiSparkling2Line } from '@remixicon/react';
import { Link } from 'react-router-dom';

const Footer = (): React.ReactElement => (
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
        <small>© 2026. minjungw00. All rights reserved.</small>
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
            <RiMailLine aria-hidden="true" className="app-footer-social-icon" />
          </a>
        </div>
        <nav aria-label="legal" className="app-footer-legal">
          <a className="app-footer-legal-link" href="#privacy">
            Privacy
          </a>
          <a className="app-footer-legal-link" href="#cookie">
            Cookie
          </a>
        </nav>
      </div>
    </div>
  </footer>
);

export default Footer;
