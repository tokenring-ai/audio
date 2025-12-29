import {Agent} from "@tokenring-ai/agent";
import {AudioState} from "../../../../state/audioState.js";

export default async function set(remainder: string, agent: Agent): Promise<void> {
  const modelName = remainder?.trim();
  
  if (!modelName) {
    agent.errorLine("Model name required. Usage: /audio model tts set <model_name>");
    return;
  }

  agent.mutateState(AudioState, (state) => {
    state.speech.model = modelName;
  });
  agent.infoLine(`TTS model set to ${modelName}`);
}
