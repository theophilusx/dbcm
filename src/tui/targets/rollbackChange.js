"use strict";

const VError = require("verror");
const selectPlan = require("../plans/selectPlan");
const psql = require("../../psql");

async function rollbackChange(state, group) {
  const logName = "rollbackChange";
  let choice;
  
  try {
    [state, choice] = await selectPlan(state, group);
    if (choice) {
      await psql.rollbackPlan(state, state.planDef(choice));
    }
    return state;    
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
}

module.exports = rollbackChange;
