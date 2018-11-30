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
      if (answers.choice === "manageSets") {
        if (answers.setChoice === "pendingSets" || answers.setChoice === "finalisedSets") {
          return answers.setAction;
        } else {
          return answers.setChoice;
        }
      } else if (answers.choice === "manageTargets") {
        return answers.targetChoice;
      } else {
        return answers.choice;
      }
    })
    .catch(err => {
      throw new VError(err, `${logName} Failed to select choice`);
    });
}

module.exports = {
  mainMenu
};
