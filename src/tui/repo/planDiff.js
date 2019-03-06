"use strict";

const VError = require("verror");
const selectPlan = require("../plans/selectPlan");
const gitui = require("./gitUI");

async function planDiff(state, group) {
  const logName = "planDiff";

  try {
    let choice = await selectPlan(state, group);
    if (choice) {
      let repo = state.currentRepositoryDef();
      let plan = state.planDef(choice);
      let hist = await repo.gitRepo.fileHistory(plan.change);
      let diffList = await repo.gitRepo.fileDiff(hist[0].commit.sha());
      await gitui.displayDiff(diffList);
    }
    return state;
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
}

module.exports = planDiff;
