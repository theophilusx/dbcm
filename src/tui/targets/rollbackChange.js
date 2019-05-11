"use strict";

const VError = require("verror");
const selectPlan = require("../plans/selectPlan");
const psql = require("../../psql");
const menu = require("../utils/textMenus");

async function rollbackChange(state, group) {
  const logName = "rollbackChange";

  try {
    let definedPlans = state.changePlans().planGroupMap(group);
    let repo = state.currentRepositoryDef();
    let target = state.currentTargetDef();
    let planChoices = await target.appliedPlans(repo, definedPlans);
    console.log("planChoices");
    console.dir(planChoices);
    let choice = await selectPlan(state, planChoices);
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
    throw new VError(err, logName);
  }
}

module.exports = rollbackChange;
