"use strict";

const VError = require("verror");
const screen = require("../utils/textScreen");
const menu = require("../utils/textMenus");
const selectPlan = require("./selectPlan");

async function submitPlan(state) {
  const logName = "submitPlan";
  let choice;
  
  try {
    [state, choice] = await selectPlan(state, "Development");
    if (choice) {
      if (choice !== state.currentPlanUUID()) {
        state.setCurrentPlanUUID(choice);
      }
      let branch = `${process.env.USER}-local`;
      let repo = state.currentRepositoryDef();
      await repo.gitRepo.checkoutBranch(branch);
      let plan = state.currentPlanDef();
      plan.textDisplay();
      let doSubmit = await menu.confirmMenu("Submit Plan", "Submit this plan for approval");
      if (doSubmit) {
        state.setCurrentPlanType("Pending");
        await state.writeChangePlans();
        await repo.commitAndMerge(
          branch,
          `Submitting plan ${plan.name} for approval`,
          state.username(),
          state.email()
        );
      } else {
        screen.infoMsg("Cancelled", "Plan approval submission cancelled");
      }
    }
    return state;
  } catch (err) {
    throw new VError(err, `${logName} Failed to move plan to pending gorup`);
  }
}

module.exports = submitPlan;

