"use strict";

const VError = require("verror");
const screen = require("../utils/textScreen");
const psql = require("../../psql");
const menu = require("../utils/textMenus");

async function applyNextChange(state) {
  const logName = "applyNextchange";

  try {
    let repo = state.currentRepositoryDef();
    let target = state.currentTargetDef();
    let approvedPlans = state.changePlans().planGroupMap("Approved");
    let unappliedPlans = await target.unappliedPlans(repo, approvedPlans);
    if (unappliedPlans.size) {
      let plan = unappliedPlans.values().next().value;
      plan.textDisplay();
      let choice = await menu.confirmMenu(
        "Apply Change Record",
        "Apply this change record:"
      );
      if (choice) {
        let applyStatus = await psql.applyPlan(state, plan);
        if (applyStatus) {
          await psql.verifyPlan(state, plan);
        } else {
          await psql.rollbackPlan(state, plan);
        }
      }
    } else {
      screen.infoMsg(
        "No Unapplied Plans",
        "There are no outstanding plans needing to be applied to this target"
      );
    }
    return state;
  } catch (err) {
    throw new VError(err, `${logName} Failed to apply next change plan`);
  }
}

module.exports = applyNextChange;
