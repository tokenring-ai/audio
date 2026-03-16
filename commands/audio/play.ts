import {CommandFailedError} from "@tokenring-ai/agent/AgentError";
import {AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import AudioService from "../../AudioService.js";

const inputSchema = {
  args: {},
  prompt: {
    description: "The filename to play",
    required: true,
  },
  allowAttachments: false,
} as const satisfies AgentCommandInputSchema;

async function execute({prompt, agent}: AgentCommandInputType<typeof inputSchema>): Promise<string> {
  const query = prompt.trim();
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

export default {name: "audio play", description: "Play audio file", inputSchema, help, execute} satisfies TokenRingAgentCommand<typeof inputSchema>;
