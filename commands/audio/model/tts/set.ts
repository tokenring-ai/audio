import {Agent} from "@tokenring-ai/agent";
import {CommandFailedError} from "@tokenring-ai/agent/AgentError";
import {TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import {AudioState} from "../../../../state/audioState.js";

async function execute(remainder: string, agent: Agent): Promise<string> {
  const modelName = remainder?.trim();
  if (!modelName) throw new CommandFailedError("Model name required. Usage: /audio model tts set <model_name>");
  agent.mutateState(AudioState, (state) => { state.speech.model = modelName; });
  return `TTS model set to ${modelName}`;
}

const help = `# /audio model tts set <model>

Set the active TTS (text-to-speech) model.

## Example

/audio model tts set openai/tts-1`;

export default { name: "audio model tts set", description: "/audio model tts set - Set TTS model", help, execute } satisfies TokenRingAgentCommand;
