import type { AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand } from "@tokenring-ai/agent/types";
import AudioService from "../../AudioService.ts";

const inputSchema = {} as const satisfies AgentCommandInputSchema;

async function execute({ agent }: AgentCommandInputType<typeof inputSchema>): Promise<string> {
  const audioService = agent.requireService(AudioService);
  await audioService.reindex(agent);
  return "Audio media re-indexed successfully.";
}

export default {
  name: "audio reindex",
  description: "Reindex audio files in the media library directory",
  inputSchema,
  execute,
  help: `Regenerate the media_index.json file by scanning all audio files in the media library directory and reading their metadata.

## Example

/audio reindex`,
} satisfies TokenRingAgentCommand<typeof inputSchema>;
