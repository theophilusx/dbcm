"use strict";

const VError = require("verror");
const moduleName = "mainUI";
const inquirer = require("inquirer");

const mainChoices = [
  {
    name: "Manage change sets",
    value: "manageSets"
  },
  {
    name: "Manage targets",
    value: "manageTargets"
  },
  new inquirer.Separator(),
  {
    name: "Leave menu",
    value: "exitMenu"
  },
  {
    name: "Exit DBCM",
    value: "exitProgram"
  }
];

const setTypeChoice = [
  {
    name: "Pending Change Sets",
    value: "pendingSets"
  },
  {
    name: "Finalised Change Sets",
    value: "finalisedSets"
  },
  new inquirer.Separator(),
  {
    name: "Leave menu",
    value: "exitMenu"
  }
];

const pendingSetChoices = [
  {
    name: "Create new change set",
    value: "newSet"
  },
  {
    name: "Select change set",
    value: "selectSet"
  },
  {
    name: "Commit current change set updates",
    value: "commitSet"
  },
  {
    name: "Test current change set on target",
    value: "testSet"
  },
  {
    name: "Finalise current change set",
    value: "finaliseSet"
  },
  {
    name: "List pending change sets",
    value: "listPending"
  },
  new inquirer.Separator(),
  {
    name: "Leave menu",
    value: "exitMenu"
  }
];
  
const finalisedSetChoices = [
  {
    name: "List finalised changes",
    value: "listFinalised"
  },
  {
    name: "Rework change set",
    value: "reworkFinalised"
  },
  new inquirer.Separator(),
  {
    name: "Leave menu",
    value: "exitMenu"
  }
];

const targetChoices = [
  {
    name: "List applied changes",
    value: "listChanges"
  },
  {
    name: "List unapplied changes",
    value: "listUnapplied"
  },
  {
    name: "List target changelog",
    value: "listChangelog"
  },
  {
    name: "Apply outstanding changes to target",
    value: "applyChanges"
  },
  {
    name: "Rollback applied change on target",
    value: "rollbackChanges"
  },
  {
    name: "Selet new target",
    value: "selectNewTarget"
  },
  new inquirer.Separator(),
  {
    name: "Leave menu",
    value: "exitMenu"
  }
];

function mainMenu(appState) {
  const logName = `${moduleName}.mainMenu`;
  const questions = [
    // top level - choice
    {
      type: "list",
      name: "choice",
      choices: mainChoices
    },
    // level2a - setChoice
    {
      type: "list",
      name: "setChoice",
      choices: setTypeChoice,
      when: answers => {
        return answers.choice === "manageSets";
      }
    },
    // level2b - targetChoice
    {
      type: "list",
      name: "targetChoice",
      choices: targetChoices,
      when: answers => {
        return answers.choice === "manageTargets";
      }
    },
    // level3 - pendingSet
    {
      type: "list",
      name: "setAction",
      choices: pendingSetChoices,
      when: answers => {
        return answers.setChoice === "pendingSets";
      }
    },
    // level3 - finalisedSet
    {
      type: "list",
      name: "setAction",
      choices: finalisedSetChoices,
      when: answers => {
        return answers.setChoice === "finalisedSets";
      }
    }
  ];

  console.log(`Repository: ${appState.get("currentRepository")} / Target: ${appState.get("currentTarget")}`);
  console.log(`Current Change Set: ${appState.get("currentChangeSet")}`);
  console.log("");
  return inquirer.prompt(questions)
    .then(answers => {
      switch (answers.choice) {
      case "manageSets":
        switch (answers.setChoice) {
        case "pendingSets":
          switch (answers.setAction) {
          case "newSet":
          case "selectSet":
          case "commitSet":
          case "testSet":
          case "finaliseSet":
          case "listPending":
          case "exitMenu":
            return answers.setAction;
          default:
            console.log(`Unrecognised action: ${answers.setAction}`);
            return "exitMenu";
          }
        case "finalisedSets":
          switch (answers.setAction) {
          case "listFinalised":
          case "reworkFinalised":
          case "exitMenu":
            return answers.setAction;
          default:
            console.log(`Unrecognised action: ${answers.setAction}`);
            return "exitMenu";
          }
        case "exitMenu":
          console.log("Exit menu - setChoice");
          return "exitMenu";
        default:
          console.log(`Unrecognised value; ${answers.setChoice}`);
          return "exitMenu";
        }
      case "manageTargets":
        switch (answers.targetChoice) {
        case "listChanges":
        case "listUnapplied":
        case "listChangelog":
        case "applyChanges":
        case "rollbackChanges":
        case "selectNewTarget":
        case "exitMenu":
          return answers.targetChoice;
        default:
          console.log(`Unknown option - ${answers.targetChoice}`);
          return "exitMenu";
        }
      }
      console.log(`Should never get here - ${JSON.stringify(answers, null, " ")}`);
      return "exitMenu";
    })
    .catch(err => {
      throw new VError(err, `${logName} Failed to select choice`);
    });
}

module.exports = {
  mainMenu
};
