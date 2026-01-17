import createSubcommandRouter from "@tokenring-ai/agent/util/subcommandRouter";
import defaultCmd from "./tts/default.js";
import get from "./tts/get.js";
import reset from "./tts/reset.js";
import select from "./tts/select.js";
import set from "./tts/set.js";

export default createSubcommandRouter({
  default: defaultCmd,
  get,
  set,
  reset,
  select
});
