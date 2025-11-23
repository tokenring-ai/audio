import {Agent} from "@tokenring-ai/agent";
import {TranscriptionResult} from "@tokenring-ai/ai-client/client/AITranscriptionClient";
import {TokenRingService} from "@tokenring-ai/app/types";
import KeyedRegistryWithSingleSelection from "@tokenring-ai/utility/registry/KeyedRegistryWithSingleSelection";
import AudioProvider, {
  type AudioResult,
  type PlaybackOptions,
  type RecordingOptions,
  type RecordingResult,
  type TextToSpeechOptions,
  type TranscriptionOptions
} from "./AudioProvider.js";

export default class AudioService implements TokenRingService {
  name = "AudioService";
  description = "Service for Audio Operations";
  protected agent!: Agent;

  private providerRegistry = new KeyedRegistryWithSingleSelection<AudioProvider>();

  registerProvider = this.providerRegistry.register;
  getActiveProvider = this.providerRegistry.getActiveItem;
  setActiveProvider = this.providerRegistry.setEnabledItem;
  getAvailableProviders = this.providerRegistry.getAllItemNames;

  async record(abortSignal: AbortSignal, options?: RecordingOptions): Promise<RecordingResult> {
    return this.providerRegistry.getActiveItem().record(abortSignal, options);
  }

  async transcribe(audioFile: any, options?: TranscriptionOptions): Promise<TranscriptionResult> {
    return this.providerRegistry.getActiveItem().transcribe(audioFile, options);
  }

  async speak(text: string, options?: TextToSpeechOptions): Promise<AudioResult> {
    return this.providerRegistry.getActiveItem().speak(text, options);
  }

  async playback(filename: string, options?: PlaybackOptions): Promise<string> {
    return this.providerRegistry.getActiveItem().playback(filename, options);
  }
}