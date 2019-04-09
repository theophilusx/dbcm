"use strict";

const VError = require("verror");
const selectPlan = require("../plans/selectPlan");
const gitui = require("./gitUI");

async function commitHistory(state, group) {
  const logName = "commitHistory";

  try {
    let planChoices = state.changePlans().planGroupMap(group);
    let choice = await selectPlan(state, planChoices);
    if (choice) {
      let repo = state.currentRepositoryDef();
      let plan = state.planDef(choice);
      let hist = await repo.gitRepo.fileHistory(plan.change);
      gitui.displayCommitHistory(hist);
    }
    return state;
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
}

module.exports = commitHistory;
