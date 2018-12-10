"use strict";

const moduleName = "textMenus";

const VError = require("verror");
const inquirer = require("inquirer");
const screen = require("./textScreen");

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

function doMenu(title, question, actionFN) {
  const logName = `${moduleName}.displayMenu`;

  screen.menuHeading(title);
  return inquirer.prompt(question)
    .then(actionFN)
    .catch(err => {
      throw new VError(err, `${logName} Error processing menu ${title}`);
    });
}


function displayListMenu(state, title, prompt, choices, actionFN) {
  const logName = `${moduleName}.displayListMenu`;

  function defaultAction(answer) {
    const logName = `${moduleName}.defaultAction`;

    try {
      state.setMenuChoice(answer.choice);
      return state;
    } catch (err) {
      throw new VError(err, `${logName} Error in default menu action`);
    }
  }

  let fn = actionFN || defaultAction;
  let question = [{
    type: "list",
    name: "choice",
    choices: choices,
    message: prompt
  }];

  screen.status(state);
  
  return doMenu(title, question, fn)
    .catch(err => {
      throw new VError(err, `${logName} Failed to display menu ${title}`);
    });
}

function displayGenericMenu(state, title, questions, actionFN) {
  const logName = `${moduleName}.displayGenricMenu`;

  function defaultAction(theState) {
    return answer => {
      try {
        theState.setMenuChoice(answer.choice);
        return theState;
      } catch (err) {
        throw new VError(err, `${logName} Error in default action function`);
      }
    };
  }

  let fn = actionFN || defaultAction;
  screen.status(state);
  return doMenu(title, questions, fn(state))
    .catch(err => {
      throw new VError(err, `${logName} `);
    });
}

async function displayCollectionMenu(title, questions) {
  try {
    questions.push({
      type: "confirm",
      name: "more",
      message: "Add another:"
    });
    screen.menuHeading(title);
    let answers = {};
    let result = [];
    do {
      answers = await inquirer.prompt(questions);
      result.push(answers);
    } while (answers.more);
    return result;
  } catch (err) {
    throw new Error(err.message);
  }
}

function doExit(choice) {
  if (choice === "exitMenu") {
    return true;
  }
  return false;
}

module.exports = {
  buildChoices,
  doMenu,
  displayListMenu,
  displayGenericMenu,
  displayCollectionMenu,
  doExit
};
