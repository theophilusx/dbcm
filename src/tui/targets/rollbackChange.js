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
      if (choice !== state.currentPlanUUID()) {
        state.setCurrentPlanUUID(choice);
      }
      let plan = state.currentPlanDef();
      await psql.rollbackPlan(state, plan);
    }
    return state;    
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
}

module.exports = rollbackChange;
