"use strict";

const VError = require("verror");
const selectPlan = require("../plans/selectPlan");
const menu = require("../utils/textMenus");
const queries = require("../../database");

// function unappliedPlansMap(approvedMap, appliedArray) {
//   for (let p of approvedMap.keys()) {
//     for (let a of appliedArray) {
//       if (p === a.uuid) {
//         approvedMap.delete(p);
//       }
//     }
//   }
//   return approvedMap;
// }

// function appliedPlansMap(approvedMap, appliedArray) {
//   let planMap = new Map();
//   for (let a of appliedArray) {
//     let plan = approvedMap.get(a.uuid);
//     if (plan) {
//       planMap.set(a.uuid, plan);
//     }
//   }
//   return planMap;
// }

async function buildPlanList(state, status) {
  const logName = "buildPlanList";

  try {
    let approvedPlans = state.changePlans().planGroupMap("Approved");
    let repo = state.currentRepositoryDef();
    let target = state.currentTargetDef();
    switch (status) {
      case "Applied":
        return target.unappliedPlans(repo, approvedPlans);
      case "Rolledback":
        return target.appliedPlans(repo, approvedPlans);
      default:
        console.log(`${logName}: default case`);
        return approvedPlans;
    }
  } catch (err) {
    throw new VError(err, logName);
  }
}

async function markPlan(state, status) {
  const logName = "markPlan";

  try {
    let planList = await buildPlanList(state, status);
    let planId = await selectPlan(state, planList);
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
