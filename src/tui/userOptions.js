"use strict";

const moduleName = "userOptions";

const VError = require("verror");
const path = require("path");
const utils = require("../utils");
const inquirer = require("inquirer");

function setupQuestions(state) {
  const logName = `${moduleName}.setupQuestions`;
  
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

async function getOptions(state) {
  const logName = `${moduleName}.getUserOptions`;
  const questions = setupQuestions(state);

  try {
    let answers = await inquirer.prompt(questions);
    state.set("user", answers.user);
    state.set("home", answers.repositoryHome);
    state.set("psqlPath", answers.psqlPath);
    return state;
  } catch (err) {
    throw new VError(err, `${logName} Failed to get config settings`);
  }
}

module.exports = {
  setupQuestions,
  getOptions
};
