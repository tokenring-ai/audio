# @tokenring-ai/audio

## Overview

Voice recording, playback, and speech processing for the TokenRing AI ecosystem. This package provides audio operations
through integration with the AI client services for transcription and speech generation. It supports type-safe
configuration with Zod schemas and integrates with the TokenRing agent framework.

The package serves as a bridge between concrete audio providers (like `@tokenring-ai/linux-audio`) and the AI client's
transcription/speech models, enabling:

- **Recording and playback** through platform-specific audio providers
- **Speech-to-text (STT)** conversion using transcription model registries
- **Text-to-speech (TTS)** generation using speech model registries
- **State management** for audio configuration persistence across agent sessions
- **Plugin architecture** for automatic service, tool, and command registration

## Installation

```bash
bun install @tokenring-ai/audio
```

## Key Features

- **Type-Safe Configuration**: Zod-based validation for all configuration options
- **Audio Transcription**: Convert audio to text using transcription model registry
- **Text-to-Speech**: Generate speech from text using speech model registry
- **Agent State Management**: Audio state is persisted across agent sessions
- **Plugin Architecture**: Automatic registration with TokenRing applications
- **Interactive Model Management**: Select TTS and STT models from available providers
- **Command System**: Rich chat command interface for audio operations
- **Tool Integration**: Agent tools for programmatic audio operations
- **Provider Abstraction**: Abstract `AudioProvider` interface with concrete implementations

## Dependencies

- `@tokenring-ai/ai-client` - AI client services for transcription and speech
- `@tokenring-ai/app` - Base application framework
- `@tokenring-ai/chat` - Chat service for tool registration
- `@tokenring-ai/agent` - Agent framework for commands and state
- `@tokenring-ai/utility` - Utility functions including KeyedRegistry
- `zod` - Schema validation

**Dev Dependencies:**

- `vitest` - Testing framework
- `typescript` - TypeScript compiler

## Core Components

### AudioService

The main service class that manages audio operations and provider registry. Implements the `TokenRingService` interface.

```typescript
import AudioService from '@tokenring-ai/audio/AudioService';

const audioService = new AudioService({
  tmpDirectory: '/tmp',
  agentDefaults: {
    provider: 'linux',
    transcribe: {
      model: 'whisper-1',
      prompt: 'Convert the audio to english',
      language: 'en',
    },
    speech: {
      model: 'OpenAI:tts-1',
      voice: 'alloy',
      speed: 1.0,
    },
  },
});
```

#### Properties

| Property           | Type                                        | Description                                           |
|--------------------|---------------------------------------------|-------------------------------------------------------|
| `name`             | `string`                                    | Service name: `"AudioService"`                        |
| `description`      | `string`                                    | Service description: `"Service for Audio Operations"` |
| `options`          | `z.output<typeof AudioServiceConfigSchema>` | Service configuration options                         |

#### Methods

| Method                                                                                                      | Description                                                    |
|-------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------|
| `registerProvider(name: string, provider: AudioProvider)`                                                   | Register an audio provider (exposed from KeyedRegistry)        |
| `getAvailableProviders(): string[]`                                                                         | Get list of registered provider names                          |
| `attach(agent: Agent): void`                                                                                | Initialize audio state for an agent with default configuration |
| `requireAudioProvider(agent: Agent): AudioProvider`                                                         | Get the active audio provider for an agent (throws if none)    |
| `setActiveProvider(name: string, agent: Agent): void`                                                       | Set the active audio provider for an agent                     |
| `convertAudioToText(audioFile, { language?: string }, agent)` | Transcribe audio to text using the configured STT model        |
| `convertTextToSpeech(text: string, { voice?: string, speed?: number }, agent: Agent): Promise<AudioResult>` | Convert text to speech using the configured TTS model          |

#### AudioService Error Handling

- `requireAudioProvider()` throws `Error` if no audio provider is enabled for the agent
- Methods may throw errors from underlying AI client operations
- `convertTextToSpeech` throws if text is empty

### AudioProvider

Abstract interface for implementing audio providers. Providers must implement both recording and playback functionality.

```typescript
export interface AudioProvider {
  record(abortSignal: AbortSignal, options: RecordingOptions): Promise<RecordingResult>;
  playback(filename: string): Promise<string>;
}
```

