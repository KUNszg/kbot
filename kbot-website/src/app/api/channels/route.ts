import { NextResponse } from 'next/server';
import getServiceConnector from '@/lib/serviceConnectorBridge';

export async function GET() {
  try {
    const { sqlClient } = await getServiceConnector();

    const channels =
      (await sqlClient.query<{ channel: string }[]>(
        `SELECT DISTINCT channel 
       FROM kbot_website.channels_logger 
       WHERE status = 'enabled' AND emotesUpdate IS NOT NULL 
       ORDER BY channel ASC`
      )) || [];

    return NextResponse.json(channels);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
