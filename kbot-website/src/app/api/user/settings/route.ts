import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UserModel } from '@/lib/models/User';

export async function GET() {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await UserModel.getUserSettings(session.user.id);
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { key, value } = await request.json();

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Key and value are required' }, { status: 400 });
    }

    const success = await UserModel.setSetting(session.user.id, key, value);

    if (success) {
      return NextResponse.json({ message: 'Setting updated successfully' });
    } else {
      return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error updating user setting:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