#### RecordingOptions

```typescript
export interface RecordingOptions {
  sampleRate?: number;   // Sample rate for recording
  channels?: number;     // Number of audio channels
  format?: string;       // Audio format (e.g., 'wav', 'mp3')
  timeout?: number;      // Recording timeout in milliseconds (used in tool, not in interface)
}
```

#### RecordingResult

```typescript
export interface RecordingResult {
  filePath: string;      // Path to the recorded audio file
}
```

#### AudioResult

```typescript
export interface AudioResult {
  data: any;             // Audio data (typically Uint8Array or Buffer)
}
```

### AudioState

Manages audio configuration persistence across agent sessions. Implements `AgentStateSlice` interface.

```typescript
export class AudioState extends AgentStateSlice<typeof serializationSchema> {
  activeProvider: string | null;
  transcribe: z.output<typeof AudioTranscriptionConfigSchema>;
  speech: z.output<typeof AudioSpeechConfigSchema>;

  constructor(initialConfig: z.output<typeof AudioServiceConfigSchema>["agentDefaults"]);
  transferStateFromParent(parent: Agent): void;
  serialize(): z.output<typeof serializationSchema>;
  deserialize(data: z.output<typeof serializationSchema>): void;
  show(): string;
}
```

#### State Properties

| Property         | Type                             | Description                                  |
|------------------|----------------------------------|----------------------------------------------|
| `activeProvider` | `string \| null`                 | Currently active audio provider              |
| `transcribe`     | `AudioTranscriptionConfigSchema` | Current transcription configuration          |
| `speech`         | `AudioSpeechConfigSchema`        | Current speech configuration                 |

Note: The `AudioState` class also has an `initialConfig` property (set via constructor) that stores the initial configuration for reset operations, but it is not part of the serialized state.

#### State Methods

| Method                                         | Description                           |
|------------------------------------------------|---------------------------------------|
| `transferStateFromParent(parent: Agent): void` | Inherit state from parent agent       |
| `serialize(): SerializationSchema`             | Convert state to JSON for persistence |
| `deserialize(data: SerializationSchema): void` | Restore state from JSON               |
| `show(): string`                               | Generate displayable state summary    |

## Chat Commands

The package provides the `/audio` command suite for interactive audio operations.

### Command Overview

| Command                              | Description                                   |
|--------------------------------------|-----------------------------------------------|
| `/audio record [options]`            | Record audio from microphone (Ctrl+C to stop) |
| `/audio play <file>`                 | Play audio file through speakers              |
| `/audio speak <text> [options]`      | Convert text to speech and play               |
| `/audio transcribe <file> [options]` | Transcribe audio file to text                 |
| `/audio model tts ...`               | Manage TTS (text-to-speech) models            |
| `/audio model stt ...`               | Manage STT (speech-to-text) models            |

### Recording Command

```bash
/audio record [--format <fmt>]
```

Records audio from the microphone. Press Ctrl+C to stop recording.

**Options:**

- `--format <fmt>` - Audio format for recording

**Example:**

```bash
/audio record
/audio record --format wav
```

**Output:** `Recording saved: <filepath>`

### Play Command

```bash
/audio play <file>
```

Plays an audio file through the speakers.

**Arguments:**

- `<file>` - Path to the audio file to play

**Example:**

```bash
/audio play output.mp3
```

**Output:** `Played: <filepath>`

**Errors:** Throws `CommandFailedError` if no filename is provided.

### Speak Command

```bash
/audio speak <text> [--voice <id>] [--speed <n>]
```

Converts text to speech and plays it through the speakers.

**Arguments:**

- `<text>` - Text to convert to speech (supports remainder for multi-word text)

**Options:**

- `--voice <id>` - Voice ID to use for speech generation
- `--speed <n>` - Speech speed multiplier (numeric value)

**Example:**

```bash
/audio speak "Hello world"
/audio speak "Welcome" --voice female --speed 1.2
```

**Output:** `Speech generated: <filepath>`

### Transcribe Command

```bash
/audio transcribe <file> [--language <code>]
```

Transcribes an audio file to text.

**Arguments:**

