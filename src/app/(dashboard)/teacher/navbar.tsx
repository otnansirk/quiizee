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
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "#111827",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              color: "#fff",
              fontSize: "1.1rem",
              boxShadow: "3px 3px 0px #2563eb",
            }}
          >
            Q
          </div>
          <span style={{ fontSize: "1.25rem", fontWeight: 900, color: "#111827", letterSpacing: "-0.03em" }}>
            QUIIZEE <span style={{ fontSize: "0.8rem", background: "#111827", color: "#fff", padding: "0.15rem 0.4rem", borderRadius: "4px", verticalAlign: "middle" }}>&apos;26</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="teacher-nav-links">
          <Link
            href="/teacher/quizzes"
            className={`teacher-nav-link ${isActive('/teacher/quizzes') ? 'active' : ''}`}
          >
            My Quizzes
          </Link>
          <Link
            href="/teacher/reviews"
            className={`teacher-nav-link ${isActive('/teacher/reviews') ? 'active' : ''}`}
          >
            Essay Reviews
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
            className="btn btn-sm"
            style={{
              background: '#dc2626',
              color: '#ffffff',
              borderColor: '#111827',
              boxShadow: '2px 2px 0px #111827',
              fontWeight: 800,
            }}
            title="Sign Out of Teacher Portal"
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}
