"use strict";

const VError = require("verror");
const moduleName = "mainUI";
const menu = require("./textMenus");
const planui = require("./planUI");
const path = require("path");
const edit = require("./edit");
const targetui = require("./targetUI");
const screen = require("./textScreen");
const repoui = require("./repoUI");
const approvals = require("./approvals");
const approvalsui = require("./approvalsUI");

const mainChoices = menu.buildChoices([
  ["Manage Change Plans", "managePlans"],
  ["Manage DB Targets", "manageTargets"],
  ["Manage Repositories", "manageRepositories"],
]);

const planTypeChoices = menu.buildChoices([
  ["Development Change Plans", "developmentPlans"],
  ["Pending Change Plans", "pendingPlans"],
  ["Approved Change Plans", "approvedPlans"],
  ["Rejected change Plans", "rejectedPlans"]
]);

const developmentPlanChoices = menu.buildChoices([
  ["Create New Change Plan", "newPlan"],
  ["Select Development Plan", "selectDevPlan"],
  ["Edit Current Plan", "editPlan"],
  ["Test Current Change Plan", "testDevPlan"],
  ["Rollback Current Change Plan", "rollbackPlan"],
  ["Commit Current Change Plan for Approval", "commitPlan"],
  ["List Development Change Plans", "listDevPlans"]
]);

const pendingPlanChoices = menu.buildChoices([
  ["List Pending Change Plans", "listPendingPlans"],
  ["List My Approval Requests", "approvalRequests"],
  ["Review/Approve/Reject Plan", "approveActions"]
]);

const approvedPlanChoices = menu.buildChoices([
  ["List Approved Change Plans", "listApprovedPlans"],
  ["View Change Sources", "viewSource"],
  ["Rweork Approved Change Plan", "reworkApprovedPlan"]
]);

const rejectedPlanChoices = menu.buildChoices([
  ["List Rejected Plans", "listRejectedPlans"],
  ["Rework Rejected Plan", "reworkRejectedPlan"]
]);

const dbTargetChoices = menu.buildChoices([
  ["List Target State", "listTargetState"],
  ["List Unapplied Change Plans", "listUnappliedChanges"],
  ["Apply Next Unapplied Change", "applyNextChange"],
  ["Apply All Unapplied Changes", "applyAllChanges"],
  ["Rollback Applied Change", "rollbackChange"],
  ["Display Change Log", "displayChangelog"],
  ["Select New Database Target", "selectDbTarget"] 
]);

function developmentPlanActions(state) {
  const logName = "developmentPlanActions";

  return async answer => {
    try {
      state.setMenuChoice(answer.choice);
      if (menu.doExit(answer.choice)) {
        return state;
      } else {
        switch (answer.choice) {
        case "newPlan":
          screen.heading("Create New Plan");
          state = await planui.createPlan(state);
          break;
        case "selectDevPlan":
          screen.heading("Select Development Plan");
          state = await planui.selectPlan(state, "developmentPlans");
          break;
        case "editPlan":
          screen.heading("Edit Plan");
          if (state.currentPlan() === "?:?:?") {
            console.log("You must select a plan before it can be editied");
          } else {
            let pId = state.currentPlan().split(":")[2];
            let plan = state.developmentPlans().get(pId);
            let files = [
              path.join(state.home(), state.currentRepository(), plan.change),
              path.join(state.home(), state.currentRepository(), plan.verify),
              path.join(state.home(), state.currentRepository(), plan.rollback)
            ];
            edit.editFiles(files);
          }
          break;
        case "testDevPlan":
          screen.heading("Apply Test Plan");
          state = await planui.applyTestPlan(state);
          break;
        case "rollbackPlan":
          screen.heading("Rollback Current Plan");
          screen.warningMsg("Not Yet Implemented", "This feature has not yet been implemented");
          break;
        case "commitPlan":
          state = await planui.submitPlanForApproval(state);
          break;
        case "listDevPlans":
          screen.heading("Development Plans");
          state = await planui.listPlans(state, "developmentPlans");
          break;
        default:
          screen.errorMsg(
            "Unrecognised Action",
            `${logName} No associated action for choice ${answer.choice}`
          );
        }
      }
      return state;
    } catch (err) {
      throw new VError(err, `${logName} Menu process failure`);
    }
  };
}

