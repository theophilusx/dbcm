"use strict";

const VError = require("verror");
const inquirer = require("inquirer");
const moment = require("moment");
const path = require("path");
const fse = require("fse");

async function createNote(state, plan, title="Note", prompt="Enter note") {
  const logName = "createNote";

  try {
    let question = {
      type: "editor",
      name: "note",
      message: `${prompt} (you can use markdown syntax)`
    };
    let answer = await inquirer.prompt(question);
    if (answer.note.length) {
      let content = `\n## ${title}

+ ${moment().format("YYYY-MM-DD HH:mm:ss")}
+ ${state.username()} <${state.email()}>

${answer.note}
`;
      let docFile = path.join(
        state.home(),
        state.currentRepositoryName(),
        plan.doc
      );
      await fse.appendFile(docFile, content, {encoding: "utf-8"});
    }
    return state;
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
}

module.exports = createNote;
