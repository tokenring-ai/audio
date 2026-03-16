import {CommandFailedError} from "@tokenring-ai/agent/AgentError";
import {AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import fs from "node:fs";
import path from "path";
import AudioService from "../../AudioService.js";

const inputSchema = {
  args: {
    "--voice": {
      type: "string",
      description: "Voice ID",
    },
    "--speed": {
      type: "string",
      description: "Speech speed multiplier",
    },
  },
  prompt: {
    description: "The text to convert to speech",
    required: true,
  },
  allowAttachments: false,
} as const satisfies AgentCommandInputSchema;

async function execute({prompt, args, agent}: AgentCommandInputType<typeof inputSchema>): Promise<string> {
  const audioService = agent.requireServiceByType(AudioService);
  const query = prompt.trim();
  if (!query) throw new CommandFailedError("Usage: /audio speak <text> [flags]");
  const result = await audioService.convertTextToSpeech(query, { voice: args["--voice"] as string, speed: args["--speed"] ? Number(args["--speed"]) : undefined }, agent);
  const tmpFile = path.join(audioService.options.tmpDirectory, `speech-${Date.now()}.mp3`);
  fs.writeFileSync(tmpFile, result.data);
  await audioService.requireAudioProvider(agent).playback(tmpFile);
  return `Speech generated: ${tmpFile}`;
}

const help = `# /audio speak <text> [options]

Convert text to speech and play it through the speakers.

## Usage

/audio speak <text> [--voice <id>] [--speed <n>]

## Example

/audio speak "Hello world"
/audio speak "Welcome" --voice female --speed 1.2`;

export default {name: "audio speak", description: "Convert text to speech", inputSchema, help, execute} satisfies TokenRingAgentCommand<typeof inputSchema>;
