"use strict";

const moduleName = "repoUI";

const VError = require("verror");
const inquirer = require("inquirer");
const menu = require("./textMenus");
const screen = require("./textScreen");
const Repository = require("../Repository");

function setupQuestions(state) {
  const logName = `${moduleName}.setup`;

  try {
    let repoChoices = state.repositoryNames();
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
        type: "list",
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
        message: "Approval Type:",
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
      if (menu.doExit(answers.choice)) {
        return appState;
      } else if (answers.choice === "newRepository") {
        let repo = new Repository(answers.newName, answers.newURL, appState.home());
        if (answers.hasApprover) {
          repo.setApprovalType(answers.approvalType);
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
          let approverList = await menu.collectionMenu(
            "Approvers",
            approverQ
          );
          repo.setApprovers(approverList);
        }
        appState.setRepository(repo);
        appState.setCurrentRepositoryName(answers.newName);
      } else {
        appState.setCurrentRepositoryName(answers.choice);
      }
      return appState;
    } catch (err) {
      screen.errorMsg(logName, err.message);
      return appState;
    }
  };
}

function selectRepository(state) {
  const logName = `${moduleName}.selectRepository`;
  let questions = setupQuestions(state);

  return menu.genericMenu(state, "Repository Menu", questions, repoAction)
    .catch(err => {
      throw new VError(err, `${logName} `);
    });
}


module.exports = {
  selectRepository,
};
