import type {AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import {AudioState} from "../../../../state/audioState.ts";

const inputSchema = {} as const satisfies AgentCommandInputSchema;

function execute({
                   agent,
                 }: AgentCommandInputType<typeof inputSchema>): string {
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
