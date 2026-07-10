import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { users } from '@/lib/db/schema';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('[AUTH] 1. authorize started', Date.now());

        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const email = credentials.email as string;
        const password = credentials.password as string;

        try {
          console.log('[AUTH] 2. before getDb()', Date.now());
          const db = getDb();
          console.log('[AUTH] 3. after getDb()', Date.now());

          console.log('[AUTH] 4. before query', Date.now());
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);
          console.log('[AUTH] 5. after query, user found:', !!user, Date.now());

          if (!user || !user.password) {
            console.log('[AUTH] 6. no user or no password, returning null');
            return null;
          }
          if (user.role !== 'teacher') {
            console.log('[AUTH] 7. wrong role, returning null');
            return null;
          }

          console.log('[AUTH] 8. before bcrypt.compare', Date.now());
          const isPasswordValid = await bcrypt.compare(password, user.password);
          console.log('[AUTH] 9. after bcrypt.compare, valid:', isPasswordValid, Date.now());

          if (!isPasswordValid) {
            return null;
          }

          console.log('[AUTH] 10. returning user object', Date.now());
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            image: user.avatar,
          };
        } catch (error) {
          console.error('[AUTH] ERROR CAUGHT:', error, Date.now());
          if (error instanceof Error && error.cause) {
            console.error('[AUTH] ERROR CAUSE:', error.cause);
          }
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role as 'teacher' | 'student';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        if (token.id) {
          session.user.id = token.id as string;
        }
        if (token.role) {
          session.user.role = token.role as 'teacher' | 'student';
        }
      }
      return session;
    },
  },
});
