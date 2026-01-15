import {Agent} from "@tokenring-ai/agent";
import AudioService from "../../AudioService.js";

export default async function play(remainder: string, agent: Agent): Promise<void> {
  const audioService = agent.requireServiceByType(AudioService);
  const query = remainder.trim();
  
  if (!query) {
    agent.errorMessage("Usage: /audio play <filename> [flags]");
    return;
  }

  const result = await audioService.requireAudioProvider(agent).playback(query);
  agent.infoMessage(`Played: ${result}`);
}
