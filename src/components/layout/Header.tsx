import type { ReactNode } from 'react';
import { REPO_URL } from '../../config';
import { COUNTRY_COUNT, LANGUAGES } from '../../data/dataset';
import { GitHubIcon, GlobeLogo } from '../icons';

interface HeaderProps {
  search: ReactNode;
  share: ReactNode;
}

export default function Header({ search, share }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="brand">
        <GlobeLogo className="brand-logo" />
        <div className="brand-text">
          <h1>World Language Map</h1>
          <p className="tagline">
            Official and major languages of {COUNTRY_COUNT} countries · {LANGUAGES.length} languages
          </p>
        </div>
      </div>
      <div className="header-actions">
        {search}
        {share}
        <a
          className="header-button"
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="Source code on GitHub"
        >
          <GitHubIcon />
          <span className="header-button-label">GitHub</span>
        </a>
      </div>
    </header>
  );
}
