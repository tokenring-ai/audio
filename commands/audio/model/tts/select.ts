import {Agent} from "@tokenring-ai/agent";
import {SpeechModelRegistry} from "@tokenring-ai/ai-client/ModelRegistry";
import {AudioState} from "../../../../state/audioState.js";

interface TreeNode {
  name: string;
  value?: string;
  children?: TreeNode[];
  hasChildren?: boolean;
}

export default async function select(_remainder: string, agent: Agent): Promise<void> {
  const speechModelRegistry = agent.requireServiceByType(SpeechModelRegistry);

  const modelsByProvider = await agent.busyWhile(
    "Checking online status of models...",
    speechModelRegistry.getModelsByProvider(),
  );

  const buildModelTree = (): TreeNode => {
    const tree: TreeNode = {
      name: "TTS Model Selection",
      children: [],
    };

    const sortedProviders = Object.entries(modelsByProvider).sort(([a], [b]) =>
      a.localeCompare(b),
    );

    for (const [provider, providerModels] of sortedProviders) {
      const sortedModels = Object.entries(providerModels).sort(
        ([, a], [, b]) => {
          if (a.status === b.status) {
            return a.modelSpec.modelId.localeCompare(b.modelSpec.modelId);
          } else {
            return a.status.localeCompare(b.status);
          }
        },
      );

      const children = sortedModels.map(([modelName, model]) => ({
        value: modelName,
        name:
          model.status === "online"
            ? model.modelSpec.modelId
            : model.status === "cold"
              ? `${model.modelSpec.modelId} (cold)`
              : `${model.modelSpec.modelId} (offline)`,
      }));

      const onlineCount = Object.values(providerModels).filter(
        (m) => m.status === "online",
      ).length;
      const totalCount = Object.keys(providerModels).length;

      tree.children?.push({
        name: `${provider} (${onlineCount}/${totalCount} online)`,
        hasChildren: true,
        children,
      });
    }

    return tree;
  };

  const selectedModel = await agent.askHuman({
    type: "askForSingleTreeSelection",
    title: "TTS Model Selection",
    message: "Choose a TTS model:",
    tree: buildModelTree(),
  });

  if (selectedModel) {
    agent.mutateState(AudioState, (state) => {
      state.speech.model = selectedModel;
    });
    agent.infoLine(`TTS model set to ${selectedModel}`);
  } else {
    agent.infoLine("Model selection cancelled. No changes made.");
  }
}
