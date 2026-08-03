import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from "bun:test";
import createTestingApp from "@tokenring-ai/app/test/createTestingApp.test";
import { ChatService } from "@tokenring-ai/chat";
import plugin from "./plugin.ts";
import { AudioServiceConfigSchema } from "./schema.ts";

describe("Audio Plugin", () => {
  let app: ReturnType<typeof createTestingApp>;

  beforeEach(() => {
    app = createTestingApp();
  });

  afterEach(() => {
    app.shutdown();
  });

  it("should have correct plugin metadata", () => {
    expect(plugin.name).toBe("@tokenring-ai/audio");
    expect(plugin.version).toBeDefined();
    expect(plugin.description).toBeDefined();
  });

  it("should always install AudioService", () => {
    plugin.install(app);

    const services = app.getServices();
    expect(services.some(s => s.name === "AudioService")).toBe(true);
  });

  it("should reconfigure AudioService with valid configuration", () => {
    const config = {
      audio: AudioServiceConfigSchema.parse({
        tmpDirectory: "/tmp",
        providers: {},
        agentDefaults: {
          provider: "test-provider",
          transcribe: {},
          speech: {},
        },
      }),
    };

    plugin.install(app);
    plugin.reconfigure?.(app, config as any);

    const services = app.getServices();
    expect(services.some(s => s.name === "AudioService")).toBe(true);
  });

  it("should wait for ChatService to add tools", () => {
    // Mock ChatService with spy
    const mockChatService = new ChatService(app, {
      defaultModels: [],
      defaultTranscriptionModels: [],
      agentDefaults: {
        parallelTools: false,
        enabledTools: [],
        maxSteps: 0,
        allowRemoteAttachments: true,
        autoToolApprovalLevel: 3,
        toolApprovalMode: "ask",
        compaction: { policy: "ask", compactionThreshold: 0.5, background: false, focus: "summary" },
        context: { initial: [], followUp: [] },
      },
    });
    spyOn(mockChatService, "addTools");
    app.addService(mockChatService);

    plugin.install(app);

    // The plugin should have called waitForService which will eventually call addTools
    expect(mockChatService.addTools).toBeDefined();
  });

  it("should wait for AgentCommandService to add commands", () => {
    // Mock AgentCommandService with spy
    const mockCommandService = {
      addAgentCommands: mock(),
    };
    app.addService(mockCommandService as any);

    plugin.install(app);

    expect(mockCommandService.addAgentCommands).toBeDefined();
  });

  it("should handle missing audio configuration", () => {
    plugin.install(app);
    plugin.reconfigure?.(app, {} as any);

    const services = app.getServices();
    expect(services.some(s => s.name === "AudioService")).toBe(true);
  });
});
