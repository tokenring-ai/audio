import type { AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand } from "@tokenring-ai/agent/types";
import AudioService from "../../AudioService.ts";

const inputSchema = {
  args: {
    voice: {
      type: "string",
      description: "Voice ID",
    },
    speed: {
      type: "string",
      description: "Speech speed multiplier",
    },
  },
  remainder: {
    name: "text",
    description: "The text to convert to speech",
    required: true,
  },
} as const satisfies AgentCommandInputSchema;

async function execute({ remainder, args, agent }: AgentCommandInputType<typeof inputSchema>): Promise<string> {
  const audioService = agent.requireService(AudioService);
  const result = await audioService.convertTextToSpeechFile(
    remainder,
    {
      voice: args.voice as string,
      speed: args.speed ? Number(args.speed) : undefined,
    },
    agent,
  );
  return `Audio file generated: ${result.fileName}`;
}

const help = `Convert text to an audio file, which will be saved to a new file on the filesystem.

## Example

/audio generate "Hello world"
/audio generate "Welcome" --voice female --speed 1.2`;

export default {
  name: "audio generate",
  description: "Convert text to speech",
  inputSchema,
  help,
  execute,
} satisfies TokenRingAgentCommand<typeof inputSchema>;
