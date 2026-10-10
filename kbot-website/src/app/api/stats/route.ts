import { NextResponse } from 'next/server';
import getServiceConnector from '@/lib/serviceConnectorBridge';

function formatUptime(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const units: [string, number][] = [
    ['y', 365 * 24 * 60],
    ['mo', 30 * 24 * 60],
    ['d', 24 * 60],
    ['h', 60],
    ['m', 1]
  ];

  let remaining = totalMinutes;
  const parts: string[] = [];
  for (const [label, size] of units) {
    const value = Math.floor(remaining / size);
    remaining %= size;
    if (value > 0 || parts.length > 0) parts.push(`${value}${label}`);
  }

  // Show the three most significant units, e.g. "1mo 2d 20h" or "4h 12m"
  return parts.length ? parts.slice(0, 3).join(' ') : '0m';
}

export async function GET() {
  try {
    const { sqlClient, redisClient } = await getServiceConnector();

    const [
      usersResult,
      messagesResult,
      commandExecutionsCountRedis,
      botStartedAt,
      backendHeartbeat,
      channelList,
      linesOfCode,
      messageRate
    ] = await Promise.all([
      sqlClient.query<{ count: number }[]>(
        'SELECT count FROM kbot.stats WHERE type="statsApi" AND sha="totalUsers"'
      ),
      sqlClient.query<{ count: number }[]>(
        'SELECT count FROM kbot.stats WHERE type="statsApi" AND sha="commandExecs"'
      ),
      redisClient.get('kb:global:commandExecutionsCount'),
      redisClient.get('kb:command-manager:botStartedAt'),
      redisClient.get('kb:heartbeat:kbot-backend'),
      redisClient.get('kb:global:channel-list'),
      redisClient.get('kb:job-manager:estimatedRepoLines'),
      redisClient.get('kb:command-manager:messageRate')
    ]);

    const isBackendOnline = backendHeartbeat !== null;
    const uptimeMs = isBackendOnline && botStartedAt ? Date.now() - Number(botStartedAt) : 0;

    const messages =
      commandExecutionsCountRedis !== null
        ? Number(commandExecutionsCountRedis) || 0
        : Number(messagesResult?.[0]?.count) || 0;

    return NextResponse.json({
      users: Number(usersResult?.[0]?.count) || 0,
      messages,
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
