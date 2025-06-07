import { NextAuthOptions } from 'next-auth';
import TwitchProvider from 'next-auth/providers/twitch';
import SpotifyProvider from 'next-auth/providers/spotify';
import { UserModel } from './models/User';

export const authOptions: NextAuthOptions = {
  providers: [
    TwitchProvider({
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid user:read:email user:read:follows'
        }
      }
    }),
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            'user-read-email user-read-private user-read-currently-playing user-read-playback-state user-modify-playback-state playlist-read-private playlist-read-collaborative'
        }
      }
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'twitch') {
        try {
          const existingUser = await UserModel.findByTwitchId(user.id);

          if (!existingUser) {
            await UserModel.create({
              id: user.id,
              username: user.name || '',
              email: user.email || '',
              image: user.image || '',
              twitch_id: user.id
            });
          } else {
            await UserModel.update(existingUser.id, {
              username: user.name || existingUser.username,
              email: user.email || existingUser.email,
              image: user.image || existingUser.image
            });
          }

          return true;
        } catch (error) {
          console.error('Error during sign in:', error);
          return false;
        }
      }

      if (account?.provider === 'spotify') {
        return true;
      }

      return true;
    },
    async jwt({ token, account, user }) {
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token as string,
          refreshToken: account.refresh_token as string,
          id: user.id,
          username: user.name || '',
          email: user.email || '',
          image: user.image || ''
        };
      }

      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;

      session.user = {
        ...session.user,
        id: token.id as string,
        username: token.username as string,
        email: token.email as string,
        image: token.image as string
      };

      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login'
  },
  debug: process.env.MODE === 'development',
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60
  }
};
