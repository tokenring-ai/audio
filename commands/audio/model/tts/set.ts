import {CommandFailedError} from "@tokenring-ai/agent/AgentError";
import {AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import {AudioState} from "../../../../state/audioState.js";

const inputSchema = {
  args: {},
  prompt: {
    description: "The model name to set",
    required: true,
  },
  allowAttachments: false,
} as const satisfies AgentCommandInputSchema;

async function execute({prompt, agent}: AgentCommandInputType<typeof inputSchema>): Promise<string> {
  const modelName = prompt?.trim();
  if (!modelName) throw new CommandFailedError("Model name required. Usage: /audio model tts set <model_name>");
  agent.mutateState(AudioState, (state) => { state.speech.model = modelName; });
  return `TTS model set to ${modelName}`;
}

const help = `# /audio model tts set <model>

Set the active TTS (text-to-speech) model.

## Example

/audio model tts set openai/tts-1`;

export default {name: "audio model tts set", description: "Set TTS model", inputSchema, help, execute} satisfies TokenRingAgentCommand<typeof inputSchema>;
