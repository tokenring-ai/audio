import createTestingAgent from "@tokenring-ai/agent/test/createTestingAgent";
import { SpeechModelRegistry, TranscriptionModelRegistry } from "@tokenring-ai/ai-client/ModelRegistry";
import createTestingApp from "@tokenring-ai/app/test/createTestingApp";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AudioService from "./AudioService.ts";
import sttGetCommand from "./commands/audio/model/stt/get.ts";
import sttResetCommand from "./commands/audio/model/stt/reset.ts";
import sttSetCommand from "./commands/audio/model/stt/set.ts";
import ttsGetCommand from "./commands/audio/model/tts/get.ts";
import ttsResetCommand from "./commands/audio/model/tts/reset.ts";
import ttsSetCommand from "./commands/audio/model/tts/set.ts";
import playCommand from "./commands/audio/play.ts";
import recordCommand from "./commands/audio/record.ts";
import speakCommand from "./commands/audio/speak.ts";
import transcribeCommand from "./commands/audio/transcribe.ts";
import { AudioState } from "./state/audioState.ts";

describe("Audio Commands", () => {
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
        transcribe: { model: "whisper-1", language: "en", prompt: "test" },
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

  describe("record command", () => {
    it("should have correct metadata", () => {
      expect(recordCommand.name).toBe("audio record");
      expect(recordCommand.description).toBe("Record audio from microphone");
      expect(recordCommand.help).toBeDefined();
    });

    it("should record audio", async () => {
      const result = await recordCommand.execute({ args: {}, agent } as any);

      expect(result).toBe("Recording saved: /tmp/test.wav");
      expect(mockProvider.record).toHaveBeenCalled();
    });

    it("should record with format option", async () => {
      const result = await recordCommand.execute({
        args: { "--format": "wav" },
        agent
      } as any);

      expect(mockProvider.record).toHaveBeenCalledWith(
        expect.any(AbortSignal),
        expect.objectContaining({ format: "wav" })
      );
    });

    it("should call infoMessage when recording", async () => {
      const infoSpy = vi.spyOn(agent, "infoMessage");

      await recordCommand.execute({ args: {}, agent } as any);

      expect(infoSpy).toHaveBeenCalledWith("Recording... Press Ctrl+C to stop");
    });
  });

  describe("play command", () => {
    it("should have correct metadata", () => {
      expect(playCommand.name).toBe("audio play");
      expect(playCommand.description).toBe("Play audio file");
      expect(playCommand.help).toBeDefined();
    });

    it("should play audio file", async () => {
      const result = await playCommand.execute({
        positionals: { file: "/tmp/test.wav" },
        agent
      } as any);

      expect(result).toBe("Played: /tmp/test.wav");
      expect(mockProvider.playback).toHaveBeenCalledWith("/tmp/test.wav");
    });
  });

  describe("speak command", () => {
    it("should have correct metadata", () => {
      expect(speakCommand.name).toBe("audio speak");
      expect(speakCommand.description).toBe("Convert text to speech");
      expect(speakCommand.help).toBeDefined();
    });

    it("should convert text to speech", async () => {
      const result = await speakCommand.execute({
        remainder: "Hello world",
        args: {},
        agent
      } as any);

      expect(result).toContain("Speech generated:");
      expect(mockSpeechModel.generateSpeech).toHaveBeenCalled();
    });

    it("should use custom voice when provided", async () => {
      await speakCommand.execute({
        remainder: "Hello",
        args: { "--voice": "female" },
        agent
      } as any);

      expect(mockSpeechModel.generateSpeech).toHaveBeenCalledWith(
        expect.objectContaining({ voice: "female" }),
        agent
      );
    });

    it("should use custom speed when provided", async () => {
      await speakCommand.execute({
        remainder: "Hello",
        args: { "--speed": "1.5" },
        agent
      } as any);

      expect(mockSpeechModel.generateSpeech).toHaveBeenCalledWith(
        expect.objectContaining({ speed: 1.5 }),
        agent
      );
    });
  });

  describe("transcribe command", () => {
    it("should have correct metadata", () => {
      expect(transcribeCommand.name).toBe("audio transcribe");
      expect(transcribeCommand.description).toBe("Transcribe audio to text");
      expect(transcribeCommand.help).toBeDefined();
    });

    it("should transcribe audio file", async () => {
      // Pass a Buffer instead of a file path
      const audioBuffer = Buffer.from("fake audio data");
      const result = await transcribeCommand.execute({
        positionals: { file: audioBuffer },
        args: {},
        agent
      } as any);

      expect(result).toBe("Transcription: Hello world");
      expect(mockTranscriptionModel.transcribe).toHaveBeenCalled();
    });

    it("should use custom language when provided", async () => {
      const audioBuffer = Buffer.from("fake audio data");
      await transcribeCommand.execute({
        positionals: { file: audioBuffer },
        args: { "--language": "de" },
        agent
      } as any);

      expect(mockTranscriptionModel.transcribe).toHaveBeenCalledWith(
        expect.objectContaining({ language: "de" }),
        agent
      );
    });

    it("should throw error when file is not provided", async () => {
      await expect(transcribeCommand.execute({
        positionals: { file: undefined },
        args: {},
        agent
      } as any))
        .rejects.toThrow("Usage: /audio transcribe <filename> [flags]");
    });
  });

  describe("STT model commands", () => {
    it("should get STT model", async () => {
      const result = await sttGetCommand.execute({ agent } as any);

      expect(result).toBe("Current STT model: whisper-1");
    });

    it("should set STT model", async () => {
      const result = await sttSetCommand.execute({
        positionals: { model: "new-model" },
        agent
      } as any);

      expect(result).toBe("STT model set to new-model");
      expect(agent.getState(AudioState).transcribe.model).toBe("new-model");
    });

    it("should reset STT model to current value", async () => {
      // The reset command resets to initialConfig.transcribe.model
      // which is 'whisper-1' from the config
      const result = await sttResetCommand.execute({ agent } as any);

      // The reset command reads from initialConfig, not the current state
      expect(result).toBe("STT model reset to whisper-1");
      expect(agent.getState(AudioState).transcribe.model).toBe("whisper-1");
    });
  });

  describe("TTS model commands", () => {
    it("should get TTS model", async () => {
      const result = await ttsGetCommand.execute({ agent } as any);

      expect(result).toBe("Current TTS model: tts-1");
    });

    it("should set TTS model", async () => {
      const result = await ttsSetCommand.execute({
        positionals: { model: "new-tts-model" },
        agent
      } as any);

      expect(result).toBe("TTS model set to new-tts-model");
      expect(agent.getState(AudioState).speech.model).toBe("new-tts-model");
    });

    it("should reset TTS model to current value", async () => {
      // The reset command resets to initialConfig.speech.model
      // which is 'tts-1' from the config
      const result = await ttsResetCommand.execute({ agent } as any);

      // The reset command reads from initialConfig
      expect(result).toBe("TTS model reset to tts-1");
      expect(agent.getState(AudioState).speech.model).toBe("tts-1");
    });
  });
});
