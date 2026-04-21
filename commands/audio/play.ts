import type { AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand } from "@tokenring-ai/agent/types";
import AudioService from "../../AudioService.ts";

const inputSchema = {
  args: {},
  positionals: [
    {
      name: "file",
      description: "The filename to play",
      required: true,
    },
  ],
} as const satisfies AgentCommandInputSchema;

async function execute({ positionals, agent }: AgentCommandInputType<typeof inputSchema>): Promise<string> {
  const file = positionals.file;

  const result = await agent.requireServiceByType(AudioService).requireAudioProvider(agent).playback(file);
  return `Played: ${result}`;
}

const help = `Play an audio file through the speakers.

## Example

/audio play output.mp3`;

export default {
  name: "audio play",
  description: "Play audio file",
  inputSchema,
  help,
  execute,
} satisfies TokenRingAgentCommand<typeof inputSchema>;
