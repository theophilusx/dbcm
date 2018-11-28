"use strict";

const moduleName = "configUI";

const VError = require("verror");
const inquirer = require("inquirer");
const path = require("path");
const state = require("./state");

function setup(appState) {
  let questions = [{
    type: "input",
    name: "user.name",
    default: () => {
      return appState.get("user").name;
    },
    message: "Your name:"
  },
  {
    type: "input",
    name: "user.email",
    default: () => {
      return appState.get("user").email || `${process.env.USER}@une.edu.au`;
    },
    message: "Your email address:"
  },
  {
    type: "input",
    name: "repositoryHome",
    default: () => {
      return appState.get("home") || `${path.join(process.env.HOME, "dbcm")}`;
    },
    message: "Where to put repositories:"
  }];
  return questions;
}

function getConfig(appState) {
  const logName = `${moduleName}.getConfig`;
  const questions = setup(appState);

  return inquirer.prompt(questions)
    .then(answers => {
      appState.set("user", answers.user);
      appState.set("home", answers.repositoryHome);
      return state.writeConfig(appState);
    })
    .then(() => {
      return appState;
    })
    .catch(err => {
      throw new VError(err, `${logName} Failed to get config settings`);
    });
}

module.exports = {
  getConfig
};
