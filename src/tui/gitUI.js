"use strict";

const moduleName = "gitUI";

const VError = require("verror");
const inquirer = require("inquirer");
const screen = require("./textScreen");
const Table = require("cli-table3");
const chalk = require("chalk");

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
    let files = await state.currentRepositoryDef().getStatus();
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
      let changeStrings = await state.currentRepositoryDef().getStatusString();
      screen.infoMsg(
        `Changed File Status - ${files.length} file(s)`,
        changeStrings.join("\n")
      );
      let answer = await inquirer.prompt(questions);
      if (answer.choice) {
        await state.currentRepositoryDef().commit(
          files,
          "Commit WIP",
          state.username(),
          state.email()
        );
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
        {"Date": `${commit.date()}`},
        {"Message": commit.message()}
      );
      console.log(table.toString());
    });
  } catch (err) {
    throw new VError(err, `${logName} `);
  }
}

async function displayDiff(diffList) {
  const logName = `${moduleName}.displayDiff`;

  try {
    for (let diff of diffList) {
      let patches = await diff.patches();
      for (let patch of patches) {
        let hunks = await patch.hunks();
        for (let hunk of hunks) {
          let title = `DIFF: ${patch.oldFile().path()} ${patch.newFile().path()}`;
          let data = `${hunk.header().trim()}\n`;
          let lines = await hunk.lines();
          for (let line of lines) {
            if (String.fromCharCode(line.origin()) === "-") {
              data += chalk.red(`- ${line.content().trim()}\n`);
            } else if (String.fromCharCode(line.origin()) === "+") {
              data += chalk.green(`+ ${line.content().trim()}\n`);
            } else {
              data += chalk.white(`= ${line.content().trim()}\n`);
            }
          }
          screen.infoMsg(title, data);
        }
      }
    }
    return diffList;
  } catch (err) {
    throw new VError(err, `${logName} `);
  }
}

module.exports = {
  commitChanges,
  displayCommitHistory,
  displayDiff
};
