"use strict";

const moduleName = "configUI";

const VError = require("verror");
const inquirer = require("inquirer");
const path = require("path");
const utils = require("./utils");

function setup(state) {
  const logName = `${moduleName}.setup`;
  
  try {
    let questions = [
      {
        type: "input",
        name: "user.name",
        default: () => {
          return state.username();
        },
        message: "Your name:"
      },
      {
        type: "input",
        name: "user.email",
        default: () => {
          return state.email() || `${process.env.USER}@une.edu.au`;
        },
        message: "Your email address:"
      },
      {
        type: "input",
        name: "repositoryHome",
        default: () => {
          return state.home() || `${path.join(process.env.HOME, "dbcm")}`;
        },
        message: "Where to put repositories:"
      },
      {
        type: "input",
        name: "psqlPath",
        default: () => {
          return utils.which("psql");
        }
      }
    ];
    return questions;
  } catch (err) {
    throw new VError(err, `${logName} Failed to setup config questions`);
  }
}

function getConfig(state) {
  const logName = `${moduleName}.getConfig`;
  const questions = setup(state);
  return inquirer.prompt(questions)
    .then(answers => {
      state.set("user", answers.user);
      state.set("home", answers.repositoryHome);
      state.set("psqlPath", answers.psqlPath);
      return state.writeConfigFile();
    })
    .then(() => {
      return state;
    })
    .catch(err => {
      throw new VError(err, `${logName} Failed to get config settings`);
    });
}

module.exports = {
  getConfig
};
