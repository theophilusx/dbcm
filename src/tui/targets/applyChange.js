"use strict";

const VError = require("verror");
const selectPlan = require("../plans/selectPlan");
const psql = require("../../psql");
const menu = require("../utils/textMenus");

async function applyChange(state, group) {
  const logName = "applyChange";

  try {
    let choice = await selectPlan(state, group);
    if (choice) {
      let plan = state.planDef(choice);
      plan.textDisplay();
      let doApply = await menu.confirmMenu("Apply Change", "Apply this change");
      if (doApply) {
        let applied = await psql.applyPlan(state, state.planDef(choice));
        if (applied) {
          await psql.verifyPlan(state, state.planDef(choice));
        } else {
          // change plan applied with errors
          let doRollback = await menu.confirmMenu(
            "Rollback Plan",
            "Change encountered errors. Do you want to roll it back"
          );
          if (doRollback) {
            await psql.rollbackPlan(state, state.planDef(choice));
          }
        }
      }
    }
    return state;
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
}

module.exports = applyChange;
