"use strict";

const VError = require("verror");
const selectPlan = require("../plans/selectPlan");
const psql = require("../../psql");
const menu = require("../utils/textMenus");

async function rollbackChange(state, group) {
  const logName = "rollbackChange";
  let choice;

  try {
    [state, choice] = await selectPlan(state, group);
    if (choice) {
      let plan = state.planDef(choice);
      plan.textDisplay();
      let doRollback = await menu.confirmMenu(
        "Rollback Change",
        "Rollback this change"
      );
      if (doRollback) {
        await psql.rollbackPlan(state, state.planDef(choice));
      }
    }
    return state;
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
}

module.exports = rollbackChange;
