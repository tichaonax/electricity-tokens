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
    signOut: '/', // Redirect to homepage after logout
  },
  // Disable callback URL to prevent parameter pollution
  useSecureCookies: process.env.NODE_ENV === 'production',
  secret: process.env.NEXTAUTH_SECRET,
  // Disable automatic callback URL generation
  trustHost: true,
  // Remove hardcoded NEXTAUTH_URL - NextAuth will auto-detect from request headers
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        console.log('🔍 AUTH DEBUG: Starting authorization...');
        console.log('🔍 AUTH DEBUG: prisma object exists:', !!prisma);
        console.log('🔍 AUTH DEBUG: prisma.user exists:', !!prisma.user);
        console.log('🔍 AUTH DEBUG: typeof prisma.user:', typeof prisma.user);
        console.log('🔍 AUTH DEBUG: Available models:', Object.keys(prisma).filter(key => typeof prisma[key] === 'object' && prisma[key] && typeof prisma[key].findUnique === 'function'));
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ AUTH DEBUG: Missing credentials');
          return null;
        }

        let user;
        try {
          console.log('🔍 AUTH DEBUG: Attempting prisma.user.findUnique...');
          user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });
          console.log('✅ AUTH DEBUG: prisma.user.findUnique completed, user found:', !!user);
        } catch (error) {
          console.error('❌ AUTH DEBUG: Error in prisma.user.findUnique:', error);
          throw error;
        }

        // Extract IP and User Agent for audit logging
        const ipAddress = req?.headers?.['x-forwarded-for'] || req?.headers?.['x-real-ip'] || 'unknown';
        const userAgent = req?.headers?.['user-agent'] || 'unknown';

        // TEMPORARY DEBUG: Log user state for debugging
        console.log('AUTH DEBUG - Email:', credentials.email);
        console.log('AUTH DEBUG - User found:', !!user);
        if (user) {
          console.log('AUTH DEBUG - User locked:', user.locked);
          console.log('AUTH DEBUG - User has password:', !!user.password);
          console.log('AUTH DEBUG - User isActive:', user.isActive);
          console.log('AUTH DEBUG - User deactivationReason:', user.deactivationReason);
        }

        if (!user || user.locked || !user.password || !user.isActive) {
          // Log failed login attempt if user exists
          if (user) {
            try {
              await auditAuthentication(
                user.id,
                'LOGIN_FAILED',
                { 
                  reason: user.locked ? 'account_locked' : 
                          !user.isActive ? 'account_deactivated' : 
                          'invalid_credentials',
                  email: credentials.email,
                  deactivationReason: !user.isActive ? user.deactivationReason : undefined
                },
                ipAddress as string,
                userAgent as string
              );
            } catch (error) {
              console.error('Failed to log authentication audit:', error);
              // Don't throw - allow auth to proceed
            }
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
          try {
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
          } catch (error) {
            console.error('Failed to log authentication audit:', error);
            // Don't throw - allow auth to proceed
          }
          return null;
        }

        // Update last login timestamp
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
          });
        } catch (error) {
          console.error('Failed to update last login timestamp:', error);
          // Don't throw - allow auth to proceed
        }

        // Log successful login
        try {
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
        } catch (error) {
          console.error('Failed to log authentication audit:', error);
          // Don't throw - allow auth to proceed
        }

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
    async redirect({ url, baseUrl }) {
      // Handle logout - if URL is explicitly set to homepage, respect it
      if (url === baseUrl || url === `${baseUrl}/`) {
        return baseUrl;
      }
      // For login redirects, ignore callback URLs and go to dashboard
      return `${baseUrl}/dashboard`;
    },
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
  events: {
    async signOut({ token }) {
      // Log logout event - wrap in try/catch to prevent auth failures
      try {
        if (token?.sub) {
          await auditAuthentication(
            token.sub,
            'LOGOUT',
            { 
              logoutMethod: 'user_initiated'
            }
          );
        }
      } catch (error) {
        console.error('Failed to log logout audit:', error);
        // Don't throw - allow logout to proceed
      }
    },
  },
};
