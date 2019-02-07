"use strict";

const VError = require("verror");
const path = require("path");
const selectPlan = require("./selectPlan");
const edit = require("../edit");

async function editPlan(state) {
  const logName = "editPlan";
  let choice;
  
  try {
    [state, choice] = await selectPlan(state, "Development");
    if (choice) {
      let plan = state.currentPlanDef();
      let files = [
        path.join(state.home(), state.currentRepositoryName(), plan.change),
        path.join(state.home(), state.currentRepositoryName(), plan.verify),
        path.join(state.home(), state.currentRepositoryName(), plan.rollback)
      ];
      edit.editFiles(files);
    }
    return state;
  } catch (err) {
    throw new VError(err, `${logName} `);
  }
}

module.exports = editPlan;
