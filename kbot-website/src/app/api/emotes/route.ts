import { NextRequest, NextResponse } from 'next/server';
import getServiceConnector from '@/lib/serviceConnectorBridge';

interface Emote {
  ID: number;
  userId: string;
  channel: string;
  emote: string;
  url: string;
  type: 'bttv' | 'ffz' | '7tv';
  emoteId: number;
  sevenTvId: string;
  date: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search')?.toLowerCase();

    if (!search) {
      return NextResponse.json({ error: 'Search parameter is required' }, { status: 400 });
    }

    const { sqlClient } = await getServiceConnector();

    const emotesAdded = await sqlClient.query<Emote[]>(
      `
          SELECT ID, userId, channel, emote, url, type, emoteId, sevenTvId, date
          FROM kbot.emotes
          WHERE channel = ?
          ORDER BY date DESC
      `,
      [search]
    );

    const emotesRemoved = await sqlClient.query<Emote[]>(
      `
          SELECT ID, userId, channel, emote, url, type, emoteId, sevenTvId, date
          FROM kbot.emotes_removed
          WHERE channel = ?
          ORDER BY date DESC
      `,
      [search]
    );

    const updateResult = await sqlClient.query<{ emotesUpdate: string }[]>(
      `SELECT emotesUpdate FROM kbot.channels_logger WHERE channel = ?`,
      [search]
    );

    if (!emotesAdded || emotesAdded.length === 0) {
      return NextResponse.json({
        emotesAdded: [],
        emotesRemoved: [],
        stats: { bttv: 0, ffz: 0, '7tv': 0, total: 0 },
        lastUpdate: null
      });
    }

    const stats = {
      bttv: emotesAdded.filter(e => e.type === 'bttv').length,
      ffz: emotesAdded.filter(e => e.type === 'ffz').length,
      '7tv': emotesAdded.filter(e => e.type === '7tv').length,
      total: emotesAdded.length
    };

    const lastUpdate =
      updateResult && updateResult.length > 0
        ? new Date(updateResult[0].emotesUpdate).toLocaleString()
        : null;

    return NextResponse.json({
      emotesAdded: Array.isArray(emotesAdded) ? emotesAdded : [],
      emotesRemoved: Array.isArray(emotesRemoved) ? emotesRemoved : [],
      stats,
      lastUpdate
    });
  } catch (error) {
    console.error('Error fetching emotes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
