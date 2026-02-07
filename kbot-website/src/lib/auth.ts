import NextAuth from 'next-auth';
import TwitchProvider from 'next-auth/providers/twitch';
import { UserModel } from './models/User';
import { authConfig } from './auth.config';
import dbConnect from './db';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    TwitchProvider({
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid user:read:email user:read:follows'
        }
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.preferred_username,
          username: profile.preferred_username,
          email: profile.email,
          image: profile.picture
        };
      }
    })
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === 'twitch') {
        try {
          await dbConnect();

          const twitchId = account.providerAccountId;

          const existingUser = await UserModel.findByTwitchId(twitchId);

          if (!existingUser) {
            await UserModel.create({
              id: twitchId,
              username: user.name || '',
              email: user.email || '',
              image: user.image || '',
              twitch_id: twitchId
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

      return true;
    }
  }
});
