"use strict";

const moduleName = "planUI";

const VError = require("verror");
const inquirer = require("inquirer");
const plans = require("./plans");
const menu = require("./textMenus");
const psql = require("./psql");
const gitui = require("./gitUI");
const git = require("./git");
const screen = require("./textScreen");
const Table = require("cli-table3");
const chalk = require("chalk");

function commitWarning() {
  let title = "Uncommitted Changes";
  let msg = `
Cannot create a new plan or switch to a different plan when uncommitted plan data
exists. Either commit the changes or revert the changes before attempting to create
a new plan or switch to an alternative plan
`;
  screen.warningMsg(title, msg);
}

function displayPlanRecord(record) {
  function approvedList(r) {
    let data = "";
    for (let a of r.approvals) {
      data += `\n\t${a.name} <${a.email}> on ${a.date}`;
    }
    return data;
  }
  const table = new Table();
  table.push(
    {"Created Date": chalk.green(record.createdDate)},
    {"Author": chalk.green(record.author)},
    {"Plan Name": chalk.green(record.name)},
    {"UUID": chalk.green(record.uuid)},
    {"Description": chalk.green(record.description)},
    {"Change File": chalk.green(record.change)},
    {"Verify File": chalk.green(record.verify)},
    {"Rollback File": chalk.green(record.rollback)},
    {"Approval Status": record.approved ? chalk.green("Approved") : chalk.red("Not Approved")},
  );
  if (record.approved) {
    table.push({
      "Approvals": approvedList(record)
    });
  }
  console.log(table.toString());
}

async function createPlan(state) {
  const logName = `${moduleName}.createPlan`;
  const questions = [
    {
      type: "input",
      name: "name",
      message: "Plan name:"
    },
    {
      type: "input",
      name: "description",
      message: "Description:"
    }];

  try {
    let committedChanges = await gitui.commitChanges(state);
    if (committedChanges) {
      let answers = await inquirer.prompt(questions);
      let planRecord = plans.makePlanRecord(state, answers.name, answers.description);
      displayPlanRecord(planRecord);
      answers = await inquirer.prompt([{
        type: "confirm",
        name: "createPlan",
        message: "Create this change record:"
      }]);
      if (answers.createPlan) {
        await plans.createChangePlan(state, planRecord);
        let planMap = state.developmentPlans();
        planMap.set(planRecord.uuid, planRecord);
        state.setDevelopmentPlans(planMap);
        state.setCurrentPlan("developmentPlans", planRecord.name, planRecord.uuid);
        await plans.writePlanFiles(state);
        let repo = state.get("repoObject");
        let changedFiles = await repo.getStatus();
        if (changedFiles.length) {
          await git.addAndCommit(state, changedFiles, "Initial commit for plan: "
                                 + `${planRecord.name}`);
        }
      } else {
        screen.infoMsg("Cancelled", "Plan creation cancelled");
      }
    } else {
      commitWarning();
    }
    return state;
  } catch (err) {
    throw new VError(err, `${logName} Failed to create new change plan`);
  }
}

function buildPlanListUI(pMap) {
  const logName = `${moduleName}.buildPlanListUI`;
  const choices = [];

  function displayLine(r) {
    return `${r.name} : ${r.author} : ${r.createdDate} : `
      + `${r.approved ? "Approved" : "Unapproved"}`;
  }

  try {
    for (let p of pMap.keys()) {
      let pData = pMap.get(p);
      choices.push([
        displayLine(pData),
        p
      ]);
    }
    return menu.buildChoices(choices);
  } catch (err) {
    throw new VError(err, `${logName} Failed to build up plan list`);
  }
}

async function listPlans(state, planType) {
  const logName = `${moduleName}.listPlans`;

  try {
    let planMap = state.get(planType);
    let planChoices = buildPlanListUI(planMap);
    do {
      state = await menu.displayListMenu(
        state,
        `Change Plans - (${planType})`,
        "Select Plan:",
        planChoices
      );
      if (!menu.doExit(state.menuChoice())) {
        displayPlanRecord(planMap.get(state.menuChoice()));
      }
    } while (!menu.doExit(state.menuChoice()));
    state.setMenuChoice("");
    return state;
  } catch (err) {
    throw new VError(err, `${logName} Failed to display list menu`);
  }
}

async function selectPlan(state, planType) {
  const logName = `${moduleName}.selectPlan`;

  try {
    let planMap = state.get(planType);
    let planChoices = buildPlanListUI(planMap);
    state = await menu.displayListMenu(
      state,
      `Change Plan - (${planType})`,
      "Select Plan:",
      planChoices
    );
    if (!menu.doExit(state.menuChoice())) {
      let plan = planMap.get(state.menuChoice());
      let repo = state.get("repoObject");
      let allCommitted = await gitui.commitChanges(state);
      if (allCommitted) {
        state.setCurrentPlan(planType, plan.name, plan.uuid);
        if (planType === "developmentPlans") {
          let branchName = `${plan.name.replace(/\s+/g, "-")}-${plan.uuid}`;
          await repo.checkoutBranch(branchName);
        } else {
          await repo.checkoutBranch("master");
        }
      } else {
        commitWarning();
      }
    }
    state.setMenuChoice("");
    return state;
  } catch (err) {
    throw new VError(err, `${logName} Error selecting change set`);
  }
}

async function applyChangePlan(state, type) {
  const logName = `${moduleName}.applyChangePlan`;

  try {
    state = await selectPlan(state, type);
    let applied = await psql.applyCurrentPlan(state);
    if (applied) {
      await psql.verifyCurrentPlan(state);
    } else {
      let pId = state.currentPlan().split(":")[2];
      let changePlan = plans.findPlan(state, pId)[1];
      await psql.rollbackPlan(state, changePlan);
    }
    return state;
  } catch (err) {
    throw new VError(err, `${logName} Failed to apply test plan`);
  }
}

async function submitPlanForApproval(state) {
  const logName = `${moduleName}.submitPlanForApproval`;

  try {
    state = await selectPlan(state, "developmentPlans");
    let pName = state.currentPlan().split(":")[1];
    screen.infoMsg(
      "Moving Plan to Pending",
      `Moving ${pName} plan to pending group for approval`
    );
    state = await plans.movePlanToPending(state);
    return state;
  } catch (err) {
    throw new VError(err, `${logName} Failed to move plan to pending gorup`);
  }
}

module.exports = {
  displayPlanRecord,
  createPlan,
  listPlans,
  selectPlan,
  applyChangePlan,
  submitPlanForApproval  
};
