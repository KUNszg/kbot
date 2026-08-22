import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UserModel } from '@/lib/models/User';

export async function GET() {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connectedApps = await UserModel.getConnectedApps(session.user.id);

    const sanitizedApps = connectedApps.map(app => ({
      id: app.id,
      app_name: app.app_name,
      app_type: app.app_type,
      permissions: app.permissions,
      connected_at: app.connected_at
    }));

    return NextResponse.json({ connectedApps: sanitizedApps });
  } catch (error) {
    console.error('Error fetching connected apps:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { appType } = await request.json();

    if (!appType) {
      return NextResponse.json({ error: 'App type is required' }, { status: 400 });
    }

    const success = await UserModel.removeConnectedApp(session.user.id, appType);

    if (success) {
      return NextResponse.json({ message: 'App disconnected successfully' });
    } else {
      return NextResponse.json({ error: 'Failed to disconnect app' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error disconnecting app:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
