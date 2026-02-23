import {Agent} from "@tokenring-ai/agent";
import {AudioState} from "../../../../state/audioState.js";

export default async function defaultCmd(_remainder: string, agent: Agent): Promise<string> {
  const model = agent.getState(AudioState).transcribe.model;
  
  if (!agent.headless) {
    const {default: select} = await import("./select.js");
    return await select("", agent);
  }
  
  return `Current STT model: ${model}`;
}
