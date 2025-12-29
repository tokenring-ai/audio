export interface RecordingOptions {
  sampleRate?: number;
  channels?: number;
  format?: string;
  timeout?: number;
}

export interface RecordingResult {
  filePath: string;
}

export interface AudioResult {
  data: any;
}

export interface AudioProvider {
  record(abortSignal: AbortSignal, options: RecordingOptions): Promise<RecordingResult>;
  playback(filename: string): Promise<string>;
}