export interface RecordingOptions {
  sampleRate?: number | undefined;
  channels?: number | undefined;
  format?: string | undefined;
  timeout?: number | undefined;
  keywords?: string[] | undefined;
}

export interface RecordingResult {
  filePath: string;
  mediaType?: string | undefined;
  sampleRate?: number | undefined;
  channels?: number | undefined;
  duration?: number | undefined;
}

export interface AudioResult {
  data: any;
  mediaType?: string | undefined;
}

export interface AudioProvider {
  record(abortSignal: AbortSignal, options: RecordingOptions): Promise<RecordingResult>;

  playback(filename: string): Promise<string>;
}
