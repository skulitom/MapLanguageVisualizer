import type { ReactNode } from 'react';

interface MainLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
}

export default function MainLayout({ sidebar, children }: MainLayoutProps) {
  return (
    <div className="main-layout">
      <div className="sidebar-container">{sidebar}</div>
      <div className="map-container">{children}</div>
    </div>
  );
}
