import {AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import AudioService from "../../AudioService.js";

const inputSchema = {
  args: {
    "--format": {
      type: "string",
      description: "Audio format (e.g., wav, mp3)",
    },
  },
  allowAttachments: false,
} as const satisfies AgentCommandInputSchema;

async function execute({args, agent}: AgentCommandInputType<typeof inputSchema>): Promise<string> {
  const audioService = agent.requireServiceByType(AudioService);
  const abortController = new AbortController();
  agent.infoMessage("Recording... Press Ctrl+C to stop");
  const result = await audioService.requireAudioProvider(agent).record(abortController.signal, { format: args["--format"] as string });
  return `Recording saved: ${result.filePath}`;
}

const help = `# /audio record [options]

Record audio from the microphone. Press Ctrl+C to stop recording.

## Usage

/audio record [--format <fmt>]

## Example

/audio record
/audio record --format wav`;

export default {name: "audio record", description: "Record audio from microphone", inputSchema, help, execute} satisfies TokenRingAgentCommand<typeof inputSchema>;
