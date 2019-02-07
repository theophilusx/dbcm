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

  return inquirer.prompt(question)
    .then(actionFN)
    .catch(err => {
      throw new VError(err, `${logName} Error processing menu ${title}`);
    });
}


function listMenu(state, title, prompt, choices, actionFN) {
  const logName = `${moduleName}.listMenu`;

  function defaultAction(answer) {
    const logName = `${moduleName}.defaultAction`;

    try {
      return answer.choice;
    } catch (err) {
      screen.errorMsg(logName, err.message);
      return "";
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

function genericMenu(state, title, questions, actionFN) {
  const logName = `${moduleName}.displayGenricMenu`;

  function defaultAction(theState) {
    return answer => {
      try {
        theState.setMenuChoice(answer.choice);
        return theState;
      } catch (err) {
        screen.errorMsg(logName, err.message);
        return theState;
      }
    };
  }

  let fn = actionFN === undefined ? defaultAction : actionFN;
  screen.status(state);
  return doMenu(title, questions, fn(state))
    .catch(err => {
      throw new VError(err, `${logName} `);
    });
}

async function collectionMenu(title, questions) {
  try {
    questions.push({
      type: "confirm",
      name: "more",
      message: "Add another:"
    });
    let answers = {};
    let result = [];
    do {
      answers = await inquirer.prompt(questions);
      let tmpObj = {};
      for (let k of Object.keys(answers)) {
        if (k !== "more") {
          tmpObj[k] = answers[k];
        }
      }
      result.push(tmpObj);
    } while (answers.more);
    return result;
  } catch (err) {
    throw new Error(err.message);
  }
}

async function selectMenu(state, title, selectItems) {
  const logName = `${moduleName}.selectMenu`;

  try {
    let choices = buildChoices(selectItems);
    let question = [
      {
        type: "list",
        name: "choice",
        choices: choices,
        message: "Select item:"
      }
    ];
    screen.status(state);
    screen.menuHeading(title);
    let answer = await inquirer.prompt(question);
    return answer.choice;
  } catch (err) {
    throw new VError(err, `${logName} Failed to execute menu ${title}`);    
  }
}

async function confirmMenu(title, msg) {
  const logName = `${moduleName}.confirmMenu`;

  try {
    let answer = await inquirer.prompt([{
      type: "confirm",
      name: "choice",
      message: msg
    }]);
    return answer.choice;
  } catch (err) {
    throw new VError(err, `${logName} Failed to get confirmation choice`);
  }
}

function doExit(choice) {
  if (choice === undefined || choice === "exitMenu") {
    return true;
  }
  return false;
}

module.exports = {
  buildChoices,
  doMenu,
  listMenu,
  genericMenu,
  collectionMenu,
  selectMenu,
  confirmMenu,
  doExit
};
