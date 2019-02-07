"use strict";

const moduleName = "viewPlan";

const VError = require("verror");
const selectPlan = require("./selectPlan");

async function viewPlan(state, group) {
  const logName = `${moduleName}.viewPlan`;

  try {
    let choice;
    do {
      [state, choice] = await selectPlan(state, group);
      if (choice) {
        state.planDef().textDisplay();      
      }
    } while (choice);
    state.setMenuChoice("");
    return state;
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
}

module.exports = viewPlan;
