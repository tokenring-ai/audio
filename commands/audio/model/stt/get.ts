import {Agent} from "@tokenring-ai/agent";
import {TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import {AudioState} from "../../../../state/audioState.js";

export default {
  name: "audio model stt get",
  description: "/audio model stt get - Show current STT model",
  help: `# /audio model stt get

Show the currently active STT (speech-to-text) model.

## Example

/audio model stt get`,
  execute: async (_remainder: string, agent: Agent): Promise<string> =>
    `Current STT model: ${agent.getState(AudioState).transcribe.model}`,
} satisfies TokenRingAgentCommand;
