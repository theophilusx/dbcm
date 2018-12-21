"use strict";

const moduleName = "gitUI";

const VError = require("verror");
const inquirer = require("inquirer");
const git = require("./git");
const screen = require("./textScreen");
const Table = require("cli-table3");

function getConflictedChange(fileList) {
  const logName = `${moduleName}.getConflicedChange`;

  try {
    let conflictFiles = fileList.filter(f => f.isConflicted());
    if (conflictFiles.length) {
      return conflictFiles.map(f => f.path());
    }
    return [];
  } catch (err) {
    throw new VError(err, `${logName} `);
  }
}

async function commitChanges(state) {
  const logName = `${moduleName}.commitChanges`;
  const questions = [{
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
  }];
  
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
      screen.infoMsg(
        `Changed File Status - ${files.length} file(s)`,
        changeStrings.join("\n")
      );
      let answer = await inquirer.prompt(questions);
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

function displayCommitHistory(history) {
  const logName = `${moduleName}.displayCommitHistory`;

  try {
    
    history.forEach(entry => {
      let table = new Table();
      let commit = entry.commit;
      table.push(
        {"Commit": commit.sha()},
        {"Author": `${commit.author().name()} <${commit.author().email()}}>`},
        {"Date": commit.date()},
        {"Message": commit.message()}
      );
      console.log(table.toString());
    });
  } catch (err) {
    throw new VError(err, `${logName} `);
  }
}

module.exports = {
  commitChanges,
  displayCommitHistory
};
