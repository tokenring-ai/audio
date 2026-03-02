import {Agent} from "@tokenring-ai/agent";
import {TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import {parseArgs} from "node:util";
import AudioService from "../../AudioService.js";

async function execute(remainder: string, agent: Agent): Promise<string> {
  const audioService = agent.requireServiceByType(AudioService);
  const {values} = parseArgs({
    args: remainder.trim().split(/\s+/).filter(Boolean),
    options: { format: {type: 'string'} },
    allowPositionals: true,
    strict: false
  });
  const abortController = new AbortController();
  agent.infoMessage("Recording... Press Ctrl+C to stop");
  const result = await audioService.requireAudioProvider(agent).record(abortController.signal, { format: values.format as string });
  return `Recording saved: ${result.filePath}`;
}

const help = `# /audio record [options]

Record audio from the microphone. Press Ctrl+C to stop recording.

## Usage

/audio record [--format <fmt>]

## Example

/audio record
/audio record --format wav`;

export default { name: "audio record", description: "/audio record - Record audio from microphone", help, execute } satisfies TokenRingAgentCommand;
