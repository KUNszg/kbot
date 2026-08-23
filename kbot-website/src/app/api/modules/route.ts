import { NextResponse } from 'next/server';
import getServiceConnector from '@/lib/serviceConnectorBridge';

const MODULES = [
  { name: 'kbot-backend', label: 'Bot' },
  { name: 'kbot-api', label: 'API' },
  { name: 'kbot-job-manager', label: 'Job Manager' },
  { name: 'update-emotes-list', label: 'Emote Updater' },
  { name: 'reddit-live-thread-to-discord', label: 'Reddit → Discord' },
  { name: 'twitch-chat-message-logger', label: 'Chat Logger' },
  { name: 'twitch-chat-notice-logger', label: 'Notice Logger' },
  { name: 'twitch-chat-banphrased-message-logger', label: 'Banphrase Logger' },
  { name: 'twitch-chat-queue-filler', label: 'Queue Filler' }
];

export async function GET() {
  try {
    const { redisClient } = await getServiceConnector();

    const modules = await Promise.all(
      MODULES.map(async module => {
        const [heartbeat, lastSeen] = await Promise.all([
          redisClient.get(`kb:heartbeat:${module.name}`),
          redisClient.get(`kb:heartbeat:${module.name}:lastSeen`)
        ]);

        return {
          name: module.name,
          label: module.label,
          online: heartbeat !== null,
          lastSeen: lastSeen ? Number(lastSeen) : null
        };
      })
    );

    return NextResponse.json({ modules });
  } catch (error) {
    console.error('Error fetching module status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
