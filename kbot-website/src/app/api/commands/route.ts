import { NextResponse } from 'next/server';
import getServiceConnector from '@/lib/serviceConnectorBridge';

interface Command {
  ID: number;
  command: string;
  aliases: string | null;
  cooldown: number;
  permissions: number;
  date: string;
  description_formatted: string | null;
  description: string;
  optoutable: 'Y' | 'N';
  usage: string | null;
}

export async function GET() {
  try {
    const { sqlClient } = await getServiceConnector();

    const commands = await sqlClient.query<Command[]>(
      `
        SELECT *
        FROM kbot.commands
        WHERE permissions < 5
        ORDER BY command 
      `
    );

    if (!commands || commands.length === 0) {
      return NextResponse.json({
        commands: [],
        message: 'No commands found'
      });
    }

    return NextResponse.json({
      commands: Array.isArray(commands) ? commands : [],
      total: commands.length
    });
  } catch (error) {
    console.error('Error fetching commands:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
