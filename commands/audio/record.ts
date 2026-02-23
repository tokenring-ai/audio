import {Agent} from "@tokenring-ai/agent";
import {CommandFailedError} from "@tokenring-ai/agent/AgentError";
import {parseArgs} from "node:util";
import AudioService from "../../AudioService.js";

export default async function record(remainder: string, agent: Agent): Promise<string> {
  const audioService = agent.requireServiceByType(AudioService);
  
  const {values} = parseArgs({
    args: remainder.trim().split(/\s+/).filter(Boolean),
    options: {
      format: {type: 'string'}
    },
    allowPositionals: true,
    strict: false
  });

  const abortController = new AbortController();
  agent.infoMessage("Recording... Press Ctrl+C to stop");

  const result = await audioService.requireAudioProvider(agent).record(abortController.signal, {
    format: values.format as string
  });
  
  return `Recording saved: ${result.filePath}`;
}
