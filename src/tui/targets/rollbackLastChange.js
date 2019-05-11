"use strict";

const VError = require("verror");
const menu = require("../utils/textMenus");
const psql = require("../../psql");

async function rollbackLastChange(state) {
  const logName = "rollbackLastChange";

  try {
    let target = state.currentTargetDef();
    let appliedPlans = await target.dbAppliedPlans();
    let lastPlan = appliedPlans.pop();
    let plan = state.planDef(lastPlan.uuid);
    plan.textDisplay();
    let doRollback = await menu.confirmMenu(
      "Rollback Change",
      "Rollback this plan"
    );
    if (doRollback) {
      await psql.rollbackPlan(state, plan);
    }
    return state;
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
}

module.exports = rollbackLastChange;
