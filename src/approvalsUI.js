"use strict";

const moduleName = "approvalsUI";

const VError = require("verror");
const approvals = require("./approvals");
const menu = require("./textMenus");
const screen = require("./textScreen");
const planui = require("./planUI");
const git = require("./git");
const path = require("path");
const edit = require("./edit");
const plans = require("./plans");

const actionChoices = menu.buildChoices([
  ["Review/Edit Plan", "viewPlan"],
  ["Compare to Previous Plan", "comparePlan"],
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
        screen.heading("Review Plan");
        if (state.currentPlan() === "?:?:?") {
          screen.errorMsg("No Current Plan", "You must select a plan for approval before it can be reviewed");
        } else {
          let [pType, pName, pId] = state.currentPlan().split(":");
          if (pType != "pendingPlans") {
            screen.errorMsg("Wrong Plan Type", "Current plan must be a pending plan");
          } else {
            let plan = state.pendingPlans().get(pId);
            let files = [
              path.join(state.home(), state.currentRepository(), plan.change),
              path.join(state.home(), state.currentRepository(), plan.verify),
              path.join(state.home(), state.currentRepository(), plan.rollback)
            ];
            edit.editFiles(files);
          }
        }
        break;
      case "comparePlan":
        screen.heading("Compare Plans");
        screen.infoMsg("Function Not Implemented", "This function has not yet been implemented");
        break;
      case "approvePlan":
        screen.heading("Approve Plan");
        if (state.currentPlan === "?:?:?") {
          screen.errorMsg("No Current Plan", "You must select a pending plan for approval");
        } else {
          let [pType, pName, pId] = state.currentPlan().split(":");
          if (pType != "pendingPlans") {
            screen.errorMsg("Wrong Plan Type", "Current plan must be a pending plan to be approved");
          } else {
            state = await plans.movePlanToApproved(state);
          }
        }
        break;
      case "rejectPlan":
        screen.heading("Reject Plan");
        break;
      default:
        console.log(`Unrecognised action choice: ${answer.choice}`);
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
    if (state.approvalType === "none") {
      screen.warningMsg("Approval Not Required", "This repository does not require that "
                        + "new change plans are approved");
      return state;
    }
    if (!approvals.isApprover(state)) {
      screen.errorMsg("Not Approved", "You are not one of the registered approvers "
                      + "for this repository");
      let approvers = state.approvers();
      let approverNames = [];
      for (let a of approvers.keys()) {
        approverNames.push(approvers.get(a));
      }
      screen.infoMsg("Approvers List", "The following are nominaed approvers for this repository "
                    + `\n${approverNames.join("\n")}`);
      return state;
    }
    state = await planui.selectPlan(state, "pendingPlans");
    if (!menu.doExit(state.menuChoice())) {
      let repo = state.get("repoObject");
      await git.createBranch(repo, "approvals");
      state = await menu.displayListMenu(
        state,
        "Plan Approval Menu",
        "Select approval action:",
        actionChoices,
        approvalActions(state)
      );
      let changeFiles = await repo.getStatus();
      if (changeFiles.length) {
        let [pName, pId] = state.currentPlan().split(":").slice(1);
        let commitMsg = `Committing approval for change plan ${pName} (${pId})`;
        await git.addAndCommit(state, changeFiles, commitMsg);
        await git.pullMaster(repo);
        await git.mergeBranchIntoMaster(state, "approvals");
      } else {
        await git.deleteBranch(repo, "approvals");        
      }
    }
    return state;
  } catch (err) {
    throw new VError(err, `${logName} Failed to process plan approval`);
  }
}

module.exports = {
  processPlanApproval  
};
