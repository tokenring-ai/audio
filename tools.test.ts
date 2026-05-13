import createTestingAgent from "@tokenring-ai/agent/test/createTestingAgent";
import { SpeechModelRegistry, TranscriptionModelRegistry } from "@tokenring-ai/ai-client/ModelRegistry";
import createTestingApp from "@tokenring-ai/app/test/createTestingApp";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AudioService from "./AudioService.ts";
import playbackTool from "./tools/playback.ts";
import recordTool from "./tools/record.ts";
import speakTool from "./tools/speak.ts";
import transcribeTool from "./tools/transcribe.ts";

describe("Audio Tools", () => {
  let app: ReturnType<typeof createTestingApp>;
  let agent: ReturnType<typeof createTestingAgent>;
  let audioService: AudioService;
  let mockProvider: any;
  let mockTranscriptionModel: any;
  let mockSpeechModel: any;
  let mockTranscriptionRegistry: any;
  let mockSpeechRegistry: any;

  beforeEach(() => {
    app = createTestingApp();

    mockProvider = {
      record: vi.fn().mockResolvedValue({ filePath: "/tmp/test.wav" }),
      playback: vi.fn().mockResolvedValue("/tmp/test.wav")
    };

    mockTranscriptionModel = {
      transcribe: vi.fn().mockResolvedValue(["Hello world"])
    };

    mockSpeechModel = {
      generateSpeech: vi.fn().mockResolvedValue([Buffer.from("test audio")])
    };

    // Create proper mock registries
    mockTranscriptionRegistry = new TranscriptionModelRegistry(app);
    mockSpeechRegistry = new SpeechModelRegistry(app);

    vi.spyOn(mockTranscriptionRegistry, "getClient").mockResolvedValue(mockTranscriptionModel);
    vi.spyOn(mockSpeechRegistry, "getClient").mockResolvedValue(mockSpeechModel);

    const config = {
      tmpDirectory: "/tmp",
      providers: { test: mockProvider },
      agentDefaults: {
        provider: "test",
        transcribe: { model: "whisper-1", language: "en" },
        speech: { model: "tts-1", voice: "alloy", speed: 1.0 }
      }
    };

    audioService = new AudioService(config as any);
    audioService.registerProvider("test", mockProvider);

    app.addServices(mockTranscriptionRegistry);
    app.addServices(mockSpeechRegistry);
    app.addServices(audioService);

    agent = createTestingAgent(app);
    audioService.attach(agent);
    audioService.setActiveProvider("test", agent);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    app.shutdown();
  });

  describe("record tool", () => {
    it("should have correct metadata", () => {
      expect(recordTool.name).toBe("voice_record");
      expect(recordTool.displayName).toBe("Audio/record");
      expect(recordTool.description).toBe("Record audio using the active voice provider");
      expect(recordTool.inputSchema).toBeDefined();
    });

    it("should record audio with default options", async () => {
      const result = await recordTool.execute({}, agent);

      expect(result.type).toBe("json");
      expect(result.data.filePath).toBe("/tmp/test.wav");
      expect(mockProvider.record).toHaveBeenCalled();
    });

    it("should record audio with custom sample rate", async () => {
      const result = await recordTool.execute({ sampleRate: 48000 }, agent);

      expect(mockProvider.record).toHaveBeenCalledWith(
        expect.any(AbortSignal),
        expect.objectContaining({ sampleRate: 48000 })
      );
    });

    it("should record audio with custom channels", async () => {
      const result = await recordTool.execute({ channels: 2 }, agent);

      expect(mockProvider.record).toHaveBeenCalledWith(
        expect.any(AbortSignal),
        expect.objectContaining({ channels: 2 })
      );
    });

    it("should record audio with custom format", async () => {
      const result = await recordTool.execute({ format: "wav" }, agent);

      expect(mockProvider.record).toHaveBeenCalledWith(
        expect.any(AbortSignal),
        expect.objectContaining({ format: "wav" })
      );
    });

    it("should record audio with timeout", async () => {
      const result = await recordTool.execute({ timeout: 5000 }, agent);

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
      // Pass a Buffer instead of a file path
      const audioBuffer = Buffer.from("fake audio data");
      const result = await transcribeTool.execute({ audioFile: audioBuffer, language: "en" }, agent);

      expect(result).toBe("Hello world");
      expect(mockTranscriptionModel.transcribe).toHaveBeenCalled();
    });

    it("should transcribe with custom language", async () => {
      const audioBuffer = Buffer.from("fake audio data");
      await transcribeTool.execute({ audioFile: audioBuffer, language: "de" }, agent);

      expect(mockTranscriptionModel.transcribe).toHaveBeenCalledWith(
        expect.objectContaining({ language: "de" }),
        agent
      );
    });

    it("should call infoMessage when transcribing", async () => {
      const audioBuffer = Buffer.from("fake audio data");
      const infoSpy = vi.spyOn(agent, "infoMessage");

      await transcribeTool.execute({ audioFile: audioBuffer, language: "en" }, agent);

      expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining("[voice_transcribe]"));
    });
  });

  describe("speak tool", () => {
    it("should have correct metadata", () => {
      expect(speakTool.name).toBe("voice_speak");
      expect(speakTool.displayName).toBe("Audio/speak");
      expect(speakTool.description).toBe("Convert text to speech using the active voice provider");
    });

    it("should convert text to speech", async () => {
      const result = await speakTool.execute({ text: "Hello world" }, agent);

      expect(result).toBe("Playback succeeded");
      expect(mockSpeechModel.generateSpeech).toHaveBeenCalled();
      expect(mockProvider.playback).toHaveBeenCalled();
    });

    it("should throw error when text is empty", async () => {
      await expect(speakTool.execute({ text: "" }, agent))
        .rejects.toThrow("text is required");
    });

    it("should call infoMessage when converting to speech", async () => {
      const infoSpy = vi.spyOn(agent, "infoMessage");

      await speakTool.execute({ text: "Hello world" }, agent);

      expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining("[voice_speak]"));
    });

    it("should use custom speed when provided", async () => {
      await speakTool.execute({ text: "Hello", speed: 1.5 }, agent);

      expect(mockSpeechModel.generateSpeech).toHaveBeenCalledWith(
        expect.objectContaining({ speed: 1.5 }),
        agent
      );
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

      expect(result.type).toBe("json");
      expect(result.data.filePath).toBe("/tmp/test.wav");
      expect(mockProvider.playback).toHaveBeenCalledWith("/tmp/test.wav");
    });

    it("should call infoMessage when playing", async () => {
      const infoSpy = vi.spyOn(agent, "infoMessage");

      await playbackTool.execute({ filename: "/tmp/test.wav" }, agent);

      expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining("[audio_playback]"));
    });
  });
});
