import {Agent} from "@tokenring-ai/agent";
import {CommandFailedError} from "@tokenring-ai/agent/AgentError";
import fs from "node:fs";
import {parseArgs} from "node:util";
import path from "path";
import AudioService from "../../AudioService.js";

export default async function speak(remainder: string, agent: Agent): Promise<string> {
  const audioService = agent.requireServiceByType(AudioService);
  
  const {values, positionals} = parseArgs({
    args: remainder.trim().split(/\s+/).filter(Boolean),
    options: {
      voice: {type: 'string'},
      speed: {type: 'string'}
    },
    allowPositionals: true,
    strict: false
  });

  const query = positionals.join(" ");
  if (!query) {
    throw new CommandFailedError("Usage: /audio speak <text> [flags]");
  }

  const result = await audioService.convertTextToSpeech(query, {
    voice: values.voice as string,
    speed: values.speed ? Number(values.speed) : undefined
  }, agent);


  const tmpFile = path.join(audioService.options.tmpDirectory, `speech-${Date.now()}.mp3`);
  fs.writeFileSync(tmpFile, result.data);

  await audioService.requireAudioProvider(agent).playback(tmpFile);
  
  return `Speech generated: ${tmpFile}`;
}
