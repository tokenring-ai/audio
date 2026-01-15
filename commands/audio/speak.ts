import {Agent} from "@tokenring-ai/agent";
import fs from "node:fs";
import {parseArgs} from "node:util";
import path from "path";
import AudioService from "../../AudioService.js";

export default async function speak(remainder: string, agent: Agent): Promise<void> {
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
    agent.errorMessage("Usage: /audio speak <text> [flags]");
    return;
  }

  const result = await audioService.convertTextToSpeech(query, {
    voice: values.voice as string,
    speed: values.speed ? Number(values.speed) : undefined
  }, agent);


  const tmpFile = path.join(audioService.options.tmpDirectory, `speech-${Date.now()}.mp3`);
  fs.writeFileSync(tmpFile, result.data);

  await audioService.requireAudioProvider(agent).playback(tmpFile);
  
  agent.infoMessage(`Speech generated: ${tmpFile}`);
}
