import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { prisma } from './prisma';
import { auditAuthentication, auditSession } from './audit';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions['adapter'],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
  },
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

        // Extract IP and User Agent for audit logging
        const ipAddress = req?.headers?.['x-forwarded-for'] || req?.headers?.['x-real-ip'] || 'unknown';
        const userAgent = req?.headers?.['user-agent'] || 'unknown';

        if (!user || user.locked || !user.password) {
          // Log failed login attempt if user exists
          if (user) {
            await auditAuthentication(
              user.id,
              'LOGIN_FAILED',
              { 
                reason: user.locked ? 'account_locked' : 'invalid_credentials',
                email: credentials.email 
              },
              ipAddress as string,
              userAgent as string
            );
          }
          return null;
        }

        // Validate password
        const isPasswordValid = await compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          // Log failed login attempt
          await auditAuthentication(
            user.id,
            'LOGIN_FAILED',
            { 
              reason: 'invalid_password',
              email: credentials.email 
            },
            ipAddress as string,
            userAgent as string
          );
          return null;
        }

        // Log successful login
        await auditAuthentication(
          user.id,
          'LOGIN',
          { 
            email: credentials.email,
            loginMethod: 'credentials'
          },
          ipAddress as string,
          userAgent as string
        );

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          permissions: user.permissions,
          passwordResetRequired: user.passwordResetRequired,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.permissions = user.permissions;
        token.passwordResetRequired = user.passwordResetRequired;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.permissions = token.permissions;
        session.user.passwordResetRequired = token.passwordResetRequired;
      }
      return session;
    },
  },
};
