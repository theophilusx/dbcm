"use strict";

const moduleName = "repoUI";

const VError = require("verror");
const inquirer = require("inquirer");
const approvals = require("./approvals");

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
    let questions = [{
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
    }];
    return questions;
  } catch (err) {
    throw new VError(err, `${logName} Failed to setup repository questions`);
  }
}

function selectRepository(state) {
  const logName = `${moduleName}.selectRepository`;
  let questions = setup(state);

  return inquirer.prompt(questions)
    .then(answers => {
      state.setMenuChoice(answers.choice);
      if (answers.choice === "exitMenu") {
        return state;
      } else if (answers.choice === "newRepository") {
        console.log("adding new repository");
        let repoMap = state.repositories();
        repoMap.set(answers.newName, {
          url: answers.newURL,
          targets: new Map()
        });
        state.setRepositories(repoMap);
        state.setCurrentRepository(answers.newName);
        return state.writeConfig(state);
      } else {
        state.setCurrentRepository(answers.choice);
      }
      return state;
    })
    .then(() => {
      return state;
    })
    .catch(err => {
      throw new VError(err, `${logName} Failed to get repository selection`);
    });
}

function selectApprovers(state) {
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
      state.setApprovalType(approvalType);
      state.setApprovers(approverMap);
      await approvals.writeApprovalsFile(state);
      return state;
    })
    .catch(err => {
      throw new VError(err, `${logName} Failed getting approval settings`);
    });
}

module.exports = {
  selectRepository,
  selectApprovers
};
