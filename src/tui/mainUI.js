"use strict";

const moduleName = "mainUI";

const VError = require("verror");
const menu = require("./utils/textMenus");
const screen = require("./utils/textScreen");
const selectRepository = require("./repo/selectRepository");
const viewPlan = require("./plans/viewPlan");
const viewSource = require("./plans/viewSource");
const createPlan = require("./plans/createPlan");
const editPlan = require("./plans/editPlan");
const applyChange = require("./targets/applyChange");
const rollbackChange = require("./targets/rollbackChange");
const submitPlan = require("./plans/submitPlan");
const commitHistory = require("./repo/commitHistory");
const planDiff = require("./repo/planDiff");
const reworkPlan = require("./plans/reworkPlan");
const targetState = require("./targets/targetState");
const unappliedPlans = require("./targets/unappliedPlans");
const applyNextChange = require("./targets/applyNextChange");
const selectTarget = require("./targets/selectTarget");
const rollbackLastChange = require("./targets/rollbackLastChange");
const changeLog = require("./targets/changeLog");
const approvePlan = require("./plans/approvePlan");
const rejectPlan = require("./plans/rejectPlan");
const selectPlan = require("./plans/selectPlan");
const viewNote = require("./plans/viewNote");
const createNote = require("./plans/createNote");
const selectApprovalMethod = require("./repo/selectApprovalMethod");
const markPlanApplied = require("./targets/markPlanApplied");
const markPlanRolledback = require("./targets/markPlanRolledback");
const deletePlan = require("./plans/deletePlan");

const mainChoices = menu.buildChoices([
  ["Manage Change Plans", "managePlans"],
  ["Manage DB Targets", "manageTargets"],
  ["Manage Repositories", "manageRepositories"]
]);

const planTypeChoices = menu.buildChoices([
  ["Development Change Plans", "developmentPlans"],
  ["Pending Change Plans", "pendingPlans"],
  ["Approved Change Plans", "approvedPlans"],
  ["Rejected change Plans", "rejectedPlans"]
]);

const developmentPlanChoices = menu.buildChoices([
  ["Create New Plan", "newPlan"],
  ["Edit Plan", "editPlan"],
  ["Add Note", "addNote"],
  ["Apply Plan", "testDevPlan"],
  ["Rollback Plan", "rollbackDevPlan"],
  ["Submit Plan for Approval", "commitPlan"],
  ["List Development Plans", "listDevPlans"],
  ["Show Plan Notes", "showNotes"],
  ["Delete Plan", "deletePlan"]
]);

const pendingPlanChoices = menu.buildChoices([
  ["List Plans", "listPendingPlans"],
  ["Review Plan Source", "viewPlan"],
  ["Review Plan Notes", "showNotes"],
  ["View Commit History", "planHistory"],
  ["View Plan Diff", "planDiff"],
  ["Approve Plan", "approvePlan"],
  ["Reject Plan", "rejectPlan"],
  ["Make New Release", "newRelease"]
]);

const approvedPlanChoices = menu.buildChoices([
  ["List Approved Plans", "listApprovedPlans"],
  ["View Plan Sources", "viewSource"],
  ["View Commit History", "viewHistory"],
  ["View Plan Diff", "viewDiff"],
  ["View Plan Notes", "showNotes"],
  ["Rweork Approved Plan", "reworkApprovedPlan"]
]);

const rejectedPlanChoices = menu.buildChoices([
  ["List Rejected Plans", "listRejectedPlans"],
  ["View Plan Source", "viewRejected"],
  ["View Plan Notes", "showNotes"],
  ["Rework Rejected Plan", "reworkRejectedPlan"]
]);

const dbTargetChoices = menu.buildChoices([
  ["List Target State", "listTargetState"],
  ["List Unapplied Plans", "listUnappliedChanges"],
  ["Apply Next Unapplied Change", "applyNextChange"],
  ["Apply All Unapplied Changes", "applyAllChanges"],
  ["Rollback Last Applied Change", "rollbackLastChange"],
  ["Apply Specific Change", "applyChange"],
  ["Rollback Specific Change", "rollbackChange"],
  ["Mark Plan as Applied", "markApplied"],
  ["Mark Plan as Rolledback", "markRolledback"],
  ["Display Change Log", "displayChangelog"],
  ["Change Database Target", "selectDbTarget"]
]);

