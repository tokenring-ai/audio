import {Agent} from "@tokenring-ai/agent";
import {CommandFailedError} from "@tokenring-ai/agent/AgentError";
import {TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import {AudioState} from "../../../../state/audioState.js";

async function execute(remainder: string, agent: Agent): Promise<string> {
  const modelName = remainder?.trim();
  if (!modelName) throw new CommandFailedError("Model name required. Usage: /audio model stt set <model_name>");
  agent.mutateState(AudioState, (state) => { state.transcribe.model = modelName; });
  return `STT model set to ${modelName}`;
}

const help = `# /audio model stt set <model>

Set the active STT (speech-to-text) model.

## Example

/audio model stt set openai/whisper-1`;

export default { name: "audio model stt set", description: "/audio model stt set - Set STT model", help, execute } satisfies TokenRingAgentCommand;
