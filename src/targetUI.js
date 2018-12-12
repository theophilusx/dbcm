"use strict";

const moduleName = "targetUI";

const VError = require("verror");
const inquirer = require("inquirer");
const targets = require("./targets");
const queries = require("./database");
const moment = require("moment");
const screen = require("./textScreen");
const plans = require("./plans");
const psql = require("./psql");
const menu = require("./textMenus");

function initWarning(state) {
  screen.warningMsg("Warning!", `
Target database ${state.currentTarget()} needs to be initialised for DBCM
Please either run the shell script in bin/dbcm-init.sh or execute the SQL
script in sql/dbcm-init.sql in the target database.

Note that if you use the SQL script, you also need to add the dbcm_user role
to the user you will be applying database changes with
`);
}

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
        return state.writeConfigFile();
      } else {
        state.setCurrentTarget(answers.choice);
        return state;
      }
    })
    .then(() => {
      let params = state.currentTargetDef();
      return targets.isInitialised(params);
    })
    .then(initState => {
      if (!initState) {
        initWarning(state);
      }
      return state;
    })
    .catch(err => {
      throw new VError(err, `${logName} Failed to select target`);
    });
}

async function listTargetState(state) {
  const logName = `${moduleName}.listTargetState`;

  function formatLine(r) {
    return `${moment(r.applied_dt).format("YYYY-MM-DD HH:mm")} | ${r.plan_name} (${r.plan_id}) `
      + `${r.applied_by} ${r.status}`;
  }
  
  try {
    screen.heading("Change State");
    let targetState = await queries.getTargetState(state);
    if (targetState.length) {
      for (let t of targetState) {
        console.log(formatLine(t));
      }
    } else {
      console.log("No applied changes");
    }
    return state;
  } catch (err) {
    throw new VError(err, `${logName} Failed to get applied changes`);
  }
}

function rollbackActions(state) {
  const logName = `${moduleName}.rollbackActions`;
  
  return async answer => {
    try {
      state.setMenuChoice(answer.choice);
      if (menu.doExit(answer.choice)) {
        return state;
      }
      let [sequence, pId] = answer.choice.split(":");
      if (sequence > 0) {
        screen.warningMsg(
          "Multiple Rollbacks",
          "The plan you ahve selected was not the most recent plan applied to this target\n"
            + "If you decide to continue, all change plans applied following the plan you selected\n"
            + "will be rolled back. \n"
            + `A total of ${sequence + 1} plans will be rolled back`
        );
        let doIt = menu.displayConfirmMenu("Apply Multiple Rollbacks", `Rollback ${sequence + 1} plans:`);
        if (doIt) {
          let planList = queries.getRollbackSets(state.currentTargetDef(), pId);
          let planDefs = planList.map(id => plans.findPlan(state, id));
          console.log("Will rollback these plans");
          console.dir(planDefs);
        }
      } else {
        console.log(`Roll back plan ${pId}`);
        let planInfo = plans.findPlan(state, pId);
        if (planInfo.length) {
          psql.rollbackPlan(state, planInfo[1], planInfo[0]);
        } else {
          screen.errorMsg("No Plan Definition", `Could not find a plan definition for ${pId}`);
        }
      }
      return state;
    } catch (err) {
      throw new VError(err, `${logName} Failed to process plan rollback`);
    }
  };
}

async function performPlanRollback(state) {
  const logName = `${moduleName}.performPlanRollback`;
  
  try {
    let candidateList = await queries.getRollbackCandidates(state.currentTargetDef());
    if (candidateList.length) {
      let choices = menu.buildChoices(candidateList);
      state = await menu.displayListMenu(
        state,
        "Rollback Changes",
        "Select plan for rollback:",
        choices,
        rollbackActions(state)
      );
    }
    return state;
  } catch (err) {
    throw new VError(err, `${logName} Error applying rollback`);
  }
}

module.exports = {
  selectTarget,
  listTargetState,
  performPlanRollback
};

