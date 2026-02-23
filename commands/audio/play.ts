import {Agent} from "@tokenring-ai/agent";
import {CommandFailedError} from "@tokenring-ai/agent/AgentError";
import AudioService from "../../AudioService.js";

export default async function play(remainder: string, agent: Agent): Promise<string> {
  const audioService = agent.requireServiceByType(AudioService);
  const query = remainder.trim();
  
  if (!query) {
    throw new CommandFailedError("Usage: /audio play <filename> [flags]");
  }

  const result = await audioService.requireAudioProvider(agent).playback(query);
  return `Played: ${result}`;
}