const repositoryChoices = menu.buildChoices([
  ["Show Repository Details", "showRepo"],
  ["Edit Approvals Setting", "editApprovals"],
  ["Change Repository", "selectRepo"]
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
            state = await createPlan(state);
            break;
          case "editPlan":
            state = await editPlan(state);
            break;
          case "addNote": {
            let planChoices = state.changePlans().planGroupMap("Development");
            let choice = await selectPlan(state, planChoices);
            if (choice) {
              let plan = state.planDef(choice);
              await createNote(state, plan);
            }
            break;
          }
          case "testDevPlan":
            state = await applyChange(state, "Development");
            break;
          case "rollbackDevPlan":
            state = await rollbackChange(state, "Development");
            break;
          case "commitPlan":
            state = await submitPlan(state);
            break;
          case "listDevPlans":
            state = await viewPlan(state, "Development");
            break;
          case "showNotes":
            state = await viewNote(state, "Development");
            break;
          case "deletePlan":
            state = await deletePlan(state, "Development");
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
            state = await viewPlan(state, "Pending");
            break;
          case "viewPlan":
            state = await viewSource(state, "Pending");
            break;
          case "showNotes":
            state = await viewNote(state, "Pending");
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
            state = await rejectPlan(state);
            break;
          case "newRelease":
            screen.warningMsg(
              "Not Implemented",
              "This functionality has not yet been implemented"
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
            state = await viewPlan(state, "Approved");
            break;
          case "viewSource":
            state = await viewSource(state, "Approved");
            break;
          case "viewHistory":
            state = await commitHistory(state, "Approved");
            break;
          case "viewDiff":
            state = await planDiff(state, "Approved");
            break;
          case "showNotes":
            state = await viewNote(state, "Approved");
            break;
          case "reworkApprovedPlan":
            state = await reworkPlan(state, "Approved");
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
            state = await viewPlan(state, "Rejected");
            break;
          case "viewRejected":
            state = await viewSource(state, "Rejected");
            break;
          case "showNotes":
            state = await viewNote(state, "Rejected");
            break;
          case "reworkRejectedPlan":
            state = await reworkPlan(state, "Rejected");
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
            state = await targetState(state);
            break;
          case "listUnappliedChanges":
            state = await unappliedPlans(state);
            break;
          case "applyNextChange":
            state = await applyNextChange(state);
            break;
          case "applyAllChanges":
            screen.warningMsg(
              "Not Yet Implemented",
              "This feature has not yet been implemented"
            );
            break;
          case "rollbackLastChange":
            state = await rollbackLastChange(state);
            break;
          case "applyChange":
            state = await applyChange(state, "Approved");
            break;
          case "rollbackChange":
            state = await rollbackChange(state, "Approved");
            break;
          case "markApplied":
            state = await markPlanApplied(state);
            break;
          case "markRolledback":
            state = await markPlanRolledback(state);
            break;
          case "displayChangelog":
            state = await changeLog(state);
            break;
          case "selectDbTarget":
            state = await selectTarget(state);
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
          screen.warningMsg(
            "Not Implemented",
            "This function has not yet been implemented"
          );
          break;
        case "editApprovals": {
          await selectApprovalMethod(state);
          let files = await state.currentRepositoryDef().getStatus();
          let [appFile] = files.filter(f => f.path() === "approval.json");
          if (appFile && appFile.isModified()) {
            let repo = state.currentRepositoryDef();
            await repo.commit(
              [appFile],
              "Updated approval method",
              state.username(),
              state.email()
            );
            let branch = `${process.env.USER}-local`;
            await repo.gitRepo.mergeIntoMaster(
              branch,
              state.username(),
              state.email()
            );
          }
          break;
        }
        case "selectRepo":
          await selectRepository(state);
          await selectTarget(state);
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
                "Plan Management Menu",
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
                "Database Management Menu",
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
