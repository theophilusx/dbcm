"use strict";

const VError = require("verror");
const moduleName = "mainUI";
const menu = require("./textMenus");
const planui = require("./planUI");
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
  ["Edit Change Plan", "editPlan"],
  ["Test Change Plan", "testDevPlan"],
  ["Rollback Change Plan", "rollbackDevPlan"],
  ["Submit Change Plan for Approval", "commitPlan"],
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
  ["View Change History", "viewHistory"],
  ["Rweork Approved Change Plan", "reworkApprovedPlan"]
]);

const rejectedPlanChoices = menu.buildChoices([
  ["List Rejected Plans", "listRejectedPlans"],
  ["View Rejection Notice", "viewRejectNotice"],
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

const repositoryChoices = menu.buildChoices([
  ["Show Repository Details", "showRepo"],
  ["Edit Approvals Setting", "editApprovals"],
  ["List Known Repositories", "listRepos"],
  ["Select Repository", "selectRepo"]
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
          state = await planui.createPlan(state);
          break;
        case "editPlan":
          state = await planui.editPlan(state);
          break;
        case "testDevPlan":
          state = await planui.applyChangePlan(state, "developmentPlans");
          break;
        case "rollbackDevPlan":
          state = await planui.rollbackChangePlan(state, "developmentPlans");
          break;
        case "commitPlan":
          state = await planui.submitPlanForApproval(state);
          break;
        case "listDevPlans":
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
      screen.errorMsg(logName, err.message);
      return state;
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
          state = await planui.listPlans(state, "pendingPlans");
          break;
        case "approvalRequests":
          if (!approvals.isApprover(state)) {
            screen.warningMsg(
              "You Are Not An Approver",
              "You are not a registered approver for this repository"
            );
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
      screen.errorMsg(logName, err.message);
      return state;
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
          state = await planui.listPlans(state, "approvedPlans");
          break;
        case "viewSource":
          screen.warningMsg(
            "Not Yet Implemented",
            "This feature has not yet been implemented"
          );
          break;
        case "reworkApprovedPlan":
          screen.warningMsg(
            "Not Yet Implemented",
            "This feature has not yet been implemented"
          );
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
      screen.errorMsg(logName, err.message);
      return state;
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
          state = await planui.listPlans(state, "rejectedPlans");
          break;
        case "reworkRejectedPlan":
          screen.warningMsg(
            "Not Implemented",
            "This feature has not yet been implemented"
          );
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
      screen.errorMsg(logName, err.message);
      return state;
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
          state = await targetui.listUnappliedPlans(state);
          break;
        case "applyNextChange":
          state = await targetui.applyNextChange(state);
          break;
        case "applyAllChanges":
          screen.warningMsg(
            "Not Yet Implemented",
            "This feature has not yet been implemented"
          );
          break;
        case "rollbackChange":
          state = await targetui.performPlanRollback(state);
          break;
        case "displayChangelog":
          screen.warningMsg(
            "Not Yet Implemented",
            "This feature has not yet been implemented"
          );          
          break;
        case "selectDbTarget":
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
      screen.errorMsg(logName, err.message);
      return state;
    }
  };
}

function repositoryActions(state) {
  const logName = "repositoryActions";

  return async answer => {
    try {
      state.setMenuChoice(answer.choice);
      if (menu.doExit(answer.choice)) {
        return state;
      }
      switch (answer.choice) {
      case "showRepo":
        screen.infoMsg(
          "Not Implemented",
          "This function has not yet been implemented"
        );
        break;
      case "editApprovals":
        state = await approvalsui.editApprovalSettings(state);
        break;
      case "listRepos":
        screen.infoMsg(
          "Not Implemented",
          "This function has not yet been implemented"
        );
        break;
      case "selectRepo":
        state = await repoui.selectRepository(state);
        break;
      default:
        screen.errorMsg(
          "Unrecognised Action",
          `${logName}: No associated action for choice ${answer.choice}`
        );
      }
      return state;
    } catch (err) {
      screen.errorMsg(logName, err.message);
      return state;
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
            state = await menu.listMenu(
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
            state = await menu.listMenu(
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
            state = await menu.listMenu(
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
            state = await menu.listMenu(
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
      screen.errorMsg(logName, err.message);
      return state;
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
            state = await menu.listMenu(
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
            state = await menu.listMenu(
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
          do {
            state = await menu.listMenu(
              state,
              "Repository Management Menu",
              "Select Repository Action",
              repositoryChoices,
              repositoryActions(state)
            );
          } while (!menu.doExit(state.menuChoice()));
          state.setMenuChoice("");
          break;
        default:
          screen.errorMsg(
            "Unrecognised Action",
            `${logName} No associated action for choice ${answer.choice}`);
        }
      }
      return state;
    } catch (err) {
      screen.errorMsg(logName, err.message);
      return state;
    }
  };
}

async function mainMenu(appState) {
  const logName = `${moduleName}.mainMenu`;

  try {
    do {
      appState = await menu.listMenu(
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
