"use strict";

const moduleName = "repoUI";

const VError = require("verror");
const inquirer = require("inquirer");

function selectRepository(config) {
  const logName = `${moduleName}.selectRepository`;
  const repoChoices = [];

  if (config.dbRepositories) {
    for (let db of Object.keys(config.dbRepositories)) {
      repoChoices.push(db);
    }
  }

  repoChoices.push(new inquirer.Separator());
  repoChoices.push("Add new database");
  repoChoices.push("Quit DBCM");

  const repoQuesiton = {
    type: "list",
    name: "repository",
    message: "What Database?",
    choices: repoChoices
  };

  const newRepoNameQuestion = {
    type: "input",
    name: "newName",
    message: "Name for new database repository?",
    when: answers => {
      return answers.repository === "Add new database";
    }
  };

  const newRepoUrl = {
    type: "input",
    name: "repoURL",
    message: "Git URL?",
    when: answers => {
      return answers.repository === "Add new database";
    }
  };

  return inquirer.prompt([
    repoQuesiton,
    newRepoNameQuestion,
    newRepoUrl
  ])
    .then(answers => {
      return answers;
    })
    .catch(err => {
      throw new VError(err, `${logName} Failed to get repository selection`);
    });
}

module.exports = {
  selectRepository
};
