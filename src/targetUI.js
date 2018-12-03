"use strict";

const moduleName = "targetUI";

const VError = require("verror");
const inquirer = require("inquirer");
const state = require("./state");
const targets = require("./targets");

function setup(appState) {
  const logName = `${moduleName}.setup`;

  try {
    let choices = [];
    let targetMap = state.getRepositoryTargets(appState, appState.get("currentRepository"));
    for (let target of targetMap.keys()) {
      choices.push(target);
    }
    choices.push(new inquirer.Separator());
    choices.push("Add new target");
    choices.push("Quit DBCM");

    const questions = [
      {
        type: "list",
        name: "target",
        message: "Which DB target:",
        choices: choices
      },
      {
        type: "input",
        name: "targetName",
        message: "Target name:",
        when: answers => {
          return answers.target === "Add new target";
        }
      },
      {
        type: "input",
        name: "database",
        message: "Target database name:",
        when: answers => {
          return answers.target === "Add new target";
        }
      },
      {
        type: "input",
        name: "host",
        message: "Target database host:",
        when: answers => {
          return answers.target === "Add new target";
        }
      },
      {
        type: "input",
        name: "port",
        message: "Target database port:",
        default: 5432,
        when: answers => {
          return answers.target === "Add new target";
        }
      },
      {
        type: "input",
        name: "user",
        message: "Target database user:",
        when: answers => {
          return answers.target === "Add new target";
        }
      },
      {
        type: "input",
        name: "password",
        message: "Target database password:",
        when: answers => {
          return answers.target === "Add new target";
        }
      }];
    return questions;
  } catch (err) {
    throw new VError(err, `${logName} Failed to setup target questions`);
  }
}

function selectTarget(appState) {
  const logName = `${moduleName}.selectTarget`;
  const questions = setup(appState);
  let quit = false;
  
  return inquirer.prompt(questions)
    .then(answers => {
      if (answers.target === "Quit DBCM") {
        quit = true;
      } else if (answers.target === "Add new target") {
        let targetMap = appState.get("repositories").get(appState.get("currentRepository")).targets;
        let params = {
          database: answers.database,
          host: answers.host,
          port: answers.port,
          user: answers.user,
          password: answers.password
        };
        targetMap.set(answers.targetName, params);
        appState.get("repositories").get(appState.get("currentRepository")).targets = targetMap;
        appState.set("currentTarget", answers.targetName);
        return state.writeConfig(appState);
      } else {
        appState.set("currentTarget", answers.target);
      }
      return appState;
    })
    .then(() => {
      let params = state.getTargetDefinition(appState, appState.get("currentRepository"), appState.get("currentTarget"));
      return targets.isInitialised(params.database, params.user, params.password);
    })
    .then(initState => {
      if (!initState) {
        console.log(`Target database ${appState.get("currentTarget")} needs to be initialised for DBCM`);
        console.log("Please either run the shell script in bin/dbcm-init.sh");
        console.log("or execute the SQL script in sql/dbcm-init.sql in the target database");
        console.log("Note that if you use the SQL script, you also need to add the dbcm_user role");
        console.log("to the user you will be connecting with to apply database changes");
      } else {
        console.log("Target database is already initialised for DBCM");
      }
      return [appState, quit];
    })
    .catch(err => {
      throw new VError(err, `${logName} Failed to select target`);
    });
}

module.exports = {
  selectTarget  
};

