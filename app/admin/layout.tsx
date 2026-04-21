import React from 'react';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div style={{ width: 32, height: 32, backgroundColor: 'var(--primary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            🎓
          </div>
          LCCS Portal
        </div>
        <nav className="sidebar-nav">
          <Link href="/admin/dashboard" className="nav-item">
            📊 Dashboard
          </Link>
          <Link href="/admin/workers" className="nav-item active">
            👥 Manage Staff
          </Link>
          <Link href="/admin/settings" className="nav-item">
            ⚙️ Settings
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
