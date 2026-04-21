export interface RecordingOptions {
  sampleRate?: number | undefined;
  channels?: number | undefined;
  format?: string | undefined;
  timeout?: number | undefined;
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
