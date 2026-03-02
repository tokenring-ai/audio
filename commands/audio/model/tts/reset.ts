import {Agent} from "@tokenring-ai/agent";
import {CommandFailedError} from "@tokenring-ai/agent/AgentError";
import {TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import {AudioState} from "../../../../state/audioState.js";

async function execute(_remainder: string, agent: Agent): Promise<string> {
  const initialModel = agent.getState(AudioState).initialConfig.speech.model;
  if (!initialModel) throw new CommandFailedError("No initial model configured");
  agent.mutateState(AudioState, (state) => { state.speech.model = initialModel; });
  return `TTS model reset to ${initialModel}`;
}

const help = `# /audio model tts reset

Reset the TTS model to the initial configured value.

## Example

/audio model tts reset`;

export default { name: "audio model tts reset", description: "/audio model tts reset - Reset TTS model", help, execute } satisfies TokenRingAgentCommand;
