"use strict";

const moduleName = "gitUI";

const VError = require("verror");
const inquirer = require("inquirer");
const git = require("./git");

function getConflictedChange(fileList) {
  let conflictFiles = fileList.map(f => f.isConflicted());
  if (conflictFiles.length) {
    return conflictFiles.map(f => f.path());
  }
  return [];
}

async function commitChanges(state) {
  const logName = `${moduleName}.commitChanges`;

  try {
    let repo = state.get("repoObject");
    let files = await repo.getStatus();
    if (files.length) {
      let conflicts = getConflictedChange(files);
      if (conflicts.length) {
        screen.warningMsg(
          "Resolve Conflicts",
          "The following files have conflicting changes which must be resolved manually\n"
            + conflicts.join("\n")
        );
        return false;
      }
      let changeStrings = files.map(f => git.statusString(f));
      console.log(`Changed File Status - ${files.length} file(s)\n`);
      for (let c of changeStrings) {
        console.log(c);
      }
      console.log("");
      let answer = await inquirer.prompt([
        {
          type: "confirm",
          name: "choice",
          message: "Commit these changes:"
        },
        {
          type: "input",
          name: "msg",
          message: "Commit message:",
          when: answer => {
            return answer.choice;
          }
        }
      ]);
      if (answer.choice) {
        await git.addAndCommit(state, files, answer.msg);
        return true;
      }
      return false;
    }
    return true;
  } catch (err) {
    throw new VError(err, `${logName} Failed to ask and commit changes`);
  }
}

module.exports = {
  commitChanges
};
