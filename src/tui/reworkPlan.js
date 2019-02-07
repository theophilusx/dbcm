"use strict";

const VError = require("verror");
const moment = require("moment");
const path = require("path");
const fse = require("fse");
const selectPlan = require("./selectPlan");
const menu = require("./textMenus");
const screen = require("./textScreen");

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
        let plan = state.planDef(choice);
        let currentType = plan.planType;
        plan.setType("Development");
        plan.resetApproval();
        let msg = `moved from ${currentType} to Development for re-working by\n`
            + `${state.username()} on ${moment().format("YYYY-MM-DD HH:mm:ss")}`;
        let changeFile = path.join(
          state.home(),
          state.currentRepositoryName(),
          plan.change
        );
        await fse.appendFile(
          changeFile,
          `\n-- ${msg.split("\n").join("\n-- ")}\n`,
          {encoding: "utf-8"}
        );
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
