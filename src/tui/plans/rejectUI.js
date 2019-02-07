"use strict";

const moduleName = "rejectUI";

const VError = require("verror");
const menu = require("../utils/textMenus");
const inquirer = require("inquirer");
const screen = require("../utils/textScreen");
const moment = require("moment");
const fse = require("fse");
const path = require("path");
const selectPlan = require("./selectPlan");

async function rejectPlan(state) {
  const logName = `${moduleName}.rejectPlan`;

  try {
    let planId;
    [state, planId] = await selectPlan(state, "Pending");
    if (menu.doExit(planId)) {
      return state;
    }
    let question = [{
      type: "editor",
      name: "rejectMsg",
      message: "Enter explanation for why this plan was rejected:"
    }];
    let answer = await inquirer.prompt(question);
    let rejectMsg = `\n-- ${state.username()} <${state.email()}>`
        + `\n-- ${moment().format("YYYY-MM-DD HH:mm:ss")}`
        + `\n--\n-- ${answer.rejectMsg.split("\n").join("\n-- ")}`;
    let planDef = state.currentPlanDef();
    planDef.textDisplay();
    screen.heading("Rejection Notice");
    console.log(rejectMsg);
    answer = await inquirer.prompt([{
      type: "confirm",
      name: "doReject",
      message: "Reject this plan with this rejection notice:"
    }]);
    if (answer.doReject) {
      let branch = `${process.env.USER}-local`;
      let repo = state.currentRepositoryDef();
      await repo.gitRepo.checkoutBranch(branch);
      let changeFile = path.join(
        state.home(),
        state.currentRepositoryName(),
        planDef.change
      );
      await fse.appendFile(changeFile, rejectMsg, {encoding: "utf-8"});
      planDef.setType("Rejected");
      await state.writeChangePlans();
      await repo.commitAndMerge(
        branch,
        `Rejection of plan ${planDef.name}`,
        state.username(),
        state.email()
      );
      await repo.gitRepo.checkoutBranch(branch);
    }
    return state;
  } catch (err) {
    throw new VError(err, `${logName} `);
  }
}

module.exports = {
  rejectPlan
};
