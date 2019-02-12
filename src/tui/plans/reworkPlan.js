"use strict";

const VError = require("verror");
const moment = require("moment");
const path = require("path");
const fse = require("fse");
const selectPlan = require("./selectPlan");
const menu = require("../utils/textMenus");
const screen = require("../utils/textScreen");
const createNote = require("./createNote");

async function reworkPlan(state, group) {
  const logName = "reworkPlan";
  let choice;
  
  try {
    let repo = state.currentRepositoryDef();
    let branch = `${process.env.USER}-local`;
    await repo.gitRepo.checkoutBranch(branch);
    [state, choice] = await selectPlan(state, group);
    if (choice) {
      let plan = state.planDef(choice);
      plan.textDisplay();
      let doRework = await menu.confirmMenu(
        "Rework Plan",
        "Move this plan to the development group for re-working"
      );
      if (doRework) {
        let currentType = plan.planType;
        plan.setType("Development");
        plan.resetApproval();
        let msg = `Plan ${plan.name} moved from ${currentType} to Development for re-working`;
        let doNote = await menu.confirmMenu(
          "Add Note",
          "Add a note about this re-work"
        );
        if (doNote) {
          await createNote(state, plan, "Re-Work Plan", "Add re-work note");
        } else {
          let noteMsg = `
## Re-Work Plan

- ${moment().format("YYYY-MM-DD HH:mm:ss")}
- ${state.username()} <${state.email()}>

${msg}

------
`;
          let noteFile = path.join(
            state.home(),
            state.currentRepositoryName(),
            plan.doc
          );
          await fse.appendFile(noteFile, noteMsg, {encoding: "utf-8"});
        }
        state.writeChangePlans();
        let files = await repo.getStatus();
        repo.commit(files, `Plan ${plan.name} ${msg}`, state.username(), state.email());
      } else {
        screen.infoMsg("Cancelled", "Re-working of plan cancelled");
      }
    }
    return state;
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
}

module.exports = reworkPlan;
