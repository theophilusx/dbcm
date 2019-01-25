"use strict";

const moduleName = "rejectUI";

const VError = require("verror");
const planui = require("./planUI");
const menu = require("./textMenus");
const inquirer = require("inquirer");
const screen = require("./textScreen");
const git = require("./git");
const plans = require("./plans");
const moment = require("moment");
const fse = require("fse");
const path = require("path");

async function rejectPlan(state) {
  const logName = `${moduleName}.rejectPlan`;

  try {
    let planId;
    [state, planId] = await planui.selectPlan(state, "pendingPlans");
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
    planui.displayPlanRecord(planDef);
    screen.infoMsg(
      "Rejection Notice",
      rejectMsg
    );
    answer = await inquirer.prompt([{
      type: "confirm",
      name: "doReject",
      message: "Reject this plan with this rejection notice:"
    }]);
    if (answer.doReject) {
      let repo = state.get("repoObject");
      await git.createBranch(repo, "reject");
      await repo.checkoutBranch("reject");
      let changeFile = path.join(
        state.home(),
        state.currentRepositoryName(),
        planDef.change
      );
      await fse.appendFile(changeFile, rejectMsg, {encoding: "utf-8"});
      state = plans.movePlanToRejected(state);
      await plans.writePlanFiles(state);
      await state.writeConfigFile();
      let changeFiles = await repo.getStatus();
      if (changeFiles.length) {
        let planDef = state.currentPlanDef();
        let commitMsg = `Committing rejection for change plan '${planDef.name}'`;
        await git.addAndCommit(state, changeFiles, commitMsg);
        await git.pullMaster(repo);
        await git.mergeBranchIntoMaster(state, "reject");
      } else {
        await git.deleteBranch(repo, "reject");        
      }
      screen.infoMsg("Plan Rejected", `The plan '${planDef.name}' has been rejected`);
    } else {
      screen.infoMsg("Rejection Cancelled", "The plan rejection was cancelled");
    }
    return state;
  } catch (err) {
    throw new VError(err, `${logName} `);
  }
}

module.exports = {
  rejectPlan
};
