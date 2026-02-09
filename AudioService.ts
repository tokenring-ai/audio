import {Agent} from "@tokenring-ai/agent";
import {TranscriptionResult} from "@tokenring-ai/ai-client/client/AITranscriptionClient";
import {SpeechModelRegistry, TranscriptionModelRegistry} from "@tokenring-ai/ai-client/ModelRegistry";
import {TokenRingService} from "@tokenring-ai/app/types";
import deepMerge from "@tokenring-ai/utility/object/deepMerge";
import KeyedRegistry from "@tokenring-ai/utility/registry/KeyedRegistry";
import fs from "node:fs";
import {z} from "zod";
import {AudioProvider, AudioResult} from "./AudioProvider.ts";
import {AudioAgentConfigSchema, AudioServiceConfigSchema} from "./schema.ts";
import {AudioState} from "./state/audioState.ts";

export default class AudioService implements TokenRingService {
  readonly name = "AudioService";
  description = "Service for Audio Operations";

  private providerRegistry = new KeyedRegistry<AudioProvider>();

  registerProvider = this.providerRegistry.register;
  getAvailableProviders = this.providerRegistry.getAllItemNames;

  constructor(readonly options: z.output<typeof AudioServiceConfigSchema>) {}

  attach(agent: Agent): void {
    const agentConfig = deepMerge(this.options.agentDefaults, agent.getAgentConfigSlice('audio', AudioAgentConfigSchema));
    agent.initializeState(AudioState, agentConfig);
  }

  requireAudioProvider(agent: Agent): AudioProvider {
    const providerName = agent.getState(AudioState).activeProvider;
    if (! providerName) throw new Error("No audio provider has been enabled.");
    return this.providerRegistry.requireItemByName(providerName);
  }

  setActiveProvider(name: string, agent: Agent): void {
    agent.mutateState(AudioState, (state) => {
      state.activeProvider = name;
    });
  }

  async convertAudioToText(audioFile: any, { language } : { language?: string }, agent: Agent): Promise<TranscriptionResult> {
    const transcriptionModelRegistry = agent.requireServiceByType(TranscriptionModelRegistry);
    const { transcribe } = agent.getState(AudioState)
    const client = await transcriptionModelRegistry.getClient(transcribe.model);

    const audioBuffer = typeof audioFile === 'string'
      ? fs.readFileSync(audioFile)
      : audioFile;

    const [text] = await client.transcribe(
      {
        audio: audioBuffer,
        language: language ?? transcribe.language,
        prompt: transcribe.prompt,
      },
      agent
    );

    return {text};
  }

  async convertTextToSpeech(text: string, { voice, speed } : { voice?:string, speed?:number }, agent: Agent): Promise<AudioResult> {
    const speechModelRegistry = agent.requireServiceByType(SpeechModelRegistry);
    const { speech } = agent.getState(AudioState);
    const client = await speechModelRegistry.getClient(speech.model);

    const [audioData] = await client.generateSpeech(
      {
        text,
        voice: voice ?? speech.voice,
        speed: speed ?? speech.speed
      },
      agent
    );

    return {data: audioData};
  }
}