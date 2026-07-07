import React from 'react';
import { auth } from '@/lib/auth';
import TeacherNavbar from './navbar';

export default async function TeacherDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      {/* Top Navigation Bar */}
      <TeacherNavbar user={session?.user} />

      {/* Main Content Container */}
      <main
        className="container animate-fade-in"
        style={{
          paddingTop: '2.5rem',
          paddingBottom: '4rem',
          flex: 1,
        }}
      >
        {children}
      </main>
    </div>
  );
}
