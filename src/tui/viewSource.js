"use strict";

const VError = require("verror");
const menu = require("./textMenus");
const path = require("path");
const edit = require("../edit");
const selectPlan = require("./selectPlan");

async function viewSource(state, group) {
  const logName = "viewSource";
  let choice;
  
  try {
    [state, choice] = await selectPlan(state, group);
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
