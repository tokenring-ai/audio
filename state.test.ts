import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import createTestingAgent from "@tokenring-ai/agent/test/createTestingAgent.test";
import createTestingApp from "@tokenring-ai/app/test/createTestingApp.test";
import AudioService from "./AudioService.ts";
import { AudioServiceConfigSchema } from "./schema.ts";
import { AudioState } from "./state/audioState.ts";

describe("AudioState", () => {
  let app: ReturnType<typeof createTestingApp>;
  let agent: ReturnType<typeof createTestingAgent>;
  let audioService: AudioService;

  beforeEach(() => {
    app = createTestingApp();

    const config = AudioServiceConfigSchema.parse({
      providers: {},
      agentDefaults: {
        provider: "test-provider",
        transcribe: {
          model: "whisper-1",
          prompt: "Convert to English",
          language: "en",
        },
        speech: {
          model: "OpenAI:tts-1",
          voice: "alloy",
          speed: 1.0,
        },
      },
    });

    audioService = new AudioService(config);
    app.addService(audioService);
    agent = createTestingAgent(app);
    audioService.attach(agent);
  });

  afterEach(() => {
    app.shutdown();
  });

  it("should initialize with correct default values", () => {
    const state = agent.getState(AudioState);

    expect(state.transcribe.model).toBe("whisper-1");
    expect(state.transcribe.prompt).toBe("Convert to English");
    expect(state.transcribe.language).toBe("en");
    expect(state.speech.model).toBe("OpenAI:tts-1");
    expect(state.speech.voice).toBe("alloy");
    expect(state.speech.speed).toBe(1.0);
  });

  it("should serialize state correctly", () => {
    const state = agent.getState(AudioState);

    const serialized = state.serialize();

    expect(serialized).toEqual({
      transcribe: {
        model: "whisper-1",
        prompt: "Convert to English",
        language: "en",
      },
      speech: {
        model: "OpenAI:tts-1",
        voice: "alloy",
        speed: 1.0,
      },
    });
  });

  it("should deserialize state correctly", () => {
    const state = agent.getState(AudioState);

    const newData = {
      activeProvider: "new-provider",
      transcribe: {
        model: "new-whisper",
        prompt: "New prompt",
        language: "de",
      },
      speech: {
        model: "new-tts",
        voice: "new-voice",
        speed: 1.5,
      },
    };

    state.deserialize(newData);
    expect(state.transcribe.model).toBe("new-whisper");
    expect(state.transcribe.prompt).toBe("New prompt");
    expect(state.transcribe.language).toBe("de");
    expect(state.speech.model).toBe("new-tts");
    expect(state.speech.voice).toBe("new-voice");
    expect(state.speech.speed).toBe(1.5);
  });

  it("should mutate state using agent method", () => {
    agent.mutateState(AudioState, state => {
      state.transcribe.model = "mutated-model";
    });

    const state = agent.getState(AudioState);
    expect(state.transcribe.model).toBe("mutated-model");
  });

  it("should transfer state from parent agent", () => {
    // Create a parent agent with specific state
    const parentAgent = createTestingAgent(app);
    audioService.attach(parentAgent);

    parentAgent.mutateState(AudioState, state => {
      state.transcribe.model = "parent-model";
    });

    // Get the parent state
    const parentState = parentAgent.getState(AudioState);

    // Create a child agent and transfer state via mutateState
    const childAgent = createTestingAgent(app);
    audioService.attach(childAgent);
    childAgent.mutateState(AudioState, state => {
      state.transcribe = parentState.transcribe;
      state.speech = parentState.speech;
    });

    const childState = childAgent.getState(AudioState);
    expect(childState.transcribe.model).toBe("parent-model");
  });

  it("should show state as formatted strings", () => {
    const state = agent.getState(AudioState);

    const output = state.show();

    expect(output).toContain("Active Provider: test-provider");
    expect(output).toContain("Transcription Model: whisper-1");
    expect(output).toContain("Transcription Prompt: Convert to English");
    expect(output).toContain("Transcription Language: en");
    expect(output).toContain("Speech Model: OpenAI:tts-1");
    expect(output).toContain("Speech Voice: alloy");
    expect(output).toContain("Speech Speed: 1");
  });

  it("should handle missing optional config fields", () => {
    const config = AudioServiceConfigSchema.parse({
      providers: {},
      agentDefaults: {
        provider: "test-provider",
      },
    });

    const newAudioService = new AudioService(config);
    const newAgent = createTestingAgent(app);
    newAudioService.attach(newAgent);

    const state = newAgent.getState(AudioState);
    // Should have defaults from schema
    expect(state.transcribe.model).toBe("whisper-1");
    expect(state.speech.model).toBe("OpenAI:tts-1");
  });
});
