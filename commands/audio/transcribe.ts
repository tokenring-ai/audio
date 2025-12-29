import {Agent} from "@tokenring-ai/agent";
import {parseArgs} from "node:util";
import AudioService from "../../AudioService.js";

export default async function transcribe(remainder: string, agent: Agent): Promise<void> {
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
    agent.errorLine("Usage: /audio transcribe <filename> [flags]");
    return;
  }

  const result = await audioService.convertAudioToText(query, {
    language: values.language as string
  }, agent);
  
  agent.infoLine(`Transcription: ${result.text}`);
}
