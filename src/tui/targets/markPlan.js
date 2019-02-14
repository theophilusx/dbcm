"use strict";

const VError = require("verror");
const selectPlan = require("../plans/selectPlan");
const menu = require("../utils/textMenus");
const queries = require("../../database");

async function markPlan(state, status) {
  const logName = "markPlan";
  let planId;

  try {
    [state, planId] = await selectPlan(state, "Approved");
    if (planId) {
      let plan = state.planDef(planId);
      plan.textDisplay();
      let doMark = await menu.confirmMenu(
        "Set Plan Status",
        `Set this plan to ${status} in DB ${state.currentTargetName()}`
      );
      if (doMark) {
        let planSHA = await state
          .currentRepositoryDef()
          .gitRepo.getChangeFileSHA(plan);
        await queries.updateAppliedPlanStatus(state, plan, status, planSHA);
        await queries.addLogRecord(
          state.currentTargetDef(),
          plan,
          `Plan ${plan.name} set to ${status} without physically being executed`
        );
      }
    }
    return state;
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
}

module.exports = markPlan;
