"use strict";

const moduleName = "approvalsUI";

const VError = require("verror");
const menu = require("./textMenus");
const screen = require("./textScreen");
const rejectui = require("./rejectUI");
const viewSource = require("./viewSource");
const commitHistory = require("./commitHistory");
const planDiff = require("./planDiff");
const approvePlan = require("./approvePlan");

const actionChoices = menu.buildChoices([
  ["Review Plan Source", "viewPlan"],
  ["View History", "planHistory"],
  ["View DIff", "planDiff"],
  ["Approve Plan", "approvePlan"],
  ["Reject Plan", "rejectPlan"]
]);

function approvalActions(state) {
  const logName = `${moduleName}.approvalActions`;

  return async answer => {
    try {
      state.setMenuChoice(answer.choice);
      if (menu.doExit(answer.choice)) {
        return state;
      }
      switch (answer.choice) {
      case "viewPlan": 
        state = await viewSource(state, "Approved");
        break;
      case "planHistory": 
        state = await commitHistory(state, "Pending");
        break;
      case "planDiff":
        state = await planDiff(state, "Pending");
        break;
      case "approvePlan":
        state = await approvePlan(state);
        break;
      case "rejectPlan":
        state = rejectui.rejectPlan(state);
        break;
      default:
        screen.errorMsg(
          "Unrecognised Action",
          `${logName}: No associated action for choice ${answer.choice}`
        );
      }
      return state;
    } catch (err) {
      throw new VError(err, `${logName} Failure in processing menu action`);
    }
  };
}

async function processPlanApproval(state) {
  const logName = `${moduleName}.processPlanApproval`;
  
  try {
    do {
      state = await menu.listMenu(
        state,
        "Plan Approval Menu",
        "Select approval action:",
        actionChoices,
        approvalActions(state)
      );
    } while (!menu.doExit(state.menuChoice()));
    state.menuChoice("");
    return state;
  } catch (err) {
    throw new VError(err, `${logName} Failed to process plan approval`);
  }
}

module.exports = {
  processPlanApproval,
};

