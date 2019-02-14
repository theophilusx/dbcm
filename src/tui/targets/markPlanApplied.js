"use strict";

const VError = require("verror");
const selectPlan = require("../plans/selectPlan");
const menu = require("../utils/textMenus");
const queries = require("../../database");

async function markPlanApplied(state) {
  const logName = "markPlanApplied";
  let planId;

  try {
    [state, planId] = await selectPlan(state, "Approved");
    if (planId) {
      let plan = state.planDef(planId);
      plan.textDisplay();
      let doMark = await menu.confirmMenu(
        "Mark Plan Applied",
        `Mark this plan as applied in DB ${state.currentTargetName()}`
      );
      if (doMark) {
        let planSHA = await state
          .currentRepositoryDef()
          .gitRepo.getChangeFileSHA(plan);
        await queries.updateAppliedPlanStatus(state, plan, "Applied", planSHA);
      }
    }
    return state;
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
}

module.exports = markPlanApplied;
