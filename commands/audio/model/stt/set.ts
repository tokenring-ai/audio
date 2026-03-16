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
  const modelName = prompt.trim();
  if (!modelName) throw new CommandFailedError("Model name required. Usage: /audio model stt set <model_name>");
  agent.mutateState(AudioState, (state) => { state.transcribe.model = modelName; });
  return `STT model set to ${modelName}`;
}

const help = `# /audio model stt set <model>

Set the active STT (speech-to-text) model.

## Example

/audio model stt set openai/whisper-1`;

export default {name: "audio model stt set", description: "Set STT model", inputSchema, help, execute} satisfies TokenRingAgentCommand<typeof inputSchema>;
