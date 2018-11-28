"use strict";

const moduleName = "utils";

const VError = require("verror");
const {spawnSync} = require("child_process");

function which(program) {
  const logName = `${moduleName}.which`;
  
  try {
    let result = spawnSync("which", [program], {encoding: "utf-8"});
    return result.stdout.trim();
  } catch (err) {
    throw new VError(err, `${logName} Failed search for ${program}`);
  }
}

module.exports = {
  which
};
