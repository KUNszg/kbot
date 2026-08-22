import { NextRequest, NextResponse } from 'next/server';
import getServiceConnector from '@/lib/serviceConnectorBridge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get('search')?.toLowerCase();
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const view = searchParams.get('view') || 'added';
    const typeFilter = searchParams.get('type');
    const offset = (page - 1) * limit;

    if (!search) return NextResponse.json({ error: 'Search required' }, { status: 400 });

    const { sqlClient } = await getServiceConnector();
    const table = view === 'removed' ? 'emotes_removed' : 'emotes';

    let dataQuery = `SELECT ID, channel, emote, url, type, emoteId, sevenTvId, date FROM kbot_website.${table} WHERE channel = ?`;
    let countQuery = `SELECT COUNT(*) as total FROM kbot_website.${table} WHERE channel = ?`;
    const params: any[] = [search];

    if (typeFilter && typeFilter !== 'all') {
      dataQuery += ` AND type = ?`;
      countQuery += ` AND type = ?`;
      params.push(typeFilter);
    }

    dataQuery += ` ORDER BY date DESC LIMIT ${limit} OFFSET ${offset}`;

    const emotes = await sqlClient.query<any[]>(dataQuery, params);
    const filteredCountResult = await sqlClient.query<{ total: number }[]>(countQuery, params);

    const typeCounts = await sqlClient.query<{ type: string; count: number }[]>(
      `SELECT type, COUNT(*) as count FROM kbot_website.${table} WHERE channel = ? GROUP BY type`,
      [search]
    );

    const globalCounts = await sqlClient.query<{ addedCount: number; removedCount: number }[]>(
      `SELECT 
        (SELECT COUNT(*) FROM kbot_website.emotes WHERE channel = ?) as addedCount,
        (SELECT COUNT(*) FROM kbot_website.emotes_removed WHERE channel = ?) as removedCount`,
      [search, search]
    );

    const updateResult = await sqlClient.query<{ emotesUpdate: string }[]>(
      `SELECT emotesUpdate FROM kbot_website.channels_logger WHERE channel = ? LIMIT 1`,
      [search]
    );

    const currentTotal = filteredCountResult[0]?.total || 0;

    return NextResponse.json({
      emotes: Array.isArray(emotes) ? emotes : [],
      stats: {
        totalAdded: globalCounts[0]?.addedCount || 0,
        totalRemoved: globalCounts[0]?.removedCount || 0,
        currentTotal,
        bttv: typeCounts.find(t => t.type === 'bttv')?.count || 0,
        ffz: typeCounts.find(t => t.type === 'ffz')?.count || 0,
        sevenTv: typeCounts.find(t => t.type === '7tv')?.count || 0
      },
      lastUpdate: updateResult[0]?.emotesUpdate || null,
      totalPages: Math.ceil(currentTotal / limit) || 1
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
