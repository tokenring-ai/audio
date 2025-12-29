import {Agent} from "@tokenring-ai/agent";
import {AudioState} from "../../../../state/audioState.js";

export default async function reset(_remainder: string, agent: Agent): Promise<void> {
  const initialModel = agent.getState(AudioState).initialConfig.transcribe.model;
  
  if (initialModel) {
    agent.mutateState(AudioState, (state) => {
      state.transcribe.model = initialModel;
    });
    agent.infoLine(`STT model reset to ${initialModel}`);
  } else {
    agent.errorLine("No initial model configured");
  }
}
