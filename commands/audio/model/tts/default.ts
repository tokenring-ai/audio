import {Agent} from "@tokenring-ai/agent";
import {AudioState} from "../../../../state/audioState.js";

export default async function defaultCmd(_remainder: string, agent: Agent): Promise<void> {
  const model = agent.getState(AudioState).speech.model;
  
  agent.infoMessage(`Current TTS model: ${model}`);
  
  if (!agent.headless) {
    const {default: select} = await import("./select.js");
    await select("", agent);
  }
}
