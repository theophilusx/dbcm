"use strict";

const moduleName = "planUI";

const VError = require("verror");
const inquirer = require("inquirer");
const plan = require("./plans");

function displayPlanRecord(record) {
  console.log(`
Date:          ${record.date}
Author:        ${record.author} <${record.email}>
Plan Name:     ${record.name} UUID: ${record.uuid}
Description:   ${record.description}
Change File:   ${record.change}
Verify File:   ${record.verify}
Rollback File: ${record.rollback}`);
}

function getPlanDetails(appState) {
  const logName = `${moduleName}.getPlanDetils`;
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
  let planRecord;
  
  return inquirer.prompt(questions)
    .then(answers => {
      planRecord = plan.createChangeRecord(appState, answers.name, answers.description);
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

module.exports = {
  displayPlanRecord,
  getPlanDetails
};
