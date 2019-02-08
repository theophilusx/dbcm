"use strict";

const VError = require("verror");
const selectPlan = require("../plans/selectPlan");
const psql = require("../../psql");

async function applyChange(state, group) {
  const logName = "applyChange";
  let choice;
  
  try {
    [state, choice] = await selectPlan(state, group);
    if (choice) {
      let applied = await psql.applyPlan(state, state.planDef(choice));
      if (applied) {
        await psql.verifyPlan(state, state.planDef(choice));
      } else {                    // change plan applied with errors
        await psql.rollbackPlan(state, state.planDef(choice));
      }
    }
    return state;
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
}

module.exports = applyChange;
