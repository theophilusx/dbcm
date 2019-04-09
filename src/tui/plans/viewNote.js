"use strict";

const VError = require("verror");
const path = require("path");
const selectPlan = require("./selectPlan");
const edit = require("../../edit");

async function viewNote(state, group) {
  const logName = "viewNote";

  try {
    let planChoices = state.changePlans().planGroupMap(group);
    let choice = await selectPlan(state, planChoices);
    if (choice) {
      let plan = state.planDef(choice);
      let noteFile = path.join(
        state.home(),
        state.currentRepositoryName(),
        plan.doc
      );
      edit.openFile(noteFile);
    }
    return state;
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
}

module.exports = viewNote;
