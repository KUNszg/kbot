import fs from 'fs';
import path from 'path';
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

const internalCommandsDir = path.resolve(process.cwd(), 'lib/commands');
const externalCommandsDir = path.resolve(process.cwd(), '../lib/commands');
const commandsDirPath = fs.existsSync(internalCommandsDir)
  ? internalCommandsDir
  : externalCommandsDir;

function getLiveCommandNames(): Set<string> {
  return new Set(
    fs
      .readdirSync(commandsDirPath, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
  );
}

export async function GET() {
  try {
    const { sqlClient } = await getServiceConnector();

    const commands = await sqlClient.query<Command[]>(
      `
        SELECT *
        FROM kbot_website.commands
        WHERE permissions < 5
        ORDER BY command
      `
    );

    const liveCommandNames = getLiveCommandNames();
    const liveCommands = (commands || []).filter(cmd => liveCommandNames.has(cmd.command));

    if (!liveCommands.length) {
      return NextResponse.json({
        commands: [],
        message: 'No commands found'
      });
    }

    return NextResponse.json({
      commands: liveCommands,
      total: liveCommands.length
    });
  } catch (error) {
    console.error('Error fetching commands:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
