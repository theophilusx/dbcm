"use strict";

const moduleName = "textMenus";

const VError = require("verror");
const inquirer = require("inquirer");
const chalk = require("chalk");

function buildChoices(choiceData) {
  const logName = `${moduleName}.buildChoices`;

  try {
    let choices = [];
    for (let c of choiceData) {
      if (Array.isArray(c)) {
        choices.push({
          name: c[0],
          value: c[1]
        });
      } else {
        choices.push(c);
      }
    }
    choices.push(new inquirer.Separator());
    choices.push({
      name: "Leave menu",
      value: "exitMenu"
    });
    return choices;
  } catch (err) {
    throw new VError(err, `${logName} Failed to build choice list`);
  }
}

function displayMenu(title, question, actionFN) {
  const logName = `${moduleName}.displayMenu`;

  console.log(chalk.yellow(`\n\t${title}\n`));
  return inquirer.prompt(question)
    .then(actionFN)
    .catch(err => {
      throw new VError(err, `${logName} Failed to display menu ${title}`);
    });
}

function defaultAction(answer) {
  const logName = `${moduleName}.defaultAction`;

  try {
    let choice = answer.choice;
    return choice;
  } catch (err) {
    throw new VError(err, `${logName} Error in default menu action`);
  }
}

function displayListMenu(title, prompt, choices, actionFN = defaultAction) {
  const logName = `${moduleName}.displayListMenu`;

  let question = [{
    type: "list",
    name: "choice",
    choices: choices,
    message: prompt
  }];
  
  return displayMenu(title, question, actionFN)
    .catch(err => {
      throw new VError(err, `${logName} Failed to display list menu`);
    });
}

function doExit(choice) {
  if (choice === "exitMenu") {
    return true;
  }
  return false;
}

module.exports = {
  buildChoices,
  displayMenu,
  displayListMenu,
  doExit
};
