export type Command = 'status' | 'parse' | 'enrich' | 'clean' | 'help';

export interface ParsedArgs {
  command: Command;
  args: string[];
}

const VALID_COMMANDS: Command[] = ['status', 'parse', 'enrich', 'clean'];

export function parseArgs(rawArgs: string[]): ParsedArgs {
  const [commandCandidate, ...rest] = rawArgs;

  if (!commandCandidate) {
    return { command: 'help', args: [] };
  }

  if (VALID_COMMANDS.includes(commandCandidate as Command)) {
    return { command: commandCandidate as Command, args: rest };
  }

  return { command: 'help', args: rest };
}
