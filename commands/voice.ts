import Agent from "@tokenring-ai/agent/Agent";
import {TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import {parseArgs} from "node:util";
import AudioService from "../AudioService.js";

const description = "/voice - Voice operations";

const help: string = `# /voice - Voice operations

## Available Actions

### record
Record audio from microphone
- Records audio and saves to file
- Press Ctrl+C to stop recording

### transcribe <file>
Transcribe audio file to text
- Supports various audio formats
- Uses speech-to-text conversion

### speak <text>
Convert text to speech
- Generate audio from text input
- Supports multiple voices and languages

### playback <file>
Play audio file
- Play audio files through system speakers
- Supports common audio formats

### provider [name]
Show or set active audio provider
- View available providers: \`/voice provider\`
- Set provider: \`/voice provider <name>\`

## Options (Flags)

- **--model <name>** - Specify AI model for processing (e.g., whisper, gpt-4, custom-model)
- **--voice <id>** - Voice ID for text-to-speech (available voices depend on provider)
- **--speed <n>** - Speech speed multiplier (1.0 = normal, 0.5 = half, 2.0 = double)
- **--format <fmt>** - Audio output format (mp3, wav, ogg, aac)
- **--language <code>** - Language code for transcription (e.g., en-US, es-ES, fr-FR, de-DE)

## Usage Examples

# Basic recording
/voice record

# Transcribe audio file
/voice transcribe recording.wav
/voice transcribe audio.mp3 --language en-US

# Convert text to speech
/voice speak "Hello, how are you today?"
/voice speak "Welcome to our system" --voice female --speed 1.2

# Play audio file
/voice playback output.mp3
/voice playback notification.wav --format wav

# Manage providers
/voice provider                    # Show current and available providers
/voice provider openai            # Set OpenAI as active provider
/voice provider azure             # Set Azure as active provider

## Common Use Cases

- Meeting recordings: \`/voice transcribe meeting.wav --language en-US\`
- Voice messages: \`/voice speak "Your message here" --voice male\`
- Audio notes: \`/voice record\`, then \`/voice transcribe notes.wav\`
- Content creation: \`/voice speak "Article content" --format mp3\`

## Tips

- Use short, clear text for best speech synthesis results
- Ensure audio files are in supported formats for transcription
- Check available providers and voices with \`/voice provider\`
- Experiment with different speeds for natural-sounding speech
- Use appropriate language codes for accurate transcription`;

interface VoiceArgs {
  flags: {
    model?: string;
    voice?: string;
    speed?: number;
    format?: string;
    language?: string;
  }
  rest: string[];
}

function parseVoiceArgs(args: string[]): VoiceArgs {
  const {values, positionals} = parseArgs({
    args,
    options: {
      model: {type: 'string'},
      voice: {type: 'string'},
      speed: {type: 'string'},
      format: {type: 'string'},
      language: {type: 'string'}
    },
    allowPositionals: true,
    strict: false
  });

  const flags: VoiceArgs["flags"] = {};

  if (values.model) flags.model = values.model as string;
  if (values.voice) flags.voice = values.voice as string;
  if (values.speed) flags.speed = Number(values.speed);
  if (values.format) flags.format = values.format as string;
  if (values.language) flags.language = values.language as string;

  return {flags, rest: positionals};
}

async function execute(remainder: string, agent: Agent): Promise<void> {

  const voiceService = agent.requireServiceByType(AudioService);

  const [sub, ...rest] = remainder.trim().split(/\s+/);
  if (!sub) {
    agent.chatOutput(help);
    return;
  }

  const {flags, rest: queryParts} = parseVoiceArgs(rest);
  const query = queryParts.join(" ");

  if (sub === "record") {
    const abortController = new AbortController();
    agent.infoLine("Recording... Press Ctrl+C to stop");

    const result = await voiceService.record(abortController.signal, {
      format: flags.format
    });
    agent.infoLine(`Recording saved: ${result.filePath}`);
  } else if (sub === "transcribe") {
    if (!query) {
      agent.errorLine("Usage: /voice transcribe <filename> [flags]");
      return;
    }
    const result = await voiceService.transcribe(query, {
      model: flags.model,
      language: flags.language
    });
    agent.infoLine(`Transcription: ${result.text}`);
  } else if (sub === "speak") {
    if (!query) {
      agent.errorLine("Usage: /voice speak <text> [flags]");
      return;
    }
    const result = await voiceService.speak(query, {
      model: flags.model,
      voice: flags.voice,
      speed: flags.speed,
      format: flags.format
    });
    agent.infoLine(`Speech generated: ${JSON.stringify(result.data).slice(0, 100)}...`);
  } else if (sub === "playback") {
    if (!query) {
      agent.errorLine("Usage: /voice playback <filename> [flags]");
      return;
    }
    const result = await voiceService.playback(query);
    agent.infoLine(`Played: ${result}`);
  } else if (sub === "provider") {
    if (query) {
      const available = voiceService.getAvailableProviders();
      if (available.includes(query)) {
        voiceService.setActiveProvider(query);
        agent.infoLine(`Provider set to: ${query}`);
      } else {
        agent.errorLine(`Provider '${query}' not available. Available: ${available.join(", ")}`);
      }
    } else {
      const active = voiceService.getActiveProvider();
      const available = voiceService.getAvailableProviders();
      agent.infoLine(`Active provider: ${active || "none"}`);
      agent.infoLine(`Available providers: ${available.join(", ")}`);
    }
  } else {
    agent.infoLine("Unknown action. Use: record, transcribe, speak, playback, provider");
  }
}
export default {
  description,
  execute,
  help,
} as TokenRingAgentCommand