import { TranscriptionResult } from "@tokenring-ai/ai-client/client/AITranscriptionClient";

export interface RecordingOptions {
  sampleRate?: number;
  channels?: number;
  format?: string;
  timeout?: number;
}

export interface PlaybackOptions {
  sampleRate?: number;
  channels?: number;
  timeout?: number;
}

export interface TranscriptionOptions {
  model?: string;
  prompt?: string;
  language?: string;
  timestampGranularity?: string;
  timeout?: number;
}

export interface TextToSpeechOptions {
  model?: string;
  voice?: string;
  speed?: number;
  format?: string;
  timeout?: number;
}

export interface RecordingResult {
  filePath: string;
}

export interface AudioResult {
  data: any;
}

export default abstract class AudioProvider {
  abstract record(abortSignal: AbortSignal, options?: RecordingOptions): Promise<RecordingResult>;
  
  abstract transcribe(audioFile: any, options?: TranscriptionOptions): Promise<TranscriptionResult>;
  
  abstract speak(text: string, options?: TextToSpeechOptions): Promise<AudioResult>;
  
  abstract playback(filename: string, options?: PlaybackOptions): Promise<string>;
}