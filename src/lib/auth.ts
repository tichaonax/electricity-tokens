import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { prisma } from './prisma';
import { auditAuthentication } from './audit';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions['adapter'],
  session: {
    strategy: 'jwt',
  },
  cookies: {
    sessionToken: {
      name: `electricity-tokens.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false, // Always false - app runs on HTTP localhost only
      },
    },
    csrfToken: {
      name: `electricity-tokens.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false, // Always false - app runs on HTTP localhost only
      },
    },
    callbackUrl: {
      name: `electricity-tokens.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: false, // Always false - app runs on HTTP localhost only
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user) {
          return null;
        }

        // Extract IP and User Agent for audit logging
        const ipAddress =
          req?.headers?.['x-forwarded-for'] ||
          req?.headers?.['x-real-ip'] ||
          'unknown';
        const userAgent = req?.headers?.['user-agent'] || 'unknown';

        if (!user.isActive) {
          // Log failed login attempt
          try {
            await auditAuthentication(
              user.id,
              'LOGIN_FAILED',
              {
                reason: 'account_deactivated',
                email: credentials.email,
                deactivationReason: user.deactivationReason,
              },
              ipAddress as string,
              userAgent as string
            );
          } catch {
            // Silent fail for audit logging
          }
          return null;
        }

        if (user.locked) {
          try {
            await auditAuthentication(
              user.id,
              'LOGIN_FAILED',
              {
                reason: 'account_locked',
                email: credentials.email,
              },
              ipAddress as string,
              userAgent as string
            );
          } catch {
            // Silent fail for audit logging
          }
          return null;
        }

        if (!user.password) {
          return null;
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          try {
            await auditAuthentication(
              user.id,
              'LOGIN_FAILED',
              {
                reason: 'invalid_password',
                email: credentials.email,
              },
              ipAddress as string,
              userAgent as string
            );
          } catch {
            // Silent fail for audit logging
          }
          return null;
        }

        // Update last login timestamp
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });
        } catch {
          // Silent fail for last login update
        }

        // Log successful login
        try {
          await auditAuthentication(
            user.id,
            'LOGIN',
            {
              email: credentials.email,
              loginMethod: 'credentials',
            },
            ipAddress as string,
            userAgent as string
          );
        } catch {
          // Silent fail for audit logging
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          // Admin users should have null permissions for automatic full access
          permissions: user.role === 'ADMIN' ? null : (user.permissions || {}),
          passwordResetRequired: user.passwordResetRequired,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const t: any = token;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        t.role = (user as any).role;
        // Admin users should have null permissions for automatic full access
        t.permissions = (user as any).role === 'ADMIN' ? null : (user as any).permissions;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        t.passwordResetRequired = (user as any).passwordResetRequired;

        // Ensure the token subject is the user id
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        t.sub = (user as any).id;
        t.sessionId = `${t.sub}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        t.loginTime = Date.now();
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const s: any = session;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const t: any = token;
        s.user = s.user || {};
        s.user.id = t.sub || s.user.id;
        s.user.role = t.role;
        s.user.permissions = t.permissions;
        s.user.passwordResetRequired = t.passwordResetRequired;
        s.sessionId = t.sessionId;
        s.loginTime = t.loginTime;
      }
      return session;
    },
  },
  events: {
    async signOut({ token, session }) {
      // Log logout event
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userId = (token as any)?.sub || (session as any)?.user?.id;
        if (userId) {
          await auditAuthentication(userId, 'LOGOUT', {
            logoutMethod: 'user_initiated',
          });
        }
      } catch {
        // Silent fail for audit logging
      }
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signin',
  },
};
