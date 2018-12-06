"use strict";

const moduleName = "planUI";

const VError = require("verror");
const inquirer = require("inquirer");
const plans = require("./plans");
const menu = require("./textMenus");

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

function createPlan(state) {
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
  let planRecord;
  
  return inquirer.prompt(questions)
    .then(answers => {
      planRecord = plans.makePlanRecord(state, answers.name, answers.description);
      displayPlanRecord(planRecord);
      return inquirer.prompt([{
        type: "confirm",
        name: "createPlan",
        message: "Create this change record:"
      }]);
    })
    .then(answers => {
      if (answers.createPlan) {
        console.log("Create Plan");
        return plans.createChangePlan(state, planRecord)
          .then(() => {
            let planMap = state.developmentPlans();
            planMap.set(planRecord.uuid, planRecord);
            state.setDevelopmentPlans(planMap);
            state.setCurrentPlan("developmentPlans", planRecord.name, planRecord.uuid);
            return plans.writePlanFiles(state);
          })
          .catch(err => {
            throw new VError(err, `${logName} Failed to create new plan ${planRecord.name}`);
          });
      } 
      console.log("Cancelled Plan");
      return undefined;
    })
    .then(() => {
      return state;
    })
    .catch(err => {
      throw new VError(err, `${logName} Failed to create new change plan`);
    });
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
    let planMap = state.get(planType);
    let planChoices = buildPlanListUI(planMap);
    state = await menu.displayListMenu(
      state,
      `Change Set - (${planType})`,
      "Select Set:",
      planChoices
    );
    if (!menu.doExit(state.menuChoice())) {
      let plan = planMap.get(state.menuChoice());
      state.setCurrentPlan(planType, plan.name, plan.uuid);      
    }
    state.setMenuChoice("");
    return state;
  } catch (err) {
    throw new VError(err, `${logName} Error selecting change set`);
  }
}

module.exports = {
  displayPlanRecord,
  createPlan,
  listPlans,
  selectPlan
};
