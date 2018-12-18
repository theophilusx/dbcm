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
const inquirer = require("inquirer");
const gitui = require("./gitUI");

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
        if (!state.currentPlan()) {
          screen.errorMsg(
            "No Current Plan",
            "You must select a plan for approval before it can be reviewed"
          );
        } else {
          let pType = state.currentPlanType();
          let pId = state.currentPlan();
          if (pType != "pendingPlans") {
            screen.errorMsg(
              "Wrong Plan Type",
              "The currently selected plan is not a plan pending approval");
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
        screen.infoMsg("Function Not Implemented", "This function has not yet been implemented");
        break;
      case "approvePlan":
        if (state.currentPlanType() != "pendingPlans") {
          screen.errorMsg(
            "Wrong Plan Type",
            "Current plan must be a pending plan to be approved"
          );
        } else {
          state = await plans.movePlanToApproved(state);
        }
        break;
      case "rejectPlan":
        screen.infoMsg("Function Not Implemented", "This function has not yet been implemented");
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
  let choice;
  
  try {
    [state, choice] = await planui.selectPlan(state, "pendingPlans");
    if (menu.doExit(choice)) {
      return state;
    }
    if (state.approvalType === "none") {
      screen.warningMsg(
        "Approval Not Required",
        "This repository does not require that "
          + "new change plans are approved"
      );
    } else if (!approvals.isApprover(state)) {
      screen.errorMsg(
        "Not Approved",
        "You are not one of the registered approvers "
          + "for this repository"
      );
      let approvers = state.approvers();
      let approverNames = [];
      for (let a of approvers.keys()) {
        approverNames.push(approvers.get(a));
      }
      screen.infoMsg(
        "Approvers List",
        "The following are nominaed approvers for this repository "
          + `\n${approverNames.join("\n")}`
      );
      return state;
    }
    let repo = state.get("repoObject");
    await git.createBranch(repo, "approvals");
    await repo.checkoutBranch("approvals");
    state = await menu.displayListMenu(
      state,
      "Plan Approval Menu",
      "Select approval action:",
      actionChoices,
      approvalActions(state)
    );
    let changeFiles = await repo.getStatus();
    if (changeFiles.length) {
      let planDef = state.currentPlanDef();
      let commitMsg = `Committing approval for change plan '${planDef.name}'`;
      await git.addAndCommit(state, changeFiles, commitMsg);
      await git.pullMaster(repo);
      await git.mergeBranchIntoMaster(state, "approvals");
    } else {
      await git.deleteBranch(repo, "approvals");        
    }
    return state;
  } catch (err) {
    throw new VError(err, `${logName} Failed to process plan approval`);
  }
}

async function selectApprovalType(state) {
  const logName = `${moduleName}.selectApprovalType`;
  const choices = [{
    name: "No approvals required",
    value: "none"
  },
  {
    name: "Any single registered approver can approve a change",
    value: "any"
  },
  {
    name: "All registered approvers must approve the change",
    value: "all"
  }];
  
  try {
    console.log(`Current Approval Type: ${state.approvalType()}`);
    let choice = await menu.displayListMenu(
      state,
      "Approval Type",
      "Select approval type:",
      choices
    );
    state.setApprovalType(choice);
    return state;
  } catch (err) {
    throw new VError(err, `${logName} `);
  }
}

async function selectApprovers(state) {
  const logName = `${moduleName}.selectApprovers`;

  try {
    let choices = [];
    let approvers = state.approvers();
    for (let a of approvers.keys()) {
      choices.push({
        name: `${approvers.get(a)} <${a}>`,
        value: a
      });
    }
    let question1 = [{
      type: "checkbox",
      name: "toKeep",
      choices: choices,
      message: "Select approvers to keep:"
    }];
    let question2 = [{
      type: "confirm",
      name: "addMore",
      message: "Do you want to add another approver:"
    },
    {
      type: "input",
      name: "name",
      message: "Approver's name:",
      when: answer => {
        return answer.addMore;
      }
    },
    {
      type: "input",
      name: "email",
      message: "Approver's email address:",
      when: answer => {
        return answer.addMore;
      }
    }];
    let newApprovers = new Map();
    if (approvers.size > 0) {
      let answer = await inquirer.prompt(question1);
      for (let a of answer.toKeep) {
        newApprovers.set(a, approvers.get(a));
      }
    }
    let answer;
    do {
      answer = await inquirer.prompt(question2);
      if (answer.addMore) {
        newApprovers.set(answer.email, answer.name);
      }
    } while (answer.addMore);
    state.setApprovers(newApprovers);
    return state;
  } catch (err) {
    throw new VError(err, `${logName} `);
  }
}

async function editApprovalSettings(state) {
  const logName = `${moduleName}.editApprovals`;

  try {
    let committed = await gitui.commitChanges(state);
    if (committed) {
      let repo = state.get("repoObject");
      await git.createBranch(repo, "approvals");
      await repo.checkoutBranch("approvals");
      state = await selectApprovalType(state);
      state = await selectApprovers(state);
      await approvals.writeApprovalsFile(state);
      let changeFiles = await repo.getStatus();
      if (changeFiles.length) {
        let commitMsg = "Updating repository approval settings";
        await git.addAndCommit(state, changeFiles, commitMsg);
        await git.pullMaster(repo);
        await git.mergeBranchIntoMaster(state, "approvals");
      } else {
        await git.deleteBranch(repo, "approvals");
      }
      return state;
    }
  } catch (err) {
    throw new VError(err, `${logName} `);
  }
}

module.exports = {
  processPlanApproval,
  editApprovalSettings
};

