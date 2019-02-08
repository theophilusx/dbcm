"use strict";

const VError = require("verror");
const menu = require("../utils/textMenus");
const screen = require("../utils/textScreen");
const selectPlan = require("./selectPlan");
const createNote = require("./createNote");

async function rejectPlan(state) {
  const logName = "rejectPlan";

  try {
    let planId;
    [state, planId] = await selectPlan(state, "Pending");
    if (planId) {
      let plan = state.planDef(planId);
      plan.textDisplay();
      let doReject = await menu.confirmMenu("Reject Plan", "Reject this plan");
      if (doReject) {
        let branch = `${process.env.USER}-local`;
        let repo = state.currentRepositoryDef();
        await repo.gitRepo.checkoutBranch(branch);
        await createNote(
          state,
          plan,
          "Rejection Notice",
          "Enter reason for plan rejection"
        );
        plan.setType("Rejected");
        await state.writeChangePlans();
        await repo.commitAndMerge(
          branch,
          `Rejection of plan ${plan.name}`,
          state.username(),
          state.email()
        );
        await repo.gitRepo.checkoutBranch(branch);
      } else {
        screen.infoMsg("Rejection Cancelled", "Rejection of this plan was cancelled");
      }
    }
    return state;
  } catch (err) {
    throw new VError(err, `${logName} `);
  }
}

module.exports = rejectPlan;

