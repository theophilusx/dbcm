"use strict";

const VError = require("verror");
const selectPlan = require("./selectPlan");

async function viewPlan(state, group) {
  const logName = "viewPlan";

  try {
    let planChoices = state.changePlans().planGroupMap(group);
    let choice;
    do {
      choice = await selectPlan(state, planChoices);
      if (choice) {
        state.planDef(choice).textDisplay();
      }
    } while (choice);
    state.setMenuChoice("");
    return state;
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
}

module.exports = viewPlan;
