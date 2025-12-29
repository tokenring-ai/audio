import {Agent} from "@tokenring-ai/agent";
import {AudioState} from "../../../../state/audioState.js";

export default async function get(_remainder: string, agent: Agent): Promise<void> {
  const model = agent.getState(AudioState).transcribe.model;
  
  agent.infoLine(`Current STT model: ${model}`);
}
