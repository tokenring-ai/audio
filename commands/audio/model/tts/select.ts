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

  const buildModelTree = (): TreeNode[] => {
    const roots: TreeNode[] = [];

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

      roots.push({
        name: `${provider} (${onlineCount}/${totalCount} online)`,
        hasChildren: true,
        children,
      });
    }

    return roots;
  };

  const selection = await agent.askQuestion({
    message: "Choose a Text to Speech model:",
    question: {
      type: 'treeSelect',
      label: "Model Selection",
      key: "result",
      minimumSelections: 1,
      maximumSelections: 1,
      tree: buildModelTree(),
    }
  });

  if (selection !== null) {
    const selectedModel = selection[0];
    agent.mutateState(AudioState, (state) => {
      state.speech.model = selectedModel;
    });
    agent.infoMessage(`TTS model set to ${selectedModel}`);
  } else {
    agent.infoMessage("Model selection cancelled. No changes made.");
  }
}
