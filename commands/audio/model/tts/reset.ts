import {Agent} from "@tokenring-ai/agent";
import {CommandFailedError} from "@tokenring-ai/agent/AgentError";
import {AudioState} from "../../../../state/audioState.js";

export default async function reset(_remainder: string, agent: Agent): Promise<string> {
  const initialModel = agent.getState(AudioState).initialConfig.speech.model;
  
  if (!initialModel) {
    throw new CommandFailedError("No initial model configured");
  }
  
  agent.mutateState(AudioState, (state) => {
    state.speech.model = initialModel;
  });
  
  return `TTS model reset to ${initialModel}`;
}
