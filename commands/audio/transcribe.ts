import {Agent} from "@tokenring-ai/agent";
import {CommandFailedError} from "@tokenring-ai/agent/AgentError";
import {TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import {parseArgs} from "node:util";
import AudioService from "../../AudioService.js";

async function execute(remainder: string, agent: Agent): Promise<string> {
  const audioService = agent.requireServiceByType(AudioService);
  const {values, positionals} = parseArgs({
    args: remainder.trim().split(/\s+/).filter(Boolean),
    options: { language: {type: 'string'} },
    allowPositionals: true,
    strict: false
  });
  const query = positionals.join(" ");
  if (!query) throw new CommandFailedError("Usage: /audio transcribe <filename> [flags]");
  const result = await audioService.convertAudioToText(query, { language: values.language as string }, agent);
  return `Transcription: ${result.text}`;
}

const help = `# /audio transcribe <file> [options]

Transcribe an audio file to text.

## Usage

/audio transcribe <file> [--language <code>]

## Example

/audio transcribe recording.wav
/audio transcribe audio.mp3 --language en-US`;

export default { name: "audio transcribe", description: "/audio transcribe - Transcribe audio to text", help, execute } satisfies TokenRingAgentCommand;
