"use strict";

const moduleName = "planUI";

const VError = require("verror");
const inquirer = require("inquirer");
const plans = require("./plans");
const menu = require("./textMenus");
const psql = require("./psql");
const gitui = require("./gitUI");
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
    console.log(`${logName}: committedChanges = ${committedChanges}`);
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
        state = await plans.createChangePlan(state, planRecord);
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
    let choice;
    do {
      choice = await menu.displayListMenu(
        state,
        `Change Plans - (${planType})`,
        "Select Plan:",
        planChoices
      );
      if (!menu.doExit(choice)) {
        displayPlanRecord(planMap.get(choice));
      }
    } while (!menu.doExit(choice));
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
    let choice = await menu.displayListMenu(
      state,
      `Change Plan - (${planType})`,
      "Select Plan:",
      planChoices
    );
    if (!menu.doExit(choice)) {
      if (choice === state.currentPlan()) {
        // same plan - no change
        return [state, choice];
      }
      // different plan - need to commit changes and set branch
      let allCommitted = await gitui.commitChanges(state);
      if (allCommitted) {
        // we have committed changes and can now switch to new plan
        let plan = planMap.get(choice);
        let repo = state.get("repoObject");
        state.setCurrentPlanType(planType);
        state.setCurrentPlan(plan.uuid);
        if (planType === "developmentPlans") {
          let branchName = `${plan.name.replace(/\s+/g, "-")}`;
          await repo.checkoutBranch(branchName);
        } else {
          await repo.checkoutBranch("master");
        }
        return [state, choice];
      }
      commitWarning();
      return [state, undefined];
    }
    return [state, undefined];
  } catch (err) {
    throw new VError(err, `${logName} Error selecting change set`);
  }
}

async function applyChangePlan(state, type) {
  const logName = `${moduleName}.applyChangePlan`;
  let choice;
  
  try {
    [state, choice] = await selectPlan(state, type);
    if (menu.doExit(choice)) {
      // no plan selected to act on
      return state;
    }
    let applied = await psql.applyCurrentPlan(state);
    if (applied) {
      await psql.verifyCurrentPlan(state);
    } else {                    // change plan applied with errors
      let changePlan = state.currentPlanDef();
      await psql.rollbackPlan(state, changePlan);
    }
    return state;
  } catch (err) {
    throw new VError(err, `${logName} Failed to apply test plan`);
  }
}

async function rollbackChangePlan(state, type) {
  const logName = `${moduleName}.rollbackChangePlan`;
  let choice;
  
  try {
    [state, choice] = await selectPlan(state, type);
    if (menu.doExit(choice)) {
      // no plan selected to act on
      return state;
    }
    let plan = state.currentPlanDef();
    await psql.rollbackPlan(state, plan);
    return state;
  } catch (err) {
    throw new VError(err, `${logName} `);
  }
}

async function submitPlanForApproval(state) {
  const logName = `${moduleName}.submitPlanForApproval`;
  let choice;
  
  try {
    [state, choice] = await selectPlan(state, "developmentPlans");
    if (menu.doExit(choice)) {
      // no plan selected to act on
      return state;
    }
    let pName = state.currentPlanDef().name;
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
  rollbackChangePlan,
  submitPlanForApproval  
};
