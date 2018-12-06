"use strict";

const moduleName = "targetUI";

const VError = require("verror");
const inquirer = require("inquirer");
const targets = require("./targets");
const queries = require("./database");

function setup(state) {
  const logName = `${moduleName}.setup`;

  try {
    let choices = [];
    let targetMap = state.currentRepositoryTargets();
    for (let target of targetMap.keys()) {
      choices.push(target);
    }
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

function selectTarget(state) {
  const logName = `${moduleName}.selectTarget`;
  const questions = setup(state);
  
  return inquirer.prompt(questions)
    .then(answers => {
      state.setMenuChoice(answers.choice);
      if (answers.choice === "exitMenu") {
        return state;
      } else if (answers.choice === "newTarget") {
        let targetMap = state.currentRepositoryTargets();
        let params = {
          database: answers.database,
          host: answers.host,
          port: answers.port,
          user: answers.user,
          password: answers.password
        };
        targetMap.set(answers.targetName, params);
        state.setCurrentRepositoryTargets(targetMap);
        state.setCurrentTarget(answers.targetName);
        return state.writeConfigFile()
          .then(() => {
            let params = state.currentTargetDef();
            return targets.isInitialised(params.database, params.user, params.password);
          })
          .then(initState => {
            if (!initState) {
              console.log(`Target database ${state.currentTarget} needs to be initialised for DBCM`);
              console.log("Please either run the shell script in bin/dbcm-init.sh");
              console.log("or execute the SQL script in sql/dbcm-init.sql in the target database");
              console.log("Note that if you use the SQL script, you also need to add the dbcm_user role");
              console.log("to the user you will be connecting with to apply database changes");
            }
            return state;
          });
      } else {
        state.setCurrentTarget(answers.choice);
        let params = state.currentTargetDef();
        return targets.isInitialised(params.database, params.user, params.password)
          .then(initState => {
            if (!initState) {
              console.log(`Target database ${state.currentTarget} needs to be initialised for DBCM`);
              console.log("Please either run the shell script in bin/dbcm-init.sh");
              console.log("or execute the SQL script in sql/dbcm-init.sql in the target database");
              console.log("Note that if you use the SQL script, you also need to add the dbcm_user role");
              console.log("to the user you will be connecting with to apply database changes");
            }
            return state;
          });
      }
    })
    .catch(err => {
      throw new VError(err, `${logName} Failed to select target`);
    });
}

async function listAppliedChanges(state) {
  const logName = `${moduleName}.listAppliedChanges`;

  try {
    let changes = await queries.getAppliedChanges(state);
    if (changes.length) {
      for (let c of changes) {
        console.log(`${c.set_name} ${c.applied_dt} ${c.status}`);
      }
    } else {
      console.log("No applied changes");
    }
    return state;
  } catch (err) {
    throw new VError(err, `${logName} Failed to get applied changes`);
  }
}
module.exports = {
  selectTarget,
  listAppliedChanges
};

