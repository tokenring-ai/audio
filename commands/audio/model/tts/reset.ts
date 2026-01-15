import {Agent} from "@tokenring-ai/agent";
import {AudioState} from "../../../../state/audioState.js";

export default async function reset(_remainder: string, agent: Agent): Promise<void> {
  const initialModel = agent.getState(AudioState).initialConfig.speech.model;
  
  if (initialModel) {
    agent.mutateState(AudioState, (state) => {
      state.speech.model = initialModel;
    });
    agent.infoMessage(`TTS model reset to ${initialModel}`);
  } else {
    agent.errorMessage("No initial model configured");
  }
}
