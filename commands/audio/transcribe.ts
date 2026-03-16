import {CommandFailedError} from "@tokenring-ai/agent/AgentError";
import {AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import AudioService from "../../AudioService.js";

const inputSchema = {
  args: {
    "--language": {
      type: "string",
      description: "Language code",
    },
  },
  prompt: {
    description: "The audio file to transcribe",
    required: true,
  },
  allowAttachments: false,
} as const satisfies AgentCommandInputSchema;

async function execute({prompt, args, agent}: AgentCommandInputType<typeof inputSchema>): Promise<string> {
  const audioService = agent.requireServiceByType(AudioService);
  const query = prompt.trim();
  if (!query) throw new CommandFailedError("Usage: /audio transcribe <filename> [flags]");
  const result = await audioService.convertAudioToText(query, { language: args["--language"] as string }, agent);
  return `Transcription: ${result.text}`;
}

const help = `# /audio transcribe <file> [options]

Transcribe an audio file to text.

## Usage

/audio transcribe <file> [--language <code>]

## Example

/audio transcribe recording.wav
/audio transcribe audio.mp3 --language en-US`;

export default {name: "audio transcribe", description: "Transcribe audio to text", inputSchema, help, execute} satisfies TokenRingAgentCommand<typeof inputSchema>;