function pendingPlanActions(state) {
  const logName = "pendingPlanActions";

  return async answer => {
    try {
      state.setMenuChoice(answer.choice);
      if (menu.doExit(answer.choice)) {
        return state;
      } else {
        switch (answer.choice) {
        case "listPendingPlans":
          screen.heading("Pending Plans");
          state = await planui.listPlans(state, "pendingPlans");
          break;
        case "approvalRequests":
          screen.heading("Approval Requests");
          if (!approvals.isApprover(state)) {
            screen.warningMsg("You Are Not An Approver", "You are not a "
                              + "registered approver for this repository");
          } else {
            state = await planui.listPlans(state, "pendingPlans");
          }
          break;
        case "approveActions":
          state = await approvalsui.processPlanApproval(state);
          break;
        default:
          screen.errorMsg(
            "Unrecognised Action",
            `${logName} No associated action for choice ${answer.choice}`
          );
        }
      }
      return state;
    } catch (err) {
      throw new VError(err, `${logName} Menu process failure`);
    }
  };
}

function approvedPlanActions(state) {
  const logName = "approvedPlanActions";

  return async answer => {
    try {
      state.setMenuChoice(answer.choice);
      if (menu.doExit(answer.choice)) {
        return state;
      } else {
        switch (answer.choice) {
        case "listApprovedPlans":
          screen.heading("Approved Plans");
          state = await planui.listPlans(state, "approvedPlans");
          break;
        case "viewSource":
          screen.heading("View Plan Source");
          screen.warningMsg("Not Yet Implemented", "This feature has not yet been implemented");
          break;
        case "reworkApprovedPlan":
          screen.heading("Rework Approved Plan");
          screen.warningMsg("Not Yet Implemented", "This feature has not yet been implemented");
          break;
        default:
          screen.errorMsg(
            "Unrecognised Action",
            `${logName} No associated action for choice ${answer.choice}`
          );
        }
      }
      return state;
    } catch (err) {
      throw new VError(err, `${logName} Menu process failure`);
    }
  };
}

function rejectedPlanActions(state) {
  const logName = "rejectedPlanActions";

  return async answer => {
    try {
      state.setMenuChoice(answer.choice);
      if (menu.doExit(answer.choice)) {
        return state;
      } else {
        switch (answer.choice) {
        case "listRejectedPlans":
          screen.heading("Rejected Plans");
          state = await planui.listPlans(state, "rejectedPlans");
          break;
        case "reworkRejectedPlan":
          screen.heading("Rework Rejected Plan");
          screen.warningMsg("Not Implemented", "This feature has not yet been implemented");
          break;
        default:
          screen.errorMsg(
            "Unrecognised Action",
            `${logName} No associated action for choice ${answer.choice}`
          );
        }
      }
      return state;
    } catch (err) {
      throw new VError(err, `${logName} Menu process failure`);
    }
  };
}

function targetAction(state) {
  const logName = "targetAction";

  return async answer => {
    try {
      state.setMenuChoice(answer.choice);
      if (menu.doExit(answer.choice)) {
        return state;
      } else {
        switch (answer.choice) {
        case "listTargetState":
          state = await targetui.listTargetState(state);
          break;
        case "listUnappliedChanges":
          screen.heading("List Unapplied Changes");
          screen.warningMsg("Not Yet Implemented", "This feature has not yet been implemented");
          break;
        case "applyNextChange":
          screen.heading("Apply Next Change");
          screen.warningMsg("Not Yet Implemented", "This feature has not yet been implemented");          
          break;
        case "applyAllChanges":
          screen.heading("Apply All Unapplied Changes");
          screen.warningMsg("Not Yet Implemented", "This feature has not yet been implemented");
          break;
        case "rollbackChange":
          screen.heading("Rollback Change");
          screen.warningMsg("Not Yet Implemented", "This feature has not yet been implemented");
          break;
        case "displayChangelog":
          screen.heading("Display Changelog");
          screen.warningMsg("Not Yet Implemented", "This feature has not yet been implemented");          
          break;
        case "selectDbTarget":
          screen.heading("Select DB Target");
          state = await targetui.selectTarget(state);
          break;
        default:
          screen.errorMsg(
            "Unrecognised Action",
            `${logName} No associated action for choice ${answer.choice}`
          );
        }
      }
      return state;
    } catch (err) {
      throw new VError(err, `${logName} Menu process failure`);
    }
  };
}

