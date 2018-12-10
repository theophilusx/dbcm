"use strict";

const moduleName = "repoUI";

const VError = require("verror");
const inquirer = require("inquirer");
const approvals = require("./approvals");
const menu = require("./textMenus");

function setup(state) {
  const logName = `${moduleName}.setup`;

  try {
    let repoChoices = [];
    for (let repo of state.repositories().keys()) {
      repoChoices.push(repo);
    }
    repoChoices.push(new inquirer.Separator());
    repoChoices.push({
      name: "Add new repository",
      value: "newRepository"
    });
    repoChoices.push({
      name: "Exit Menu",
      value: "exitMenu"
    });
    let questions = [
      {
        type: "list",
        name: "choice",
        message: "Select Change Repository:",
        choices: repoChoices
      },
      {
        type: "input",
        name: "newName",
        message: "Name for new repository:",
        when: answers => {
          return answers.choice === "newRepository";
        }
      },
      {
        type: "input",
        name: "newURL",
        message: "Git URL of repository:",
        when: answers => {
          return answers.choice === "newRepository";
        }
      },
      {
        type: "confirm",
        name: "hasApprover",
        message: "Do changes need to be approved:",
        when: answers => {
          return answers.choice === "newRepository";
        }
      },
      {
        type: "checkbox",
        name: "approvalType",
        choices: [
          {
            name: "Any single approver can approve change",
            value: "any"
          },
          {
            name: "All listed approvers must approve the change",
            value: "all"
          }
        ],
        message: "Single or group approval:",
        when: answers => {
          return answers.hasApprover;
        }
      }
    ];
    return questions;
  } catch (err) {
    throw new VError(err, `${logName} Failed to setup repository questions`);
  }
}

function repoAction(appState) {
  const logName = `${moduleName}.repoAction`;
  
  return async answers => {
    try {
      appState.setMenuChoice(answers.choice);
      if (answers.choice === "exitMenu") {
        return appState;
      } else if (answers.choice === "newRepository") {
        console.log("Adding new repository...");
        let repoMap = appState.repositories();
        repoMap.set(answers.newName, {
          url: answers.newURL,
          targets: new Map()
        });
        appState.setRepositories(repoMap);
        appState.setCurrentRepository(answers.newName);
        let approvalType = "none";
        let approverMap = new Map();
        if (answers.hasApprover) {
          approvalType = answers.approvalType;
          let approverQ = [
            {
              type: "input",
              name: "name",
              message: "Approver name:"
            },
            {
              type: "input",
              name: "email",
              message: "Approver email:"
            }
          ];
          let approverList = await menu.displayCollectionMenu("Approvers", approverQ);
          for (let a of approverList) {
            approverMap.set(a.email, a.name);
          }
          appState.setApprovalType(approvalType);
          appState.setApprovers(approverMap);
          await approvals.writeApprovalsFile(appState);
        }
      } else {
        appState.setCurrentRepository(answers.choice);
      }
      await appState.writeConfigFile();
      return appState;
    } catch (err) {
      throw new VError(err, `${logName} Failed processing menu actions`);

    }
  };
}

function selectRepository(state) {
  const logName = `${moduleName}.selectRepository`;
  let questions = setup(state);


  return menu.displayGenericMenu(state, "Repository Menu", questions, repoAction)
    .catch(err => {
      throw new VError(err, `${logName} `);
    });
}


module.exports = {
  selectRepository,
};
