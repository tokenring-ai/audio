import {Agent} from "@tokenring-ai/agent";
import {CommandFailedError} from "@tokenring-ai/agent/AgentError";
import {TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import AudioService from "../../AudioService.js";

async function execute(remainder: string, agent: Agent): Promise<string> {
  const query = remainder.trim();
  if (!query) throw new CommandFailedError("Usage: /audio play <filename> [flags]");
  const result = await agent.requireServiceByType(AudioService).requireAudioProvider(agent).playback(query);
  return `Played: ${result}`;
}

const help = `# /audio play <file>

Play an audio file through the speakers.

## Usage

/audio play <file>

## Example

/audio play output.mp3`;

export default {name: "audio play", description: "Play audio file", help, execute} satisfies TokenRingAgentCommand;
