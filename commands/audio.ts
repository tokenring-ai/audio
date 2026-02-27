import {TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import createSubcommandRouter from "@tokenring-ai/agent/util/subcommandRouter";
import model from "./audio/model.js";
import play from "./audio/play.js";
import record from "./audio/record.js";
import speak from "./audio/speak.js";
import transcribe from "./audio/transcribe.js";

const description = "/audio - Audio operations";

const help: string = `# /audio - Audio operations

## Available Commands

### /audio record [options]
Record audio from microphone
- Press Ctrl+C to stop recording
- Options: --format <fmt>

### /audio play <file> [options]
Play audio file through speakers

### /audio speak <text> [options]
Convert text to speech
- Options: --model <name>, --voice <id>, --speed <n>, --format <fmt>

### /audio transcribe <file> [options]
Transcribe audio file to text
- Options: --model <name>, --language <code>

### /audio model {tts|stt} {default|get|set|reset|select}
Manage TTS (text-to-speech) and STT (speech-to-text) models

## Model Management Examples

/audio model tts                    # Show current TTS model and open selector
/audio model tts get                # Show current TTS model
/audio model tts set openai/tts-1   # Set TTS model
/audio model tts select             # Interactive model selection
/audio model tts reset              # Reset to initial configured model

/audio model stt                    # Show current STT model and open selector
/audio model stt get                # Show current STT model
/audio model stt set openai/whisper-1  # Set STT model
/audio model stt select             # Interactive model selection
/audio model stt reset              # Reset to initial configured model

## Interactive Mode

- Models are grouped by provider (OpenAI, Anthropic, etc.)
- Status indicators show availability:
  - ✅ Online - Ready for immediate use
  - 🧊 Cold - May have startup delay
  - 🔴 Offline - Currently unavailable

## Usage Examples

# Recording
/audio record
/audio record --format wav

# Playback
/audio play output.mp3

# Text-to-speech
/audio speak "Hello world"
/audio speak "Welcome" --voice female --speed 1.2

# Transcription
/audio transcribe recording.wav
/audio transcribe audio.mp3 --language en-US`;

const execute = createSubcommandRouter({
  record,
  play,
  speak,
  transcribe,
  model
});

export default {
  name: "audio",
  description,
  execute,
  help,
} satisfies TokenRingAgentCommand;
