"use strict";

const moduleName = "repoUI";

const VError = require("verror");
const inquirer = require("inquirer");
const menu = require("./textMenus");
const screen = require("./textScreen");
const Repository = require("../Repository");
const path = require("path");
const PlanMap = require("../PlanMap");

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
      }
      appState.saveRepoMetadata();
      if (answers.choice === "newRepository") {
        let repo = new Repository(
          answers.newName,
          answers.newURL,
          path.join(appState.home(), answers.newName)
        );
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
        await repo.initGit("setup");
        appState.setCurrentRepositoryName(answers.newName);
        await repo.writeApprovers();
        await repo.commitAndMerge(
          "setup",
          "Initial setup",
          appState.username(),
          appState.email()
        );
        appState.setChangePlans(new PlanMap);
      } else {
        appState.setCurrentRepositoryName(answers.choice);
        await appState.currentRepositoryDef().initGit();
        await appState.currentRepositoryDef().readApprovers();
        await appState.readChangePlans();
      }
      await appState.writeUserInit();
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
