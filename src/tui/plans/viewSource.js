"use strict";

const VError = require("verror");
const path = require("path");
const edit = require("../../edit");
const selectPlan = require("./selectPlan");

async function viewSource(state, group) {
  const logName = "viewSource";

  try {
    let planChoices = state.changePlans().planGroupMap(group);
    let choice = await selectPlan(state, planChoices);
    if (choice) {
      let plan = state.planDef(choice);
      let fileList = [
        path.join(state.home(), state.currentRepositoryName(), plan.change),
        path.join(state.home(), state.currentRepositoryName(), plan.verify),
        path.join(state.home(), state.currentRepositoryName(), plan.rollback)
      ];
      edit.viewFiles(fileList);
    }
    return state;
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
}

module.exports = viewSource;
