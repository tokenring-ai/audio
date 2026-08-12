import generate from "./commands/audio/generate.ts";
import audioModelSttGet from "./commands/audio/model/stt/get.ts";
import audioModelSttReset from "./commands/audio/model/stt/reset.ts";
import audioModelSttSelect from "./commands/audio/model/stt/select.ts";
import audioModelSttSet from "./commands/audio/model/stt/set.ts";
import audioModelTtsGet from "./commands/audio/model/tts/get.ts";
import audioModelTtsReset from "./commands/audio/model/tts/reset.ts";
import audioModelTtsSelect from "./commands/audio/model/tts/select.ts";
import audioModelTtsSet from "./commands/audio/model/tts/set.ts";
import reindex from "./commands/audio/reindex.ts";
import transcribe from "./commands/audio/transcribe.ts";

export default [
  generate,
  transcribe,
  reindex,
  audioModelTtsGet,
  audioModelTtsSet,
  audioModelTtsSelect,
  audioModelTtsReset,
  audioModelSttGet,
  audioModelSttSet,
  audioModelSttSelect,
  audioModelSttReset,
];
