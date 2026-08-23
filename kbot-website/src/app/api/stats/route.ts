import { NextResponse } from 'next/server';
import getServiceConnector from '@/lib/serviceConnectorBridge';

function formatUptime(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

export async function GET() {
  try {
    const { sqlClient, redisClient } = await getServiceConnector();

    const [
      usersResult,
      messagesResult,
      botStartedAt,
      backendHeartbeat,
      channelList,
      linesOfCode,
      messageRate
    ] = await Promise.all([
      sqlClient.query<{ count: number }[]>(
        'SELECT count FROM stats WHERE type="statsApi" AND sha="totalUsers"'
      ),
      sqlClient.query<{ count: number }[]>(
        'SELECT count FROM stats WHERE type="statsApi" AND sha="commandExecs"'
      ),
      redisClient.get('kb:command-manager:botStartedAt'),
      redisClient.get('kb:heartbeat:kbot-backend'),
      redisClient.get('kb:global:channel-list'),
      redisClient.get('kb:job-manager:estimatedRepoLines'),
      redisClient.get('kb:command-manager:messageRate')
    ]);

    const isBackendOnline = backendHeartbeat !== null;
    const uptimeMs = isBackendOnline && botStartedAt ? Date.now() - Number(botStartedAt) : 0;

    return NextResponse.json({
      users: Number(usersResult?.[0]?.count) || 0,
      messages: Number(messagesResult?.[0]?.count) || 0,
      uptime: isBackendOnline ? formatUptime(uptimeMs) : 'Offline',
      channelsMonitored: Array.isArray(channelList) ? channelList.length : 0,
      linesOfCode: Number(linesOfCode) || 0,
      messageRate: isBackendOnline ? Number(messageRate) || 0 : 0
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
