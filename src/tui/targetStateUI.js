"use strict";

const moduleName = "targetStateUI";

const VError = require("verror");
const moment = require("moment");
const screen = require("./textScreen");
const Table = require("cli-table3");
const cliWidth = require("cli-width");
const queries = require("../database");
const psql = require("../psql");
const menu = require("./textMenus");

async function listTargetState(state) {
  const logName = `${moduleName}.listTargetState`;
  const width = cliWidth({defaultWidth: 80}) - 6;
  const fmt = "YYYY-MM-DD HH:mm";
  
  try {
    let fixedWidth = 18 + 10 + 12 + 30 + 10;
    let extraSpace = Math.floor((width - fixedWidth) / 2);
    let nameSize = parseInt(30 + extraSpace);
    let bySize = parseInt(10 + extraSpace);
    console.log(`width: ${width} Fixed: ${fixedWidth} extra: `
                + `${extraSpace} Name: ${nameSize} By: ${bySize}`);
    const table = new Table({
      head: ["Applied Date", "Plan Name", "Version", "Status", "Applied By"],
      colWidths: [18, nameSize, 10, 12, bySize]
    });
    let targetState = await queries.getTargetState(state);
    if (targetState.length) {
      for (let t of targetState) {
        table.push([
          moment(t.applied_dt).format(fmt),
          t.plan_name,
          t.repository_version,
          t.status,
          t.applied_by
        ]);
      }
      console.log(table.toString());
    } else {
      screen.infoMsg(
        "No Applied Changes",
        "There has been no changes applied to this target"
      );
    }
    return state;
  } catch (err) {
    throw new VError(err, `${logName} Failed to get applied changes`);
  }
}

async function getUnappliedPlans(state, type) {
  const logName = `${moduleName}.getUnappliedPlans`;

  try {
    let repo = state.currentRepositoryDef();
    let planMap = state.changePlans().planGroupMap(type);
    let target = state.currentTargetDef();
    let appliedList = await queries.getAppliedPlans(target);
    for (let [pId, sha] of appliedList) {
      if (planMap.has(pId)) {
        let plan = planMap.get(pId);
        let currentSHA = await repo.gitRepo.getChangeFileSHA(plan);
        if (sha === currentSHA) {
          planMap.delete(pId);
        }
      }
    }
    return planMap;
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
}

async function listUnappliedPlans(state) {
  const logName = `${moduleName}.listUnappliedPlans`;
  const table = new Table({
    head: ["Plan Name", "Version", "Description", "Author"],
    wordWrap: true
  });

  try {
    let approvedPlans = await getUnappliedPlans(state, "Approved");
    if (approvedPlans.size) {
      for (let plan of approvedPlans.values()) {
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
    let approvedPlans = await getUnappliedPlans(state, "Approved");
    if (approvedPlans.size) {
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
  listTargetState,
  listUnappliedPlans,
  applyNextChange
};