function planTypeAction(state) {
  const logName = "setTypeAction";

  return async answer => {
    try {
      state.setMenuChoice(answer.choice);
      if (menu.doExit(answer.choice)) {
        return state;
      } else {
        switch (answer.choice) {
        case "developmentPlans":
          do {
            state = await menu.displayListMenu(
              state,
              "Development Plan Menu",
              "Select Plan Action",
              developmentPlanChoices,
              developmentPlanActions(state)
            );
          } while (!menu.doExit(state.menuChoice()));
          state.setMenuChoice("");
          break;
        case "pendingPlans":
          do {
            state = await menu.displayListMenu(
              state,
              "Pending Plan Menu",
              "Select Plan Action",
              pendingPlanChoices,
              pendingPlanActions(state)
            );
          } while (!menu.doExit(state.menuChoice()));
          state.setMenuChoice("");
          break;
        case "approvedPlans":
          do {
            state = await menu.displayListMenu(
              state,
              "Approved Plan Menu",
              "Selet Plan Action",
              approvedPlanChoices,
              approvedPlanActions(state)
            );
          } while (!menu.doExit(state.menuChoice()));
          state.setMenuChoice("");
          break;
        case "rejectedPlans":
          do {
            state = await menu.displayListMenu(
              state,
              "Rejected Plans Menu",
              "Select Plan Action",
              rejectedPlanChoices,
              rejectedPlanActions(state)
            );
          } while (!menu.doExit(state.menuChoice()));
          state.setMenuChoice("");
          break;
        default:
          screen.errorMsg(
            "Unrecognised Action",
            `${logName} No associated action for choice ${answer.choice}`
          );
        }
      }
      return state;
    } catch (err) {
      throw new VError(err, `${logName} Menu process failure`);
    }
  };
}

function mainAction(state) {
  const logName = "mainAction";

  return async answer => {
    try {
      state.setMenuChoice(answer.choice);
      if (menu.doExit(answer.choice)) {
        return state;
      } else {
        switch (answer.choice) {
        case "managePlans":
          do {
            state = await menu.displayListMenu(
              state,
              "Plan Menu",
              "Select Change Plan Group",
              planTypeChoices,
              planTypeAction(state)
            );
          } while (!menu.doExit(state.menuChoice()));
          state.setMenuChoice("");
          break;
        case "manageTargets":
          do {
            state = await menu.displayListMenu(
              state,
              "Database Target Menu",
              "Select Target Action",
              dbTargetChoices,
              targetAction(state)
            );
          } while (!menu.doExit(state.menuChoice()));
          state.setMenuChoice("");
          break;
        case "manageRepositories":
          state = await repoui.selectRepository(state);
          break;
        default:
          screen.errorMsg(
            "Unrecognised Action",
            `${logName} No associated action for choice ${answer.choice}`);
        }
      }
      return state;
    } catch (err) {
      throw new VError(err, `${logName} Menu process failure`);
    }
  };
}

async function mainMenu(appState) {
  const logName = `${moduleName}.mainMenu`;

  try {
    do {
      appState = await menu.displayListMenu(
        appState,
        "Main Menu",
        "Select Action",
        mainChoices,
        mainAction(appState)
      );
    } while (!menu.doExit(appState.menuChoice()));
    return appState;
  } catch (err) {
    throw new VError(err, `${logName} Menu process failure`);
  }
}

module.exports = {
  mainMenu
};