- `<file>` - Path to the audio file to transcribe

**Options:**

- `--language <code>` - Language code for transcription (e.g., `en`, `en-US`)

**Example:**

```bash
/audio transcribe recording.wav
/audio transcribe audio.mp3 --language en-US
```

**Output:** `Transcription: <text>`

**Errors:** Throws `CommandFailedError` if no filename is provided.

### Model Management Commands

#### TTS Model Management

| Command                        | Description                       |
|--------------------------------|-----------------------------------|
| `/audio model tts get`         | Show current TTS model            |
| `/audio model tts set <model>` | Set TTS model                     |
| `/audio model tts select`      | Interactive model selection       |
| `/audio model tts reset`       | Reset to initial configured model |

**Examples:**

```bash
/audio model tts get
/audio model tts set openai/tts-1
/audio model tts select
/audio model tts reset
```

#### STT Model Management

| Command                        | Description                       |
|--------------------------------|-----------------------------------|
| `/audio model stt get`         | Show current STT model            |
| `/audio model stt set <model>` | Set STT model                     |
| `/audio model stt select`      | Interactive model selection       |
| `/audio model stt reset`       | Reset to initial configured model |

**Examples:**

```bash
/audio model stt get
/audio model stt set openai/whisper-1
/audio model stt select
/audio model stt reset
```

#### Interactive Model Selection

Both TTS and STT interactive selectors (`/audio model tts select` and `/audio model stt select`) provide:

- Models grouped by provider (OpenAI, Anthropic, etc.)
- Status indicators:
- ✅ **Online** - Ready for immediate use
- 🧊 **Cold** - May have startup delay
- 🔴 **Offline** - Currently unavailable
- Tree-based selection interface
- Provider-level summary showing online/total counts

**Example Output:**

```text
Choose a Text to Speech model:
├── OpenAI (2/3 online)
│   ├── tts-1
│   ├── tts-1-hd
│   └── custom-model (offline)
└── ElevenLabs (1/1 online)
    └── eleven_monolingual_v1
```

## Tools

The package provides the following tools for agent interactions:

### voice_record

Record audio using the active voice provider.

```typescript
{
  name: "voice_record",
  displayName: "Audio/record",
  description: "Record audio using the active voice provider",
  inputSchema: z.object({
    sampleRate: z.number().exactOptional().describe("Sample rate for recording"),
    channels: z.number().exactOptional().describe("Number of audio channels"),
    format: z.string().exactOptional().describe("Audio format"),
    timeout: z.number().exactOptional().describe("Recording timeout in milliseconds"),
  })
}
```

**Parameters:**

| Parameter    | Type     | Required | Description                           |
|--------------|----------|----------|---------------------------------------|
| `sampleRate` | `number` | No       | Sample rate for recording             |
| `channels`   | `number` | No       | Number of audio channels              |
| `format`     | `string` | No       | Audio format (e.g., 'wav', 'mp3')     |
| `timeout`    | `number` | No       | Recording timeout in milliseconds     |

**Returns:** `string` - Path to the recorded audio file

**Example:**

```typescript
const result = await agent.callTool('voice_record', {
  format: 'wav',
  timeout: 30000
});
// result = "Recorded audio to: /tmp/recording-123456.wav"
```

### voice_transcribe

Transcribe audio file to text.

```typescript
{
  name: "voice_transcribe",
  displayName: "Audio/transcribe",
  description: "Transcribe audio using the active voice provider",
  inputSchema: z.object({
    audioFile: z.any().describe("Audio file to transcribe"),
    language: z.string().describe("Language to transcribe the audio to"),
  })
}
```

**Parameters:**

| Parameter    | Type     | Required | Description                                  |
|--------------|----------|----------|----------------------------------------------|
| `audioFile`  | `any`    | Yes      | Audio file path or buffer to transcribe      |
| `language`   | `string` | Yes      | Language code for transcription (e.g., 'en') |

**Returns:** `string` - Formatted transcription results

**Example:**

```typescript
const transcription = await agent.callTool('voice_transcribe', {
  audioFile: '/path/to/recording.wav',
  language: 'en'
});
// transcription = "Transcription Results:\nHello, this is a test."
```

### voice_speak

