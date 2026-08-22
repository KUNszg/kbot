import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60
  },
  providers: [],
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user;
    },
    async jwt({ token, account, user }) {
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token as string,
          refreshToken: account.refresh_token as string,

          id: account.providerAccountId,

          username: user.name || '',
          email: user.email || '',
          image: user.image || ''
        };
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.accessToken = token.accessToken as string;
        session.user = {
          ...session.user,
          id: token.id as string,
          username: token.username as string,
          email: token.email as string,
          image: token.image as string
        };
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET
} satisfies NextAuthConfig;
