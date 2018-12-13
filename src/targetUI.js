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
const vsprintf = require("sprintf-js").vsprintf;
const planui = require("./planUI");

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
  const lineFmt = "| %17s | %-20s | %10s | %10s | %22s |";
  const sep = vsprintf("|-%1$'-17s-+-%1$'-20s-+-%1$'-10s-+-%1$'-10s-+-%1$'-22s-|", ["-"]);
  const heading = vsprintf(lineFmt, [
    "Applied Date",
    "Plan Name",
    "Status",
    "Applied By",
    "UUID"
  ]);
  
  function formatLine(r) {
    const fmt = "YYYY-MM-DD HH:mm";

    return vsprintf(lineFmt, [
      moment(r.applied_dt).format(fmt),
      r.plan_name.substring(0,20),
      r.status.substring(0,10),
      r.applied_by.substring(0,10),
      r.plan_id
    ]);
  }
  
  try {
    screen.heading("Change State");
    let targetState = await queries.getTargetState(state);
    console.log(sep);
    console.log(heading);
    console.log(sep);
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

async function listUnappliedPlans(state) {
  const logName = `${moduleName}.listUnappliedPlans`;
  const lineFmt = "| %30s | %50s | %10s |";
  const sep = vsprintf("|-%1$'-30s-+-%1$'-50s-+-%1$'-10s-|", ["-"]);
  const header = vsprintf(lineFmt, [
    "Plan Name",
    "Descritpion",
    "Author"
  ]);

  function formatLine(r) {
    return vsprintf(lineFmt, [
      r.name.substring(0,30),
      r.description.substring(0,50),
      r.author.substring(0,10)
    ]);
  }
  
  try {
    let plans = new Map(state.approvedPlans());
    let target = state.currentTargetDef();
    let appliedList = await queries.getAppliedPlans(target);
    for (let p of appliedList) {
      plans.delete(p);
    }
    screen.heading("Unapplied Change Plans");
    console.log(sep);
    console.log(header);
    console.log(sep);
    if (plans.size) {
      for (let p of plans.keys()) {
        console.log(formatLine(plans.get(p)));
      }
    } else {
      console.log("All approved change plans have bene applied to this target");
    }
    return state;
  } catch (err) {
    throw new VError(err, `${logName} Failed to display unapplied plans`);
  }
}

async function applyNextChange(state) {
  const logName = `${moduleName}.applyNextChange`;

  try {
    let plans = new Map(state.approvedPlans());
    let target = state.currentTargetDef();
    let appliedList = await queries.getAppliedPlans(target);
    for (let p of appliedList) {
      plans.delete(p);
    }
    screen.heading("Apply Next Change Plan");
    if (plans.size) {
      let plan = plans.values().next().value;
      planui.displayPlanRecord(plan);
      let choice = await menu.displayConfirmMenu("Apply Change Record", "Apply this change record:");
      if (choice) {
        state.setCurrentPlan(`approvedPlans:${plan.name}:${plan.uuid}`);
        let applyStatus = await psql.applyCurrentPlan(state);
        if (applyStatus) {
          await psql.verifyCurrentPlan(state);
        }
      }
    } else {
      screen.infoMsg("No Unapplied Plans", "There are no outstanding plans needing to be applied to this target");
    }
    return state;
  } catch (err) {
    throw new VError(err, `${logName} Failed to apply next change plan`);
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
          let planList = await queries.getRollbackSets(state.currentTargetDef(), pId);
          let planDefs = planList.map(id => plans.findPlan(state, id));
          console.log("Will rollback these plans");
          console.dir(planDefs);
        }
      } else {
        console.log(`Roll back plan ${pId}`);
        let planInfo = plans.findPlan(state, pId);
        if (planInfo.length) {
          let status = await psql.rollbackPlan(state, planInfo[1], planInfo[0]);
          if (!status) {
            screen.errorMsg(
              "Failed Rollback",
              "The plan roll back encountered errors. You need to manually verify the\n"
              + "databse state to ensure it is consistent and correct"
            );
          } else {
            screen.infoMsg("Rollback Complete", "The rollback script completed without errors");
          }
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
  listUnappliedPlans,
  applyNextChange,
  performPlanRollback
};

