"use strict";

const moduleName = "repoUI";

const VError = require("verror");
const inquirer = require("inquirer");
const state = require("./state");

function setup(appState) {
  const logName = `${moduleName}.setup`;

  try {
    let repoChoices = [];
    for (let repo of appState.get("repositories").keys()) {
        repoChoices.push(repo);
    }
    repoChoices.push(new inquirer.Separator());
    repoChoices.push("Add new database");
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
  let answers;
  
  return inquirer.prompt(questions)
    .then(ans => {
      answers = ans;
      if (answers.repository === "Quit DBCM") {
        quit = true;
      } else if (answers.repository === "Add new database") {
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

module.exports = {
  selectRepository
};
