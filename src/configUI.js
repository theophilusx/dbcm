"use strict";

const moduleName = "configUI";

const VError = require("verror");
const inquirer = require("inquirer");
const fse = require("fse");
const path = require("path");

function setup(config) {
  let questions = [{
    type: "input",
    name: "user.name",
    default: () => {
      if (config.user && config.user.name) {
        return config.user.name;
      }
    },
    message: "Your name:"
  },
  {
    type: "input",
    name: "user.email",
    default: () => {
      let user = process.env.USER;
      if (config.user && config.user.email) {
        return config.user.email;
      }
      return `${user}@une.edu.au`;
    },
    message: "Your email address:"
  },
  {
    type: "input",
    name: "dbcmHome",
    default: () => {
      if (config.dbcmHome) {
        return config.dbcmHome;
      }
      return `${process.env.HOME}/dbcm`;
    },
    message: "Where to put repositories:"
  }];
  return questions;
}

function getConfig(config) {
  const logName = `${moduleName}.getConfig`;
  const questions = setup(config);

  return inquirer.prompt(questions)
    .then(answers => {
      let newConfig = {
        user: answers.user,
        dbcmHome: answers.dbcmHome,
        dbRepositories: config.dbRepositories,
        dbTargets: config.dbTargets,
        version: "1.0.0"
      };
      return newConfig;
    })
    .catch(err => {
      throw new VError(err, `${logName} Failed to get config settings`);
    });
}

function writeConfig(config) {
  const logName = `${moduleName}.writeconfig`;
  const configPath = path.join(process.env.HOME, ".dbcmrc");

  return fse.writeFile(configPath, JSON.stringify(config, null, " "))
    .catch(err => {
      throw new VError(err, `${logName} Failed to save config file`);
    });
}

module.exports = {
  getConfig,
  writeConfig
};
