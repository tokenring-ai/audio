import {AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import {AudioState} from "../../../../state/audioState.js";

const inputSchema = {
  args: {},
  allowAttachments: false,
} as const satisfies AgentCommandInputSchema;

async function execute({agent}: AgentCommandInputType<typeof inputSchema>): Promise<string> {
  return `Current STT model: ${agent.getState(AudioState).transcribe.model}`;
}

export default {
  name: "audio model stt get",
  description: "Show current STT model",
  inputSchema,
  execute,
  help: `# /audio model stt get

Show the currently active STT (speech-to-text) model.

## Example

/audio model stt get`,
} satisfies TokenRingAgentCommand<typeof inputSchema>;
