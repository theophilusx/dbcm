"use strict";

const moduleName = "repoUI";

const VError = require("verror");
const inquirer = require("inquirer");
const state = require("./state");
const approvals = require("./approvals");

function setup(appState) {
  const logName = `${moduleName}.setup`;

  try {
    let repoChoices = [];
    for (let repo of appState.get("repositories").keys()) {
      repoChoices.push(repo);
    }
    repoChoices.push(new inquirer.Separator());
    repoChoices.push("Add new repository");
    repoChoices.push("Quit DBCM");
    let questions = [{
      type: "list",
      name: "repository",
      message: "Which Repository:",
      choices: repoChoices
    },
    {
      type: "input",
      name: "newName",
      message: "Name for new repository:",
      when: answers => {
        return answers.repository === "Add new database";
      }
    },
    {
      type: "input",
      name: "newURL",
      message: "Git URL of repository:",
      when: answers => {
        return answers.repository === "Add new database";
      }
    }];
    return questions;
  } catch (err) {
    throw new VError(err, `${logName} Failed to setup repository questions`);
  }
}

function selectRepository(appState) {
  const logName = `${moduleName}.selectRepository`;
  let questions = setup(appState);
  let quit = false;

  return inquirer.prompt(questions)
    .then(answers => {
      if (answers.repository === "Quit DBCM") {
        quit = true;
      } else if (answers.repository === "Add new repository") {
        let repoMap = appState.get("repositories");
        repoMap.set(answers.newName, answers.newURL);
        appState.set("repositories", repoMap);
        appState.set("currentRepository", answers.newName);
        return state.writeConfig(appState);
      } else {
        appState.set("currentRepository", answers.repository);
      }
      return answers;
    })
    .then(() => {
      return [appState, quit];
    })
    .catch(err => {
      throw new VError(err, `${logName} Failed to get repository selection`);
    });
}

function selectApprovers(appState) {
  const logName = `${moduleName}.selectApprovers`;
  const question = [
    {
      type: "confirm",
      name: "hasApprover",
      message: "Do changes need to be approved:"
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
      message: "Single or group approval:"
    }];
  let approvalType = "none";
  let approverMap = new Map();
  
  return inquirer.prompt(question)
    .then(async answers => {
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
          },
          {
            type: "confirm",
            name: "more",
            message: "Add another approver:"
          }];
        let more = true;
        while (more) {
          try {
            let ans = await inquirer.prompt(approverQ);
            approverMap.set(ans.email, ans.name);
            if (!ans.more) {
              more = false;
            }
          } catch (err) {
            throw new VError(err, `${logName} Failed selecting approvers`);
          }
        }
      }
      appState.set("approvalType", approvalType);
      appState.set("approvers", approverMap);
      await approvals.writeApprovalsFile(appState);
      return appState;
    })
    .catch(err => {
      throw new VError(err, `${logName} Failed getting approval settings`);
    });
}

module.exports = {
  selectRepository,
  selectApprovers
};
