"use strict";

const moduleName = "rejectUI";

const VError = require("verror");
const planui = require("./planUI");
const menu = require("./textMenus");
const inquirer = require("inquirer");
const screen = require("./textScreen");

async function rejectPlan(state) {
  const logName = `${moduleName}.rejectPlan`;

  try {
    let planId;
    [state, planId] = await planui.selectPlan(state, "pendingPlans");
    if (menu.doExit(planId)) {
      return state;
    }
    let question = [{
      type: "editor",
      name: "rejectMsg",
      message: "Enter explanation for why this plan was rejected:"
    }];
    let answer = await inquirer.prompt(question);
    let rejectMsg = "-- " + answer.rejectMsg.split("\n").join("\n-- ");
    let planDef = state.currentPlanDef();
    planui.displayPlanRecord(planDef);
    screen.infoMsg(
      "Rejection Notice",
      rejectMsg
    );
    answer = await inquirer.prompt([{
      type: "confirm",
      name: "doReject",
      message: "Reject this plan with this rejection notice:"
    }]);
    if (answer.doReject) {
      screen.infoMsg("Plan Rejected", `The plan '${planDef.name}' has been rejected`);
    } else {
      screen.infoMsg("Rejection Cancelled", "The plan rejection was cancelled");
    }
    return state;
  } catch (err) {
    throw new VError(err, `${logName} `);
  }
}

module.exports = {
  rejectPlan
};
