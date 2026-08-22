import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      const scopes = [
        'user-read-email',
        'user-read-private',
        'user-read-currently-playing',
        'user-read-playback-state',
        'user-modify-playback-state',
        'playlist-read-private',
        'playlist-read-collaborative'
      ].join(' ');

      const params = new URLSearchParams({
        response_type: 'code',
        client_id: process.env.SPOTIFY_CLIENT_ID!,
        scope: scopes,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/spotify/connect`,
        state: session.user.id
      });

      return NextResponse.redirect(
        `https://accounts.spotify.com/authorize?${params.toString()}`
      );
    }

    if (code && state === session.user.id) {
      try {
        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: `${process.env.NEXTAUTH_URL}/api/spotify/connect`
          })
        });

        const tokenData = await tokenResponse.json();

        if (tokenResponse.ok) {
          const profileResponse = await fetch('https://api.spotify.com/v1/me', {
            headers: {
              Authorization: `Bearer ${tokenData.access_token}`
            }
          });

          if (profileResponse.ok) {
            const profileData = await profileResponse.json();

            const { UserModel } = await import('@/lib/models/User');
            const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

            const appName = profileData.display_name
              ? `${profileData.display_name}`
              : 'Spotify';

            await UserModel.addConnectedApp({
              user_id: session.user.id,
              app_name: appName,
              app_type: 'spotify',
              access_token: tokenData.access_token,
              refresh_token: tokenData.refresh_token,
              expires_at: expiresAt,
              permissions: [
                'user-read-email',
                'user-read-private',
                'user-read-currently-playing'
              ]
            });

            return NextResponse.redirect(
              `${process.env.NEXTAUTH_URL}/account?connected=spotify`
            );
          } else {
            console.error('Spotify profile fetch failed');
            return NextResponse.redirect(
              `${process.env.NEXTAUTH_URL}/account?error=spotify_profile_failed`
            );
          }
        } else {
          console.error('Spotify token exchange failed', tokenData);
          return NextResponse.redirect(
            `${process.env.NEXTAUTH_URL}/account?error=spotify_token_failed`
          );
        }
      } catch (tokenError) {
        console.error('Error during token exchange:', tokenError);
        return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/account?error=server_error`);
      }
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Error connecting Spotify:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
