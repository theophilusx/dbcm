"use strict";

const VError = require("verror");
const selectPlan = require("./selectPlan");
const menu = require("../utils/textMenus");
const screen = require("../utils/textScreen");

async function deletePlan(state, group) {
  const logName = "deletePlan";

  try {
    let repo = state.currentRepositoryDef();
    let branch = `${process.env.USER}-local`;
    await repo.gitRepo.checkoutBranch(branch);
    let planChoices = state.changePlans().planGropupMap(group);
    let choice = await selectPlan(state, planChoices);
    if (choice) {
      let plan = state.planDef(choice);
      plan.textDisplay();
      let doDelete = await menu.confirmMenu(
        "Delete Plan",
        "Permanently delete this plan"
      );
      if (doDelete) {
        await state.deleteChangePlan(plan);
        await state.writeChangePlans();
        let msg = `Delete plan ${plan.name}`;
        await repo.commitAndMerge(branch, msg, state.username(), state.email());
      } else {
        screen.infoMsg("Cancelled", "Deletion of plan cancelled");
      }
    }
    return state;
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
}

module.exports = deletePlan;
