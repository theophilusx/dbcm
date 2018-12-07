"use strict";

const moduleName = "planUI";

const VError = require("verror");
const inquirer = require("inquirer");
const plans = require("./plans");
const menu = require("./textMenus");
const psql = require("./psql");
const gitui = require("./gitUI");
const chalk = require("chalk");

function displayPlanRecord(record) {
  function approvedList(r) {
    let data = "";
    if (r.approved) {
      data += `\n\t${r.name} <${r.email}> ${r.date}`;
    }
    return data;
  }
  
  console.log(`
Created Date:    ${record.createdDate}
Author:          ${record.author} <${record.authorEmail}>
Plan Name:       ${record.name} UUID: ${record.uuid}
Description:     ${record.description}
Change File:     ${record.change}
Verify File:     ${record.verify}
Rollback File:   ${record.rollback}
Approval Status: ${record.approved ? "Approved" : "Not Approved"}` + approvedList(record));
}

async function createPlan(state) {
  const logName = `${moduleName}.createPlan`;
  const questions = [
    {
      type: "input",
      name: "name",
      message: "Set name:"
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
        console.log("Creating new plan");
        await plans.createChangePlan(state, planRecord);
        let planMap = state.developmentPlans();
        planMap.set(planRecord.uuid, planRecord);
        state.setDevelopmentPlans(planMap);
        state.setCurrentPlan("developmentPlans", planRecord.name, planRecord.uuid);
        await plans.writePlanFiles(state);
      } else {
        console.log("Cancelled Plan");      
      }
    } else {
      console.log(chalk.red("Uncommitted changes prevent plan creation"));
      console.log("Connot create new plan when uncommitted changes exist");
      console.log("Either commit or revert the changes before attempting to create a new plan");
    }
    return state;
  } catch (err) {
    throw new VError(err, `${logName} Failed to create new change plan`);
  }
}

function buildPlanListUI(pMap) {
  const logName = `${moduleName}.buildPlanListUI`;
  const choices = [];

  try {
    for (let p of pMap.keys()) {
      let pData = pMap.get(p);
      choices.push([
        `${pData.name} : ${pData.author} : ${pData.createdDate} : ${pData.approved ? "Approved" : "Unapproved"}`,
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
    console.dir(planMap);
    let planChoices = buildPlanListUI(planMap);
    do {
      state = await menu.displayListMenu(
        state,
        `Change Sets - (${planType})`,
        "Selet Set:",
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
    console.log(`Selecting ${planType}`);
    let planMap = state.get(planType);
    console.dir(planMap);
    let planChoices = buildPlanListUI(planMap);
    state = await menu.displayListMenu(
      state,
      `Change Set - (${planType})`,
      "Select Set:",
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
        console.log(chalk.red("Uncommitted changes prevent plan creation"));
        console.log("Connot create new plan when uncommitted changes exist");
        console.log("Either commit or revert the changes before attempting to create a new plan");
      }
    }
    state.setMenuChoice("");
    return state;
  } catch (err) {
    throw new VError(err, `${logName} Error selecting change set`);
  }
}

async function applyTestPlan(state) {
  const logName = `${moduleName}.applyTestPlan`;

  try {
    state = await selectPlan(state, "developmentPlans");
    await psql.applyCurrentPlan(state);
    return state;
  } catch (err) {
    throw new VError(err, `${logName} Failed to apply test plan`);
  }
}

module.exports = {
  displayPlanRecord,
  createPlan,
  listPlans,
  selectPlan,
  applyTestPlan
};
