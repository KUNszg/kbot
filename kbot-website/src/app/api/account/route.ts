import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UserModel } from '@/lib/models/User';

export async function DELETE() {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const success = await UserModel.delete(session.user.id);

    if (success) {
      return NextResponse.json({ message: 'Account unlinked successfully' });
    } else {
      return NextResponse.json({ error: 'Failed to unlink account' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error unlinking account:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
