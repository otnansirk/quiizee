'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

interface TeacherNavbarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
  };
}

export default function TeacherNavbar({ user }: TeacherNavbarProps) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname?.startsWith(path);
  };

  return (
    <nav className="teacher-nav">
      <div className="teacher-nav-container">
        {/* Brand Logo */}
        <Link href="/teacher/quizzes" className="teacher-nav-brand">
          <span style={{ fontSize: '1.5rem' }}>🎓</span>
          <span className="text-gradient">Mini LMS Teacher Portal</span>
        </Link>

        {/* Navigation Links */}
        <div className="teacher-nav-links">
          <Link
            href="/teacher/quizzes"
            className={`teacher-nav-link ${isActive('/teacher/quizzes') ? 'active' : ''}`}
          >
            📊 My Quizzes
          </Link>
          <Link
            href="/teacher/reviews"
            className={`teacher-nav-link ${isActive('/teacher/reviews') ? 'active' : ''}`}
          >
            📝 Essay Reviews
          </Link>
        </div>

        {/* User Info & Sign Out */}
        <div className="teacher-nav-user">
          <div className="teacher-nav-user-info">
            <span className="teacher-nav-user-name">
              {user?.name || 'Educator Portal'}
            </span>
            <span className="teacher-nav-user-email">
              {user?.email || 'teacher@minilms.edu'}
            </span>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="btn btn-secondary btn-sm"
            style={{
              borderColor: 'rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
            }}
            title="Sign Out of Teacher Portal"
          >
            <span>🚪</span> Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}