Convert text to speech and play it.

```typescript
{
  name: "voice_speak",
  displayName: "Audio/speak",
  description: "Convert text to speech using the active voice provider",
  inputSchema: z.object({
    text: z.string().min(1).describe("Text to convert to speech"),
    speed: z.number().exactOptional().describe("Speech speed"),
  })
}
```

**Parameters:**

| Parameter | Type     | Required | Description                    |
|-----------|----------|----------|--------------------------------|
| `text`    | `string` | Yes      | Text to convert to speech      |
| `speed`   | `number` | No       | Speech speed multiplier        |

**Returns:** `string` - "Playback succeeded"

**Example:**

```typescript
const result = await agent.callTool('voice_speak', {
  text: "Hello, world!",
  speed: 1.2
});
// result = "Playback succeeded"
```

**Errors:** Throws `Error` if text is empty or not provided.

### audio_playback

Play audio file.

```typescript
{
  name: "audio_playback",
  displayName: "Audio/playback",
  description: "Play audio file using the active voice provider",
  inputSchema: z.object({
    filename: z.string().min(1).describe("Audio filename to play"),
  })
}
```

**Parameters:**

| Parameter   | Type     | Required | Description              |
|-------------|----------|----------|--------------------------|
| `filename`  | `string` | Yes      | Audio filename to play   |

**Returns:** `string` - Confirmation message with file path

**Example:**

```typescript
const result = await agent.callTool('audio_playback', {
  filename: '/path/to/audio.mp3'
});
// result = "Played audio file: /path/to/audio.mp3"
```

## Configuration Options

### Plugin Configuration

```typescript
import audioPlugin from '@tokenring-ai/audio';

const app = new TokenRingApp({
  plugins: [
    audioPlugin.withConfig({
      audio: {
        tmpDirectory: '/tmp',
        agentDefaults: {
          provider: 'linux',
          transcribe: {
            model: 'whisper-1',
            prompt: 'Convert the audio to english',
            language: 'en',
          },
          speech: {
            model: 'OpenAI:tts-1',
            voice: 'alloy',
            speed: 1.0,
          },
        },
      },
    }),
  ],
});
```

### Configuration Schemas

#### Service Configuration

```typescript
const AudioServiceConfigSchema = z.object({
  tmpDirectory: z.string().default('/tmp'),
  agentDefaults: AudioAgentDefaultsSchema,
});
```

#### Agent Defaults Configuration

```typescript
const AudioAgentDefaultsSchema = z.object({
  provider: z.string(),
  transcribe: AudioTranscriptionConfigSchema.prefault({}),
  speech: AudioSpeechConfigSchema.prefault({}),
});
```

#### Transcription Configuration

```typescript
const AudioTranscriptionConfigSchema = z.object({
  model: z.string().default('whisper-1'),
  prompt: z.string().default('Convert the audio to english'),
  language: z.string().default('en'),
});
```

#### Speech Configuration

```typescript
const AudioSpeechConfigSchema = z.object({
  model: z.string().default('OpenAI:tts-1'),
  voice: z.string().default('alloy'),
  speed: z.number().default(1.0),
});
```

**Note:** While the speech configuration includes a `voice` parameter, the `voice_speak` tool currently does not expose this parameter. The voice is determined by the current speech configuration in the agent state.

#### Agent Configuration Slice

```typescript
const AudioAgentConfigSchema = z.object({
  provider: z.string().exactOptional(),
  transcribe: AudioTranscriptionConfigSchema.exactOptional(),
  speech: AudioSpeechConfigSchema.exactOptional()
}).prefault({});
```

### Configuration Details

#### Service-Level Options

| Option          | Type                       | Default  | Description                         |
|-----------------|----------------------------|----------|-------------------------------------|
| `tmpDirectory`  | `string`                   | `/tmp`   | Directory for temporary audio files |
| `agentDefaults` | `AudioAgentDefaultsSchema` | required | Default configuration for agents    |

#### Agent Defaults

| Option       | Type                             | Default  | Description                                 |
|--------------|----------------------------------|----------|---------------------------------------------|
| `provider`   | `string`                         | required | Default audio provider name                 |
| `transcribe` | `AudioTranscriptionConfigSchema` | `{}`     | Default transcription settings (prefaulted) |
| `speech`     | `AudioSpeechConfigSchema`        | `{}`     | Default speech settings (prefaulted)        |

