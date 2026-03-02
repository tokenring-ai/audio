import audioModelSttGet from './commands/audio/model/stt/get.js';
import audioModelSttReset from './commands/audio/model/stt/reset.js';
import audioModelSttSelect from './commands/audio/model/stt/select.js';
import audioModelSttSet from './commands/audio/model/stt/set.js';
import audioModelTtsGet from './commands/audio/model/tts/get.js';
import audioModelTtsReset from './commands/audio/model/tts/reset.js';
import audioModelTtsSelect from './commands/audio/model/tts/select.js';
import audioModelTtsSet from './commands/audio/model/tts/set.js';
import play from './commands/audio/play.js';
import record from './commands/audio/record.js';
import speak from './commands/audio/speak.js';
import transcribe from './commands/audio/transcribe.js';

export default [record, play, speak, transcribe, audioModelTtsGet, audioModelTtsSet, audioModelTtsSelect, audioModelTtsReset, audioModelSttGet, audioModelSttSet, audioModelSttSelect, audioModelSttReset];
