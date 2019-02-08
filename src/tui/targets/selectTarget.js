"use strict";

const VError = require("verror");
const inquirer = require("inquirer");
const Target = require("../../Target");
const menu = require("../utils/textMenus");
const screen = require("../utils/textScreen");

function initWarning(state) {
  screen.warningMsg("Warning!", `
Target database ${state.currentTargetName()} needs to be initialised for DBCM
Please either run the shell script in bin/dbcm-init.sh
or execute the SQL script in

sql/dbcm-init.sql

in the target database.

Note that if you use the SQL script, you also need to add
the dbcm_user role to the user you will be applying
database changes with
`);
}

function setupQuestions(state) {
  const logName = "setupQuestions";

  try {
    let choices = state.currentRepositoryDef().targetNames();
    choices.push(new inquirer.Separator());
    choices.push({
      name: "Add New DB Target",
      value: "newTarget"
    });
    choices.push({
      name: "Exit Menu",
      value: "exitMenu"
    });

    const questions = [
      {
        type: "list",
        name: "choice",
        message: "Select DB target:",
        choices: choices
      },
      {
        type: "input",
        name: "targetName",
        message: "Target name:",
        when: answers => {
          return answers.choice === "newTarget";
        }
      },
      {
        type: "input",
        name: "database",
        message: "Target database name:",
        when: answers => {
          return answers.choice === "newTarget";
        }
      },
      {
        type: "input",
        name: "host",
        message: "Target database host:",
        when: answers => {
          return answers.choice === "newTarget";
        }
      },
      {
        type: "input",
        name: "port",
        message: "Target database port:",
        default: 5432,
        when: answers => {
          return answers.choice === "newTarget";
        }
      },
      {
        type: "input",
        name: "user",
        message: "Target database user:",
        when: answers => {
          return answers.choice === "newTarget";
        }
      },
      {
        type: "input",
        name: "password",
        message: "Target database password:",
        when: answers => {
          return answers.choice === "newTarget";
        }
      }];
    return questions;
  } catch (err) {
    throw new VError(err, `${logName} Failed to setup target questions`);
  }
}

function targetActions(state) {
  const logName = "targetActions";

  return async answers => {
    try {
      state.setMenuChoice(answers.choice);
      if (menu.doExit(answers.choice)) {
        return state;
      } else if (answers.choice === "newTarget") {
        let target = new Target(
          answers.targetName,
          answers.database,
          answers.user,
          answers.password,
          answers.host,
          answers.port
        );
        state.addCurrentRepositoryTarget(target);
        state.setCurrentTargetName(answers.targetName);
        await state.writeUserInit();
      } else {
        state.setCurrentTargetName(answers.choice);
      }
      let target = state.currentTargetDef();
      let initState = await target.isInitialised();
      if (!initState) {
        initWarning(state);
      }
      return state;
    } catch (err) {
      throw new VError(err, `${logName}`);
    }
  };
}

async function selectTarget(state) {
  const logName = "selectTarget";
  const questions = setupQuestions(state);
  
  try {
    state = await menu.genericMenu(
      state,
      "DB Target Menu",
      questions,
      targetActions
    );
    return state;
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
}

module.exports = selectTarget;
