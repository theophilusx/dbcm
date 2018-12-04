"use strict";

const VError = require("verror");
const moduleName = "mainUI";
const inquirer = require("inquirer");
const menu = require("./textMenus");

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

async function developmentSetAction(answer) {
  const logName = `${moduleName}.developmentSetAction`;

  try {
    let choice = answer.choice;
    if (menu.doExit(choice)) {
      return choice;
    } else {
      switch (choice) {
      case "newSet":
        console.log("new set action");
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
        console.log(`Unrecognised choice ${choice}`);
        break;
      }
    }
    return choice;
  } catch (err) {
    throw new VError(err, `${logName} Failed to display development set menu`);
  }
}

function pendingSetAction(answer) {
  const logName = `${moduleName}.pendingSetAction`;

  try {
    let choice = answer.choice;
    if (menu.doExit(choice)) {
      return choice;
    } else {
      switch (choice) {
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
        console.log(`Unrecognised choice ${choice}`);
        break;
      }
    }
    return choice;
  } catch (err) {
    throw new VError(err, `${logName} Failed to display pending set menu`);
  }
}

function finalisedSetAction(answer) {
  const logName = `${moduleName}.finalisedSetActions`;

  try {
    let choice = answer.choice;
    if (menu.doExit(choice)) {
      return choice;
    } else {
      switch (choice) {
      case "listFinalisedSets":
        console.log("list finalised set action");
        break;
      case "reworkFinalisedSet":
        console.log("rework finalised set action");
        break;
      default:
        console.log(`Unrecognised choice ${choice}`);
        break;
      }
    }
    return choice;
  } catch (err) {
    throw new VError(err, `${logName} Failed to display finalised set menu`);
  }
}

function targetAction(answer) {
  const logName = `${moduleName}.targetAction`;

  try {
    let choice = answer.choice;
    if (menu.doExit(choice)) {
      return choice;
    } else {
      switch (choice) {
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
        console.log(`Unrecognised choice ${choice}`);
        break;
      }
    }
    return choice;
  } catch (err) {
    throw new VError(err, `${logName} Failed to display target menu`);
  }
}

async function setTypeAction(answer) {
  const logName = `${moduleName}.setAction`;

  try {
    let choice = answer.choice;
    if (menu.doExit(choice)) {
      return choice;
    } else {
      switch (choice) {
      case "developmentSets":
        do {
          choice = await menu.displayListMenu(
            "Development Set Menu",
            "Select Set Action",
            developmentSetChoices,
            developmentSetAction
          );
        } while (!menu.doExit(choice));
        break;
      case "pendingSets":
        do {
          choice = await menu.displayListMenu(
            "Pending Set Menu",
            "Select Set Action",
            pendingSetChoices,
            pendingSetAction
          );
        } while (!menu.doExit(choice));
        break;
      case "approvedSets":
        do {
          choice = await menu.displayListMenu(
            "Approved Set Menu",
            "Selet Set Action",
            finalisedSetChoices,
            finalisedSetAction
          );
        } while (!menu.doExit(choice));
        break;
      default:
        console.log(`Unrecognised set type choice: ${choice}`);
      }
    }
    return choice;
  } catch (err) {
    throw new VError(err, `${logName} Error in set type choice`);
  }
}

async function mainAction(answer) {
  const logName = `${moduleName}.mainAction`;

  try {
    let choice = answer.choice;
    if (menu.doExit(choice)) {
      return choice;
    } else {
      switch (choice) {
      case "manageSets":
        do {
          choice = await menu.displayListMenu(
            "Set Menu",
            "Select Change Set Group",
            setTypeChoices,
            setTypeAction
          );
        } while (!menu.doExit(choice));
        break;
      case "manageTargets":
        do {
          choice = await menu.displayListMenu(
            "Database Target Menu",
            "Select Target Action",
            dbTargetChoices,
            targetAction
          );
        } while (!menu.doExit(choice));
        break;
      default:
        console.log(`Unrecognised choice: ${choice}`);
      }
    }
    return choice;
  } catch (err) {
    throw new VError(err, `${logName} Failed to run main menu action`);
  }
}

async function mainMenu() {
  const logName = `${moduleName}.mainMenu`;

  try {
    let choice;
    do {
      choice = await menu.displayListMenu(
        "Main Menu",
        "Select Action",
        mainChoices,
        mainAction
      );
    } while (choice != "exitMenu" && choice != "exitProgram");
    return choice;
  } catch (err) {
    throw new VError(err, `${logName} Main menu failure`);
  }
}

module.exports = {
  mainMenu
};