#### Transcription Options

| Option     | Type     | Default                        | Description                     |
|------------|----------|--------------------------------|---------------------------------|
| `model`    | `string` | `whisper-1`                    | Transcription model identifier  |
| `prompt`   | `string` | `Convert the audio to english` | Prompt for transcription        |
| `language` | `string` | `en`                           | Language code for transcription |

#### Speech Options

| Option  | Type     | Default        | Description             |
|---------|----------|----------------|-------------------------|
| `model` | `string` | `OpenAI:tts-1` | Speech generation model |
| `voice` | `string` | `alloy`        | Voice identifier        |
| `speed` | `number` | `1.0`          | Speech speed multiplier |

## State Management

### AudioState State Class

The `AudioState` class manages audio configuration persistence across agent sessions. Implements `AgentStateSlice`
interface. This section provides additional details about state management.

```typescript
export class AudioState extends AgentStateSlice<typeof serializationSchema> {
  activeProvider: string | null;
  transcribe: z.output<typeof AudioTranscriptionConfigSchema>;
  speech: z.output<typeof AudioSpeechConfigSchema>;

  constructor(initialConfig: z.output<typeof AudioServiceConfigSchema>["agentDefaults"]);
  transferStateFromParent(parent: Agent): void;
  serialize(): z.output<typeof serializationSchema>;
  deserialize(data: z.output<typeof serializationSchema>): void;
  show(): string;
}
```

The `AudioState` class stores the `initialConfig` as a constructor property for reset operations, but it is not part of the serialized state.

#### State Serialization Schema

```typescript
const serializationSchema = z.object({
  activeProvider: z.string().nullable(),
  transcribe: AudioTranscriptionConfigSchema,
  speech: AudioSpeechConfigSchema
});
```

#### State Display Format

The `show()` method returns a formatted string for UI display:

```text
Active Provider: <provider_name>
  - Transcription Model: <model_name>
  - Transcription Prompt: <prompt>
  - Transcription Language: <language>
  - Speech Model: <model_name>
  - Speech Voice: <voice>
  - Speech Speed: <speed>
```

## Integration

### TokenRing Plugin Integration

```typescript
import audioPlugin from '@tokenring-ai/audio';

app.registerPlugin(audioPlugin);
```

The plugin automatically:

1. Registers the `AudioService` with the application (if audio config is provided)
2. Registers all audio tools with the `ChatService`
3. Registers all agent commands with the `AgentCommandService`

**Note:** The plugin only installs services if the `audio` configuration is provided. If `config.audio` is undefined,
the plugin exits early without registering anything.

### Agent Integration

```typescript
// Service automatically available through agent
const audioService = agent.requireServiceByType(AudioService);

// Transcribe audio
const result = await audioService.convertAudioToText(audioFile, {
  language: 'en',
}, agent);
// result = { text: "Transcribed text" }

// Generate speech
const speech = await audioService.convertTextToSpeech('Hello world', {
  voice: 'alloy',
  speed: 1.2,
}, agent);
// speech = { data: Uint8Array [...] }

// Set active provider
audioService.setActiveProvider('linux', agent);

// Get active provider
const provider = audioService.requireAudioProvider(agent);
```

### Provider Integration

```typescript
const audioService = agent.requireServiceByType(AudioService);

// Register a custom provider
audioService.registerProvider('custom', {
  async record(signal, options) {
    // Custom recording implementation
    // signal: AbortSignal for cancellation
    // options: RecordingOptions
    return { filePath: '/path/to/recording.wav' };
  },
  async playback(filename) {
    // Custom playback implementation
    return filename;
  },
});

// Use the provider
audioService.setActiveProvider('custom', agent);
```

### Tool Registration

Tools are automatically registered when the plugin is installed:

```typescript
// Tools available after plugin installation:
// - voice_record
// - voice_transcribe
// - voice_speak
// - audio_playback
```

### Command Registration

Commands are automatically registered when the plugin is installed:

