"use strict";

const moduleName = "targetStateUI";

const VError = require("verror");
const screen = require("./textScreen");
const Table = require("cli-table3");
const queries = require("../database");
const psql = require("../psql");
const menu = require("./textMenus");

async function listUnappliedPlans(state) {
  const logName = `${moduleName}.listUnappliedPlans`;
  const table = new Table({
    head: ["Plan Name", "Version", "Description", "Author"],
    wordWrap: true
  });

  try {
    let repo = state.currentRepositoryDef();
    let target = state.currentTargetDef();
    let approvedPlans = state.changePlans().planGroupMap("Approved");
    let unappliedPlans = target.unappliedPlans(repo, approvedPlans);
    if (unappliedPlans.size) {
      for (let plan of unappliedPlans.values()) {
        table.push([
          plan.name,
          plan.approvalSHA(),
          plan.description,
          plan.author
        ]);
      }
      console.log(table.toString());
    } else {
      screen.infoMsg(
        "No Outstanding Changes",
        "There are no approved change plans needing to be applied to this target"
      );
    }
    return state;
  } catch (err) {
    throw new VError(err, `${logName} Failed to display unapplied plans`);
  }
}

async function applyNextChange(state) {
  const logName = `${moduleName}.applyNextChange`;

  try {
    let repo = state.currentRepositoryDef();
    let target = state.currentTargetDef();
    let approvedPlans = state.changePlans().planGroupMap("Approved");
    let unappliedPlans = target.unappliedPlans(repo, approvedPlans);
    if (unappliedPlans.size) {
      let plan = approvedPlans.values().next().value;
      plan.textDisplay();
      let choice = await menu.confirmMenu(
        "Apply Change Record",
        "Apply this change record:");
      if (choice) {
        state.setCurrentPlanUUID(plan.uuid);
        let applyStatus = await psql.applyCurrentPlan(state);
        if (applyStatus) {
          await psql.verifyCurrentPlan(state);
        } else {
          await psql.rollbackPlan(state, plan);
        }
      }
    } else {
      screen.infoMsg(
        "No Unapplied Plans",
        "There are no outstanding plans needing to be applied to this target"
      );
    }
    return state;
  } catch (err) {
    throw new VError(err, `${logName} Failed to apply next change plan`);
  }
}

module.exports = {
  listUnappliedPlans,
  applyNextChange
};
