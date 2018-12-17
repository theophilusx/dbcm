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
const git = require("./git");
const Table = require("cli-table3");
const cliWidth = require("cli-width");

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
  const width = cliWidth({defaultWidth: 80}) - 6;
  const fmt = "YYYY-MM-DD HH:mm";
  
  
  
  try {
    let fixedWidth = 18 + 10 + 12 + 30 + 10;
    let extraSpace = Math.floor((width - fixedWidth) / 2);
    let nameSize = parseInt(30 + extraSpace);
    let bySize = parseInt(10 + extraSpace);
    console.log(`width: ${width} Fixed: ${fixedWidth} extra: ${extraSpace} Name: ${nameSize} By: ${bySize}`);
    const table = new Table({
      head: ["Applied Date", "Plan Name", "Version", "Status", "Applied By"],
      colWidths: [18, nameSize, 10, 12, bySize]
    });
    let targetState = await queries.getTargetState(state);
    if (targetState.length) {
      for (let t of targetState) {
        table.push([
          moment(t.applied_dt).format(fmt),
          t.plan_name,
          t.repository_version,
          t.status,
          t.applied_by
        ]);
      }
      console.log(table.toString());
    } else {
      screen.infoMsg(
        "No Applied Changes",
        "There has been no changes applied to this target"
      );
    }
    return state;
  } catch (err) {
    throw new VError(err, `${logName} Failed to get applied changes`);
  }
}

async function listUnappliedPlans(state) {
  const logName = `${moduleName}.listUnappliedPlans`;
  const table = new Table({
    head: ["Plan Name", "Version", "Description", "Author"],
    wordWrap: true
  });

  try {
    let approvedPlans = new Map(state.approvedPlans());
    let target = state.currentTargetDef();
    let appliedList = await queries.getAppliedPlans(target);
    for (let [pId, sha] of appliedList) {
      let plan = plans.findPlan(state, pId)[1];
      let currentSha = await git.getChangesSha(state, plan);
      if (sha === currentSha) {
        approvedPlans.delete(pId);
      } else {
        console.log(`${plan.name} has changed and needs to be re-applied`);
      }
    }
    if (approvedPlans.size) {
      for (let p of approvedPlans.keys()) {
        let plan = approvedPlans.get(p);
        table.push([
          plan.name,
          state.currentReleaseTag(),
          plan.description,
          plan.author
        ]);
      }
      console.log(table.toString());
    } else {
      screen.infoMsg(
        "No Outstanding Changes",
        "There are no approved change plans needing to be applied to this target"
      );
    }
    return state;
  } catch (err) {
    throw new VError(err, `${logName} Failed to display unapplied plans`);
  }
}

async function applyNextChange(state) {
  const logName = `${moduleName}.applyNextChange`;

  try {
    let approvedPlans = new Map(state.approvedPlans());
    let target = state.currentTargetDef();
    let appliedList = await queries.getAppliedPlans(target);
    for (let [pId, sha] of appliedList) {
      let plan = plans.findPlan(state, pId)[1];
      let currentSha = await git.getChangesSha(state, plan);
      if (sha === currentSha) {
        approvedPlans.delete(pId);
      }
    }
    if (approvedPlans.size) {
      let plan = approvedPlans.values().next().value;
      planui.displayPlanRecord(plan);
      let choice = await menu.displayConfirmMenu(
        "Apply Change Record",
        "Apply this change record:");
      if (choice) {
        state.setCurrentPlan(`approvedPlans:${plan.name}:${plan.uuid}`);
        let applyStatus = await psql.applyCurrentPlan(state);
        if (applyStatus) {
          await psql.verifyCurrentPlan(state);
        } else {
          await psql.rollbackPlan(state, plan);
        }
      }
    } else {
      screen.infoMsg(
        "No Unapplied Plans",
        "There are no outstanding plans needing to be applied to this target"
      );
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
          "The plan you have selected was not the most recent plan applied to this target\n"
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
        let planInfo = plans.findPlan(state, pId);
        if (planInfo.length) {
          await psql.rollbackPlan(state, planInfo[1]);
        } else {
          screen.errorMsg(
            "No Plan Definition",
            `Could not find a plan definition for ${pId}`
          );
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

