import {Agent} from "@tokenring-ai/agent";
import {CommandFailedError} from "@tokenring-ai/agent/AgentError";
import {TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import {AudioState} from "../../../../state/audioState.js";

async function execute(_remainder: string, agent: Agent): Promise<string> {
  const initialModel = agent.getState(AudioState).initialConfig.transcribe.model;
  if (!initialModel) throw new CommandFailedError("No initial model configured");
  agent.mutateState(AudioState, (state) => { state.transcribe.model = initialModel; });
  return `STT model reset to ${initialModel}`;
}

const help = `# /audio model stt reset

Reset the STT model to the initial configured value.

## Example

/audio model stt reset`;

export default {name: "audio model stt reset", description: "Reset STT model", help, execute} satisfies TokenRingAgentCommand;
