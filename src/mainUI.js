"use strict";

const VError = require("verror");
const moduleName = "mainUI";
const menu = require("./textMenus");
const planui = require("./planUI");
const path = require("path");
const edit = require("./edit");
const targetui = require("./targetUI");
const screen = require("./textScreen");

const mainChoices = menu.buildChoices([
  ["Manage Change Plans", "managePlans"],
  ["Manage DB Targets", "manageTargets"]
]);

const planTypeChoices = menu.buildChoices([
  ["Development Change Plans", "developmentPlans"],
  ["Pending Change Plans", "pendingPlans"],
  ["Approved Change Plans", "approvedPlans"]
]);

const developmentPlanChoices = menu.buildChoices([
  ["Create New Change Plan", "newPlan"],
  ["Select Development Plan", "selectDevPlan"],
  ["Edit Current Plan", "editPlan"],
  ["Test Current Change Plan", "testDevPlan"],
  ["Commit Current Change Plan for Approval", "commitPlan"],
  ["List Development Change Plans", "listDevPlans"]
]);

const pendingPlanChoices = menu.buildChoices([
  ["List Pending Change Plans", "listPendingPlans"],
  ["Approve Change Plan", "approvePendingPlan"],
  ["Reject Change Plan", "rejectPendingPlan"]
]);

const finalisedPlanChoices = menu.buildChoices([
  ["List Approved Change Plans", "listFinaliasedPlans"],
  ["Rweork Approved Change Plan", "reworkFinalisedPlan"]
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
        case "commitPlan":
          screen.heading("Submit Plan for Approval");
          break;
        case "listDevPlans":
          screen.heading("Development Plans");
          state = await planui.listPlans(state, "developmentPlans");
          break;
        default:
          console.log(`${logName} Unrecognised choice ${answer.choice}`);
          break;
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
          console.log("list pending set action");
          break;
        case "approvePendingPlan":
          console.log("approve pending set action");
          break;
        case "rejectPendingPlan":
          console.log("reject pending set action");
          break;
        default:
          console.log(`${logName} Unrecognised choice ${answer.choice}`);
          break;
        }
      }
      return state;
    } catch (err) {
      throw new VError(err, `${logName} Menu process failure`);
    }
  };
}

function finalisedPlanActions(state) {
  const logName = "finalisedPlanActions";

  return async answer => {
    try {
      state.setMenuChoice(answer.choice);
      if (menu.doExit(answer.choice)) {
        return state;
      } else {
        switch (answer.choice) {
        case "listFinalisedPlans":
          console.log("list finalised set action");
          break;
        case "reworkFinalisedPlan":
          console.log("rework finalised set action");
          break;
        default:
          console.log(`${logName} Unrecognised choice ${answer.choice}`);
          break;
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
          console.log("Listing Current Target State");
          state = await targetui.listTargetState(state);
          break;
        case "listUnappliedChanges":
          console.log("List unapplied changes");
          break;
        case "applyNextChange":
          console.log("apply next change");
          break;
        case "applyAllChanges":
          console.log("apply all outstanding changes");
          break;
        case "rollbackChange":
          console.log("rollback change");
          break;
        case "displayChangelog":
          console.log("display changelog");
          break;
        case "selectDbTarget":
          console.log("select DB target");
          break;
        default:
          console.log(`${logName} Unrecognised choice ${answer.choice}`);
          break;
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
              finalisedPlanChoices,
              finalisedPlanActions(state)
            );
          } while (!menu.doExit(state.menuChoice()));
          state.setMenuChoice("");
          break;
        default:
          console.log(`${logName} Unrecognised set type choice: ${answer.choice}`);
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
        default:
          console.log(`${logName} Unrecognised choice: ${answer.choice}`);
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
    appState.setMenuChoice("");
    return appState;
  } catch (err) {
    throw new VError(err, `${logName} Menu process failure`);
  }
}

module.exports = {
  mainMenu
};
