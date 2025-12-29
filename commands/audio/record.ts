import {Agent} from "@tokenring-ai/agent";
import {parseArgs} from "node:util";
import AudioService from "../../AudioService.js";

export default async function record(remainder: string, agent: Agent): Promise<void> {
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
  agent.infoLine("Recording... Press Ctrl+C to stop");

  const result = await audioService.getActiveProvider(agent).record(abortController.signal, {
    format: values.format as string
  });
  
  agent.infoLine(`Recording saved: ${result.filePath}`);
}
