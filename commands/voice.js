import ChatService from "@token-ring/chat/ChatService";
import RecordingService from "../RecordingService.js";
import REPLService from "@token-ring/cli/REPLService.js";
import fs from "node:fs";


  export const description = "Records audio from your microphone and transcribes it to text";

  export async function execute(remainder, registry) {
    const chatService = registry.requireFirstServiceByType(ChatService);
    const recordingService = registry.requireFirstServiceByType(RecordingService);
    const speechToTextService = this.owner;

    try {
      // Inform the user that recording is starting
      chatService.systemLine("Recording from microphone. Speak now and press Ctrl+C to stop...");

      // Wait for user to press Ctrl+C or some other method to stop recording
      const abortSignal = chatService.getAbortSignal();

      const filePath = await recordingService.record(abortSignal);
      const audioBuffer = fs.readFileSync(filePath);
      
      chatService.systemLine("Transcribing audio...");

      // Transcribe the audio
      const transcriptionResult = await speechToTextService.transcribe(audioBuffer);
      const transcribedText = transcriptionResult.text;

      fs.unlinkSync(filePath);

      if (!transcribedText || transcribedText.trim() === '') {
        chatService.systemLine("No speech detected in the recording.");
        return;
      }

      chatService.systemLine("Transcription complete, adding to multiline input.");

      // Start multiline mode in the REPL with the transcribed text
      await handleTranscriptionInRepl(registry, transcribedText);
    } catch (error) {
      chatService.errorLine(`Voice command error: ${error.message}`);
    }
  }

export function help() {
 return [
  "Records audio from your microphone and transcribes it to text",
  "Usage: /voice",
  "Speak into your microphone and press Ctrl+C to stop recording"
 ]
}


// This function needs to be implemented in REPLService to handle setting up multiline input
async function handleTranscriptionInRepl(registry, transcribedText) {
 const replService = registry.requireFirstServiceByType(REPLService);

 const buffer = [];
 // Add the voice transcript as initial content if provided
 buffer.push('/* The user just spoke the following text, follow their instructions: */');

 buffer.push(...transcribedText.split('\n'));

 replService.startNewMultiLineInput(buffer, "--- VOICE TRANSCRIPT ADDED: Continue typing or edit transcript (finish by typing :end on a line by itself) ---");

}