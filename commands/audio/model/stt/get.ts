import type { AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand } from "@tokenring-ai/agent/types";
import { AudioState } from "../../../../state/audioState.ts";

const inputSchema = {} as const satisfies AgentCommandInputSchema;

function execute({ agent }: AgentCommandInputType<typeof inputSchema>): string {
  return `Current STT model: ${agent.getState(AudioState).transcribe.model}`;
}

export default {
  name: "audio model stt get",
  description: "Show current STT model",
  inputSchema,
  execute,
  help: `Show the currently active STT (speech-to-text) model.

## Example

/audio model stt get`,
} satisfies TokenRingAgentCommand<typeof inputSchema>;
