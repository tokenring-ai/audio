import { CommandFailedError } from "@tokenring-ai/agent/AgentError";
import type { AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand } from "@tokenring-ai/agent/types";
import AudioService from "../../AudioService.ts";

const inputSchema = {
  args: {
    language: {
      type: "string",
      description: "Language code",
    },
  },
  positionals: [
    {
      name: "file",
      description: "The audio file to transcribe",
      required: true,
    },
  ],
} as const satisfies AgentCommandInputSchema;

async function execute({ positionals, args, agent }: AgentCommandInputType<typeof inputSchema>): Promise<string> {
  const audioService = agent.requireServiceByType(AudioService);
  const file = positionals.file;
  if (!file) throw new CommandFailedError("Usage: /audio transcribe <filename> [flags]");
  const result = await audioService.convertAudioToText(file, { language: args.language as string }, agent);
  return `Transcription: ${result.text}`;
}

const help = `Transcribe an audio file to text.

## Usage

/audio transcribe <file> [--language <code>]

## Example

/audio transcribe recording.wav
/audio transcribe audio.mp3 --language en-US`;

export default {
  name: "audio transcribe",
  description: "Transcribe audio to text",
  inputSchema,
  help,
  execute,
} satisfies TokenRingAgentCommand<typeof inputSchema>;
