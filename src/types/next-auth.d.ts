import { type DefaultSession } from 'next-auth';

declare module 'next-auth' {
  /**
   * Returned by `useSession`, `auth`, or `getSession` and contains information about the active session.
   */
  interface Session {
    user: {
      id: string;
      role: 'teacher' | 'student';
    } & DefaultSession['user'];
  }

  /**
   * The shape of the user object returned by the `authorize` callback and passed to `jwt`.
   */
  interface User {
    id?: string;
    role?: 'teacher' | 'student';
  }
}

declare module 'next-auth/jwt' {
  /**
   * Returned by the `jwt` callback and `auth`, when using JWT sessions.
   */
  interface JWT {
    id?: string;
    role?: 'teacher' | 'student';
  }
}
