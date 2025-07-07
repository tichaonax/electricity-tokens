import { DefaultSession, DefaultUser } from 'next-auth';
import { DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      passwordResetRequired?: boolean;
      permissions?: any;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    role: string;
    passwordResetRequired?: boolean;
    permissions?: any;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    role: string;
    passwordResetRequired?: boolean;
    permissions?: any;
  }
}
