import {Agent} from "@tokenring-ai/agent";
import {TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import {AudioState} from "../../../../state/audioState.js";

export default {
  name: "audio model tts get",
  description: "/audio model tts get - Show current TTS model",
  help: `# /audio model tts get

Show the currently active TTS (text-to-speech) model.

## Example

/audio model tts get`,
  execute: async (_remainder: string, agent: Agent): Promise<string> =>
    `Current TTS model: ${agent.getState(AudioState).speech.model}`,
} satisfies TokenRingAgentCommand;
