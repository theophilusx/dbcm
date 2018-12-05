"use strict";

const moduleName = "planUI";

const VError = require("verror");
const inquirer = require("inquirer");
const plan = require("./plans");
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
Author:          ${record.author} <${record.email}>
Plan Name:       ${record.name} UUID: ${record.uuid}
Description:     ${record.description}
Change File:     ${record.change}
Verify File:     ${record.verify}
Rollback File:   ${record.rollback}
Approval Status: ${record.approved ? "Approved" : "Not Approved"}` + approvedList(record));
}

function getPlanDetails(state) {
  const logName = `${moduleName}.getPlanDetils`;
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
      planRecord = plan.createChangeRecord(state, answers.name, answers.description);
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
        return planRecord;
      } 
      console.log("Cancel Plan");
      return undefined;
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
  const logName = `${moduleName}.listPlanSummary`;

  try {
    let planMap = state.get(planType);
    let planChoices = buildPlanListUI(planMap);
    let choice;
    do {
      choice = await menu.displayListMenu(
        `Plan List - ${planType}`,
        "Selet Plan:",
        planChoices
      );
      if (choice != "exitMenu") {
        displayPlanRecord(planMap.get(choice));
      }
    } while (choice != "exitMenu");
  } catch (err) {
    throw new VError(err, `${logName} Failed to display list menu`);
  }
}

module.exports = {
  displayPlanRecord,
  getPlanDetails,
  listPlans
};
