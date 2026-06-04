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
  const audioService = agent.requireServiceByType(AudioService);
  const result = await audioService.convertTextToSpeechFile(
    remainder,
    {
      voice: args.voice as string,
      speed: args.speed ? Number(args.speed) : undefined,
    },
    agent,
  );
  await audioService.requireAudioProvider(agent).playback(result.filePath);
  return `Speech generated: ${result.filePath}`;
}

const help = `Convert text to speech, save it to the media library, and play it through the speakers.

## Example

/audio speak "Hello world"
/audio speak "Welcome" --voice female --speed 1.2`;

export default {
  name: "audio speak",
  description: "Convert text to speech",
  inputSchema,
  help,
  execute,
} satisfies TokenRingAgentCommand<typeof inputSchema>;
