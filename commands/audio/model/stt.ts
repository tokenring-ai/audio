import createSubcommandRouter from "@tokenring-ai/agent/util/subcommandRouter";
import defaultCmd from "./stt/default.js";
import get from "./stt/get.js";
import set from "./stt/set.js";
import reset from "./stt/reset.js";
import select from "./stt/select.js";

export default createSubcommandRouter({
  default: defaultCmd,
  get,
  set,
  reset,
  select
});
