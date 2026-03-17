import {AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import {AudioState} from "../../../../state/audioState.js";

const inputSchema = {} as const satisfies AgentCommandInputSchema;

async function execute({agent}: AgentCommandInputType<typeof inputSchema>): Promise<string> {
  return `Current TTS model: ${agent.getState(AudioState).speech.model}`;
}

export default {
  name: "audio model tts get",
  description: "Show current TTS model",
  inputSchema,
  execute,
  help: `Show the currently active TTS (text-to-speech) model.

## Example

/audio model tts get`,
} satisfies TokenRingAgentCommand<typeof inputSchema>;
