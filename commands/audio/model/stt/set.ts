import {Agent} from "@tokenring-ai/agent";
import {CommandFailedError} from "@tokenring-ai/agent/AgentError";
import {AudioState} from "../../../../state/audioState.js";

export default async function set(remainder: string, agent: Agent): Promise<string> {
  const modelName = remainder?.trim();
  
  if (!modelName) {
    throw new CommandFailedError("Model name required. Usage: /audio model stt set <model_name>");
  }

  agent.mutateState(AudioState, (state) => {
    state.transcribe.model = modelName;
  });
  
  return `STT model set to ${modelName}`;
}
