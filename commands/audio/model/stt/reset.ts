import {Agent} from "@tokenring-ai/agent";
import {CommandFailedError} from "@tokenring-ai/agent/AgentError";
import {AudioState} from "../../../../state/audioState.js";

export default async function reset(_remainder: string, agent: Agent): Promise<string> {
  const initialModel = agent.getState(AudioState).initialConfig.transcribe.model;
  
  if (!initialModel) {
    throw new CommandFailedError("No initial model configured");
  }
  
  agent.mutateState(AudioState, (state) => {
    state.transcribe.model = initialModel;
  });
  
  return `STT model reset to ${initialModel}`;
}
