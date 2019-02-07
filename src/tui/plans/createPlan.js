"use strict";

const VError = require("verror");
const inquirer = require("inquirer");
const Plan = require("../../Plan");
const screen = require("../utils/textScreen");
const menu = require("../utils/textMenus");

async function createPlan(state) {
  const logName = "createPlan";
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
    let answers = await inquirer.prompt(questions);
    let changePlan = new Plan({
      name: answers.name,
      description: answers.description,
      author: state.username(),
      authorEmail: state.email()
    });
    changePlan.textDisplay();
    let doCreate = menu.confirmMenu("Create Plan", "Create this change plan");
    if (doCreate) {
      await state.addChangePlan(changePlan);
      state.setCurrentPlanUUID(changePlan.uuid);
      await state.writeChangePlans();
    } else {
      screen.infoMsg("Cancelled", "Plan creation cancelled");
    }
    return state;
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
}

module.exports = createPlan;