```typescript
// Commands available after plugin installation:
// - /audio record
// - /audio play
// - /audio speak
// - /audio transcribe
// - /audio model tts {get|set|select|reset}
// - /audio model stt {get|set|select|reset}
```

### Service Registration

The `AudioService` implements the `TokenRingService` interface:

```typescript
interface TokenRingService {
  readonly name: string;
  readonly description: string;

  attach(agent: Agent): void;
}
```

#### Service Attachment

When an agent is created, the `AudioService.attach()` method:

1. Merges service defaults with agent-specific configuration using `deepClone`
2. Initializes the `AudioState` for the agent
3. Sets up state persistence and restoration

```typescript
attach(agent: Agent): void {
  const agentConfig = deepMerge(
    this.options.agentDefaults,
    agent.getAgentConfigSlice('audio', AudioAgentConfigSchema)
  );
  agent.initializeState(AudioState, agentConfig);
}
```

## Exports

```typescript
// Main exports from index.ts
export {AudioServiceConfigSchema, AudioAgentConfigSchema} from "./schema.ts";
export {default as AudioService} from "./AudioService.ts";
```

## Development

### Testing

```bash
# Run tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage

# Type check
bun run build
```

### Package Structure

```text
pkg/audio/
├── index.ts                 # Main exports
├── AudioService.ts          # Main audio service implementation
├── AudioProvider.ts         # Audio provider interfaces
├── schema.ts                # Zod configuration schemas
├── plugin.ts                # TokenRing plugin for service registration
├── state/
│   └── audioState.ts        # Audio state management
├── tools.ts                 # Tool registry
├── tools/
│   ├── record.ts            # Voice recording tool
│   ├── transcribe.ts        # Audio transcription tool
│   ├── speak.ts             # Text-to-speech tool
│   └── playback.ts          # Audio playback tool
├── commands.ts              # Command registry
├── commands/
│   └── audio/
│       ├── record.ts        # /audio record command
│       ├── play.ts          # /audio play command
│       ├── speak.ts         # /audio speak command
│       ├── transcribe.ts    # /audio transcribe command
│       └── model/
│           ├── tts/
│           │   ├── get.ts   # TTS model get command
│           │   ├── set.ts   # TTS model set command
│           │   ├── select.ts # TTS model select command
│           │   └── reset.ts # TTS model reset command
│           └── stt/
│               ├── get.ts   # STT model get command
│               ├── set.ts   # STT model set command
│               ├── select.ts # STT model select command
│               └── reset.ts # STT model reset command
├── package.json             # Package manifest
├── vitest.config.ts         # Vitest configuration
└── README.md                # This file
```

### Contribution Guidelines

- Follow established coding patterns
- Add unit tests for new functionality using vitest
- Update documentation for new features
- Ensure all changes work with TokenRing agent framework
- Test with both headless and interactive modes
- Use TypeScript with strict type checking
- Use bun as the runtime for examples and tests

## Best Practices

### Provider Selection

- Register providers that match your deployment environment
- Use the `linux` provider for Linux-based deployments (via `@tokenring-ai/linux-audio`)
- Implement custom providers for specialized hardware or services
- Always set a default provider in `agentDefaults.provider`

### Model Management

- Set appropriate default models in configuration
- Use interactive selection for runtime flexibility
- Monitor model availability status when selecting models
- Reset models to defaults when configuration changes

### Error Handling

- Always check if a provider is registered before operations
- Handle `CommandFailedError` for command operations
- Implement timeout for recording operations
- Check for empty text before speech generation

### State Persistence

- Audio state is automatically persisted across sessions
- Use `show()` method to display current state
- Reset models to defaults when needed
- Ensure `activeProvider` is set before audio operations

### Configuration

- Provide complete `agentDefaults` configuration
- Set `tmpDirectory` to a writable location
- Configure providers before setting as active
- Use prefaulted schemas for optional configurations

## Related Packages

- `@tokenring-ai/linux-audio` - Linux-specific audio provider implementation
- `@tokenring-ai/ai-client` - AI client with transcription and speech models
- `@tokenring-ai/agent` - Agent framework for state management
- `@tokenring-ai/chat` - Chat service for tool registration

## License

MIT License - see [LICENSE](./LICENSE) file for details.
