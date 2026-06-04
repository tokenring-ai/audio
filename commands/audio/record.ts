import type { AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand } from "@tokenring-ai/agent/types";
import AudioService from "../../AudioService.ts";

const inputSchema = {
  args: {
    format: {
      type: "string",
      description: "Audio format (e.g., wav, mp3)",
    },
  },
} as const satisfies AgentCommandInputSchema;

async function execute({ args, agent }: AgentCommandInputType<typeof inputSchema>): Promise<string> {
  const audioService = agent.requireServiceByType(AudioService);
  const abortController = new AbortController();
  agent.infoMessage("Recording... Press Ctrl+C to stop");
  const result = await audioService.recordAudio({ format: args.format as string }, agent, abortController.signal);
  return `Recording saved: ${result.filePath}`;
}

const help = `Record audio from the microphone into the media library. Press Ctrl+C to stop recording.

## Example

/audio record
/audio record --format wav`;

export default {
  name: "audio record",
  description: "Record audio from microphone",
  inputSchema,
  help,
  execute,
} satisfies TokenRingAgentCommand<typeof inputSchema>;
