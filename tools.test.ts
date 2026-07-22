import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from "bun:test";
import fs from "node:fs";
import createTestingAgent from "@tokenring-ai/agent/test/createTestingAgent.test";
import { SpeechModelRegistry, TranscriptionModelRegistry } from "@tokenring-ai/ai-client/ModelRegistry";
import createTestingApp from "@tokenring-ai/app/test/createTestingApp.test";
import MediaLibraryService from "@tokenring-ai/media-library/MediaLibraryService";
import AudioService from "./AudioService.ts";
import playbackTool from "./tools/playback.ts";
import recordTool from "./tools/record.ts";
import speakTool from "./tools/speak.ts";
import transcribeTool from "./tools/transcribe.ts";

const TEST_WAV_PATH = "/tmp/tokenring-audio-tools-test.wav";
const MEDIA_OUTPUT_DIR = "/tmp/tokenring-audio-tools-media";

describe("Audio Tools", () => {
  let app: ReturnType<typeof createTestingApp>;
  let agent: ReturnType<typeof createTestingAgent>;
  let audioService: AudioService;
  let mockProvider: any;
  let mockTranscriptionModel: any;
  let mockSpeechModel: any;
  let mockTranscriptionRegistry: any;
  let mockSpeechRegistry: any;
  let mediaLibrary: MediaLibraryService;

  beforeEach(() => {
    app = createTestingApp();
    fs.writeFileSync(TEST_WAV_PATH, Buffer.from("RIFF....WAVEfmt "));

    mockProvider = {
      record: mock().mockResolvedValue({ filePath: TEST_WAV_PATH }),
      playback: mock().mockResolvedValue(TEST_WAV_PATH),
    };

    mockTranscriptionModel = {
      transcribe: mock().mockResolvedValue(["Hello world"]),
    };

    mockSpeechModel = {
      generateSpeech: mock().mockResolvedValue([Buffer.from("test audio")]),
    };

    mockTranscriptionRegistry = new TranscriptionModelRegistry();
    mockSpeechRegistry = new SpeechModelRegistry();

    spyOn(mockTranscriptionRegistry, "getClient").mockReturnValue(mockTranscriptionModel);
    spyOn(mockSpeechRegistry, "getClient").mockReturnValue(mockSpeechModel);

    mediaLibrary = new MediaLibraryService({
      staticPath: "/api/media",
      agentDefaults: { outputDirectory: MEDIA_OUTPUT_DIR },
    });
    spyOn(mediaLibrary, "writeMedia").mockImplementation(async (options: any) => {
      const extension = options.extension ?? "bin";
      const filename = `saved.${extension}`;
      const filePath = `${MEDIA_OUTPUT_DIR}/${filename}`;
      return {
        kind: options.kind,
        filename,
        filePath,
        mimeType: options.mimeType,
        keywords: options.keywords ?? [],
        buffer: options.buffer,
      };
    });

    const config = {
      tmpDirectory: "/tmp",
      providers: { test: mockProvider },
      agentDefaults: {
        provider: "test",
        transcribe: { model: "whisper-1", language: "en" },
        speech: { model: "tts-1", voice: "alloy", speed: 1.0 },
      },
    };

    audioService = new AudioService(config as any);
    audioService.registerProvider("test", mockProvider);

    app.addServices(mockTranscriptionRegistry);
    app.addServices(mockSpeechRegistry);
    app.addServices(mediaLibrary);
    app.addServices(audioService);

    agent = createTestingAgent(app);
    audioService.attach(agent);
    audioService.setActiveProvider("test", agent);
  });

  afterEach(() => {
    app.shutdown();
    try {
      fs.unlinkSync(TEST_WAV_PATH);
    } catch {
      // ignore
    }
  });

  describe("record tool", () => {
    it("should have correct metadata", () => {
      expect(recordTool.name).toBe("voice_record");
      expect(recordTool.displayName).toBe("Audio/record");
      expect(recordTool.description).toBe("Record audio using the active voice provider and save it to the media library");
      expect(recordTool.inputSchema).toBeDefined();
    });

    it("should record audio with default options", async () => {
      const result = await recordTool.execute({}, agent);

      expect(result.message).toBe("**Audio** Recorded audio");
      const parsed = JSON.parse(result.result);
      expect(parsed.path).toBe(`${MEDIA_OUTPUT_DIR}/saved.wav`);
      expect(parsed.fileName).toBe("saved.wav");
      expect(parsed.mediaType).toBeDefined();
      expect(mockProvider.record).toHaveBeenCalled();
    });

    it("should record audio with custom sample rate", async () => {
      const _result = await recordTool.execute({ sampleRate: 48000 }, agent);

      expect(mockProvider.record).toHaveBeenCalledWith(expect.any(AbortSignal), expect.objectContaining({ sampleRate: 48000 }));
    });

    it("should record audio with custom channels", async () => {
      const _result = await recordTool.execute({ channels: 2 }, agent);

      expect(mockProvider.record).toHaveBeenCalledWith(expect.any(AbortSignal), expect.objectContaining({ channels: 2 }));
    });

    it("should record audio with custom format", async () => {
      const _result = await recordTool.execute({ format: "wav" }, agent);

      expect(mockProvider.record).toHaveBeenCalledWith(expect.any(AbortSignal), expect.objectContaining({ format: "wav" }));
    });

    it("should record audio with timeout", async () => {
      const _result = await recordTool.execute({ timeout: 5000 }, agent);

      expect(mockProvider.record).toHaveBeenCalled();
    });
  });

  describe("transcribe tool", () => {
    it("should have correct metadata", () => {
      expect(transcribeTool.name).toBe("voice_transcribe");
      expect(transcribeTool.displayName).toBe("Audio/transcribe");
      expect(transcribeTool.description).toBe("Transcribe audio using the active voice provider");
    });

    it("should transcribe audio file", async () => {
      const audioBuffer = Buffer.from("fake audio data");
      const result = await transcribeTool.execute({ audioFile: audioBuffer }, agent);

      expect(result.message).toBe("**Audio** Transcribed audio");
      expect(result.result).toBe("Transcription Results:\nHello world");
      expect(mockTranscriptionModel.transcribe).toHaveBeenCalled();
    });

    it("should pass audio buffer to transcription client", async () => {
      const audioBuffer = Buffer.from("fake audio data");
      await transcribeTool.execute({ audioFile: audioBuffer }, agent);

      expect(mockTranscriptionModel.transcribe).toHaveBeenCalledWith(expect.objectContaining({ audio: audioBuffer }), agent);
    });

    it("should call infoMessage when transcribing", async () => {
      const audioBuffer = Buffer.from("fake audio data");
      const infoSpy = spyOn(agent, "infoMessage");

      await transcribeTool.execute({ audioFile: audioBuffer }, agent);

      expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining("[voice_transcribe]"));
    });
  });

  describe("speak tool", () => {
    it("should have correct metadata", () => {
      expect(speakTool.name).toBe("voice_speak");
      expect(speakTool.displayName).toBe("Audio/speak");
      expect(speakTool.description).toBe("Convert text to speech, save it to the media library, and play it using the active audio provider");
    });

    it("should convert text to speech", async () => {
      const result = await speakTool.execute({ text: "Hello world" }, agent);

      expect(result.message).toBe("**Audio** Spoke text");
      const parsed = JSON.parse(result.result);
      expect(parsed.path).toBe(`${MEDIA_OUTPUT_DIR}/saved.mp3`);
      expect(parsed.fileName).toBe("saved.mp3");
      expect(parsed.mediaType).toBe("audio/mpeg");
      expect(mockSpeechModel.generateSpeech).toHaveBeenCalled();
      expect(mockProvider.playback).toHaveBeenCalledWith(`${MEDIA_OUTPUT_DIR}/saved.mp3`);
    });

    it("should throw error when text is empty", async () => {
      expect(speakTool.execute({ text: "" }, agent)).rejects.toThrow("text is required");
    });

    it("should call infoMessage when converting to speech", async () => {
      const infoSpy = spyOn(agent, "infoMessage");

      await speakTool.execute({ text: "Hello world" }, agent);

      expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining("[voice_speak]"));
    });

    it("should use custom speed when provided", async () => {
      await speakTool.execute({ text: "Hello", speed: 1.5 }, agent);

      expect(mockSpeechModel.generateSpeech).toHaveBeenCalledWith(expect.objectContaining({ speed: 1.5 }), agent);
    });
  });

  describe("playback tool", () => {
    it("should have correct metadata", () => {
      expect(playbackTool.name).toBe("audio_playback");
      expect(playbackTool.displayName).toBe("Audio/playback");
      expect(playbackTool.description).toBe("Play audio file using the active voice provider");
    });

    it("should play audio file", async () => {
      const result = await playbackTool.execute({ filename: "/tmp/test.wav" }, agent);

      // Tool reports the provider playback return value
      expect(result.message).toBe("**Audio** Played /tmp/test.wav");
      expect(result.result).toBe(`Played audio file: ${TEST_WAV_PATH}`);
      expect(mockProvider.playback).toHaveBeenCalledWith("/tmp/test.wav");
    });

    it("should call infoMessage when playing", async () => {
      const infoSpy = spyOn(agent, "infoMessage");

      await playbackTool.execute({ filename: "/tmp/test.wav" }, agent);

      expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining("[audio_playback]"));
    });
  });
});
