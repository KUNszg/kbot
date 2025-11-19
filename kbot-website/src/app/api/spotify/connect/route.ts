import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

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

      const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;

      return NextResponse.redirect(authUrl);
    }

    if (code && state === session.user.id) {
      try {
        console.log('Starting token exchange...');
        console.log('Code length:', code.length);
        console.log('State matches user ID:', state === session.user.id);
        console.log('Redirect URI:', `${process.env.NEXTAUTH_URL}/api/spotify/connect`);

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

        console.log('Token response status:', tokenResponse.status);
        console.log('Token response status text:', tokenResponse.statusText);

        const tokenData = await tokenResponse.json();
        console.log('Token response data:', tokenData);

        if (tokenResponse.ok) {
          console.log('Token exchange successful, fetching profile...');

          const profileResponse = await fetch('https://api.spotify.com/v1/me', {
            headers: {
              Authorization: `Bearer ${tokenData.access_token}`
            }
          });

          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            console.log('Profile fetch successful for user:', profileData.display_name);

            const { UserModel } = await import('@/lib/models/User');
            const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

            await UserModel.addConnectedApp({
              user_id: session.user.id,
              app_name: 'Spotify',
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

            console.log('Successfully saved Spotify connection to database');

            return NextResponse.redirect(
              `${process.env.NEXTAUTH_URL}/account?connected=spotify`
            );
          } else {
            const profileError = await profileResponse.json();
            console.error('Spotify profile fetch failed:', profileError);
            return NextResponse.json(
              {
                error: 'Failed to fetch Spotify profile',
                details: profileError
              },
              { status: 400 }
            );
          }
        } else {
          console.error('Spotify token exchange failed:', tokenData);
          return NextResponse.json(
            {
              error: 'Failed to connect Spotify',
              spotifyError: tokenData
            },
            { status: 400 }
          );
        }
      } catch (tokenError) {
        console.error('Error during token exchange:', tokenError);
        return NextResponse.json(
          {
            error: 'Token exchange failed',
            details: tokenError instanceof Error ? tokenError.message : 'Unknown error'
          },
          { status: 500 }
        );
      }
    }

    console.log('Invalid request - missing code or state mismatch');
    console.log('Code present:', !!code);
    console.log('State:', state);
    console.log('Expected state (user ID):', session.user.id);

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Error connecting Spotify:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
