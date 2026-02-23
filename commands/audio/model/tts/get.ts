import {Agent} from "@tokenring-ai/agent";
import {AudioState} from "../../../../state/audioState.js";

export default async function get(_remainder: string, agent: Agent): Promise<string> {
  const model = agent.getState(AudioState).speech.model;
  
  return `Current TTS model: ${model}`;
}
