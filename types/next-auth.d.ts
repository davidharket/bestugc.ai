// types/next-auth.d.ts

import { DefaultSession, DefaultUser } from 'next-auth';

// Extend the built-in session and user types
declare module 'next-auth' {
  /**
   * The shape of the user object returned in the session.
   * We use an intersection type (&) to add our custom properties
   * to the existing DefaultSession user object.
   */
  interface Session {
    user?: DefaultSession['user'] & {
      id: string;
      credits?: number | null;
      plan?: string | null;
    };
  }

  /**
   * Also augment the User model to include our custom fields.
   */
  interface User extends DefaultUser {
    credits?: number | null;
    plan?: string | null;
  }
}
