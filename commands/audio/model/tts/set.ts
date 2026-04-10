import type {AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand,} from "@tokenring-ai/agent/types";
import {AudioState} from "../../../../state/audioState.ts";

const inputSchema = {
  args: {},
  positionals: [
    {
      name: "model",
      description: "The model name to set",
      required: true,
    },
  ],
} as const satisfies AgentCommandInputSchema;

function execute({
                   positionals,
                   agent,
                 }: AgentCommandInputType<typeof inputSchema>): string {
  const modelName = positionals.model;

  agent.mutateState(AudioState, (state) => {
    state.speech.model = modelName;
  });
  return `TTS model set to ${modelName}`;
}

const help = `Set the active TTS (text-to-speech) model.

## Example

/audio model tts set openai/tts-1`;

export default {
  name: "audio model tts set",
  description: "Set TTS model",
  inputSchema,
  help,
  execute,
} satisfies TokenRingAgentCommand<typeof inputSchema>;
