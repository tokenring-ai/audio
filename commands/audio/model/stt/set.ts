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
    state.transcribe.model = modelName;
  });
  return `STT model set to ${modelName}`;
}

const help = `Set the active STT (speech-to-text) model.

## Example

/audio model stt set openai/whisper-1`;

export default {
  name: "audio model stt set",
  description: "Set STT model",
  inputSchema,
  help,
  execute,
} satisfies TokenRingAgentCommand<typeof inputSchema>;
