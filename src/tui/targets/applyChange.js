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
      if (choice !== state.currentPlanUUID()) {
        state.setCurrentPlanUUID(choice);
      }
      let applied = await psql.applyCurrentPlan(state);
      if (applied) {
        await psql.verifyCurrentPlan(state);
      } else {                    // change plan applied with errors
        let changePlan = state.currentPlanDef();
        await psql.rollbackPlan(state, changePlan);
      }
    }
    return state;
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
}

module.exports = applyChange;
