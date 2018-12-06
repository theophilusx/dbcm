"use strict";

const VError = require("verror");
const moduleName = "mainUI";
const menu = require("./textMenus");
const planui = require("./planUI");

const mainChoices = menu.buildChoices([
  ["Manage Change Sets", "manageSets"],
  ["Manage DB Targets", "manageTargets"]
]);

const setTypeChoices = menu.buildChoices([
  ["Development Change Sets", "developmentSets"],
  ["Pending Change Sets", "pendingSets"],
  ["Approved Change Sets", "approvedSets"]
]);

const developmentSetChoices = menu.buildChoices([
  ["Create New Change Set", "newSet"],
  ["Select Existing Development Change Set", "selectDevSet"],
  ["Test Current Change Set On Target", "testDevSet"],
  ["Commit Current Change Set for Approval", "commitSet"],
  ["List Development Change Sets", "listDevSets"]
]);

const pendingSetChoices = menu.buildChoices([
  ["List Pending Change Sets", "listPendingSets"],
  ["Approve Change Set", "approvePendingSet"],
  ["Reject Change Set", "rejectPendingSet"]
]);

const finalisedSetChoices = menu.buildChoices([
  ["List Finalised Change Sets", "listFinaliasedSets"],
  ["Rweork Finalised Change Set", "reworkFinalisedSet"]
]);

const dbTargetChoices = menu.buildChoices([
  ["List Applied Change Sets", "listAppliedChanges"],
  ["List Unapplied Change Sets", "listUnappliedChanges"],
  ["Apply Next Unapplied Change", "applyNextChange"],
  ["Apply All Unapplied Changes", "applyAllChanges"],
  ["Rollback Applied Change", "rollbackChange"],
  ["Display Change Log", "displayChangelog"],
  ["Select New Database Target", "selectDbTarget"] 
]);

function developmentSetActions(state) {
  const logName = "developmentSetActions";

  return async answer => {
    try {
      state.setMenuChoice(answer.choice);
      if (menu.doExit(answer.choice)) {
        return state;
      } else {
        switch (answer.choice) {
        case "newSet":
          state = await planui.createPlan(state);
          break;
        case "selectDevSet":
          console.log("select new dev set action");
          break;
        case "testDevSet":
          console.log("test a dev set");
          break;
        case "commitSet":
          console.log("commit set for approval");
          break;
        case "listDevSets":
          console.log("list dev sets");
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

function pendingSetActions(state) {
  const logName = "pendingSetActions";

  return async answer => {
    try {
      state.setMenuChoice(answer.choice);
      if (menu.doExit(answer.choice)) {
        return state;
      } else {
        switch (answer.choice) {
        case "listPendingSets":
          console.log("list pending set action");
          break;
        case "approvePendingSet":
          console.log("approve pending set action");
          break;
        case "rejectPendingSet":
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

function finalisedSetActions(state) {
  const logName = "finalisedSetActions";

  return async answer => {
    try {
      state.setMenuChoice(answer.choice);
      if (menu.doExit(answer.choice)) {
        return state;
      } else {
        switch (answer.choice) {
        case "listFinalisedSets":
          console.log("list finalised set action");
          break;
        case "reworkFinalisedSet":
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
        case "listAppliedchanges":
          console.log("list applied changes");
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

function setTypeAction(state) {
  const logName = "setTypeAction";

  return async answer => {
    try {
      state.setMenuChoice(answer.choice);
      if (menu.doExit(answer.choice)) {
        return state;
      } else {
        switch (answer.choice) {
        case "developmentSets":
          do {
            state = await menu.displayListMenu(
              state,
              "Development Set Menu",
              "Select Set Action",
              developmentSetChoices,
              developmentSetActions(state)
            );
          } while (!menu.doExit(state.menuChoice()));
          state.setMenuChoice("");
          break;
        case "pendingSets":
          do {
            state = await menu.displayListMenu(
              state,
              "Pending Set Menu",
              "Select Set Action",
              pendingSetChoices,
              pendingSetActions(state)
            );
          } while (!menu.doExit(state.menuChoice()));
          state.setMenuChoice("");
          break;
        case "approvedSets":
          do {
            state = await menu.displayListMenu(
              state,
              "Approved Set Menu",
              "Selet Set Action",
              finalisedSetChoices,
              finalisedSetActions(state)
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
        case "manageSets":
          do {
            state = await menu.displayListMenu(
              state,
              "Set Menu",
              "Select Change Set Group",
              setTypeChoices,
              setTypeAction(state)
            );
          } while (!menu.doExit(state.menuChoice()));
          state.setMenuChange("");
          break;
        case "manageTargets":
          do {
            state = await menu.displayListMenu(
              state,
              "Database Target Menu",
              "Select Target Action",
              dbTargetChoices,
              targetAction
            );
          } while (!menu.doExit(state.menuChoice()));
          state.setMenuChange("");
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
