import {Agent} from "@tokenring-ai/agent";
import {CommandFailedError} from "@tokenring-ai/agent/AgentError";
import {parseArgs} from "node:util";
import AudioService from "../../AudioService.js";

export default async function transcribe(remainder: string, agent: Agent): Promise<string> {
  const audioService = agent.requireServiceByType(AudioService);
  
  const {values, positionals} = parseArgs({
    args: remainder.trim().split(/\s+/).filter(Boolean),
    options: {
      language: {type: 'string'}
    },
    allowPositionals: true,
    strict: false
  });

  const query = positionals.join(" ");
  if (!query) {
    throw new CommandFailedError("Usage: /audio transcribe <filename> [flags]");
  }

  const result = await audioService.convertAudioToText(query, {
    language: values.language as string
  }, agent);
  
  return `Transcription: ${result.text}`;
}
