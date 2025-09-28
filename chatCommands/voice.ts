import Agent from "@tokenring-ai/agent/Agent";
import {parseArgs} from "node:util";
import AudioService from "../AudioService.js";

export const description = "/voice [action] - Voice operations";

export function help(): Array<string> {
  return [
    "/voice [action] <text/filename> [options] - Voice operations",
    "  Actions:",
    "    record          - Record audio from microphone",
    "    transcribe <file> - Transcribe audio file",
    "    speak <text>    - Convert text to speech",
    "    playback <file> - Play audio file",
    "    provider [name] - Show/set active provider",
    "",
    "  Options:",
    "    --model <name>     - Model to use",
    "    --voice <id>       - Voice ID",
    "    --speed <n>        - Speech speed",
    "    --format <fmt>     - Audio format",
    "    --language <code>  - Language code",
    "",
    "  Examples:",
    "    /voice record",
    "    /voice transcribe recording.wav",
    "    /voice speak \"Hello world\"",
    "    /voice playback output.mp3",
    "    /voice provider openai",
  ];
}

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
  const { values, positionals } = parseArgs({
    args,
    options: {
      model: { type: 'string' },
      voice: { type: 'string' },
      speed: { type: 'string' },
      format: { type: 'string' },
      language: { type: 'string' }
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

  return { flags, rest: positionals };
}

export async function execute(remainder: string, agent: Agent): Promise<void> {
  
  const voiceService = agent.requireServiceByType(AudioService);

  const [sub, ...rest] = remainder.trim().split(/\s+/);
  if (!sub) {
    help().forEach((l) => agent.infoLine(l));
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