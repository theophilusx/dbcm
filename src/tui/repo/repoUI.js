"use strict";

const moduleName = "repoUI";

const VError = require("verror");
const inquirer = require("inquirer");
const menu = require("../utils/textMenus");
const screen = require("../utils/textScreen");
const Repository = require("../../Repository");
const path = require("path");
const approversui = require("../approversUI");

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
      }];
    return questions;
  } catch (err) {
    throw new VError(err, `${logName} Failed to setup repository questions`);
  }
}

function repoAction(appState) {
  const logName = `${moduleName}.repoAction`;
  
  return async answers => {
    try {
      let branch = `${process.env.USER}-local`;
      appState.setMenuChoice(answers.choice);
      if (menu.doExit(answers.choice)) {
        return appState;
      }
      if (answers.choice === "newRepository") {
        let repo = new Repository(
          answers.newName,
          answers.newURL,
          path.join(appState.home(), answers.newName)
        );
        appState.setRepositoryDef(repo);
        appState.setCurrentRepositoryName(answers.newName);
        let type = await repo.initGit(branch, appState.username(), appState.email());
        if (type === "new") {
          // hve initialised a clean repo
          appState = await approversui.getApprovalConfig(appState);
          let files = await repo.gitRepo.getStatus();
          await repo.gitRepo.addCommit(
            files,
            "Initialise for DBCM",
            appState.username(),
            appState.email()
          );
          await repo.gitRepo.addReleaseTag("0.0.1", "Initial release");
          await repo.gitRepo.mergeIntoMaster(
            branch,
            appState.username(),
            appState.email()
          );
        }
      } else {
        appState.setCurrentRepositoryName(answers.choice);
        await appState.currentRepositoryDef().initGit(
          branch,
          appState.username(),
          appState.email()
        );
      }
      await appState.currentRepositoryDef().gitRepo.checkoutBranch(branch);
      await appState.currentRepositoryDef().readApprovers();
      await appState.readChangePlans();
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
