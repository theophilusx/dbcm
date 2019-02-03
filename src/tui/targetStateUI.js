"use strict";

const moduleName = "targetStateUI";

const VError = require("verror");
const moment = require("moment");
const screen = require("./textScreen");
const Table = require("cli-table3");
const cliWidth = require("cli-width");
const queries = require("../database");

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

async function listUnappliedPlans(state) {
  const logName = `${moduleName}.listUnappliedPlans`;
  const table = new Table({
    head: ["Plan Name", "Version", "Description", "Author"],
    wordWrap: true
  });

  try {
    let approvedPlans = state.changePlans().planGroupMap("Approved");
    let target = state.currentTargetDef();
    let appliedList = await queries.getAppliedPlans(target);
    for (let [pId, sha] of appliedList) {
      if (approvedPlans.has(pId)) {
        let plan = approvedPlans.get(pId);
        let currentSHA = await state.currentRepositoryDef().getChangeFileSHA(plan);
        if (sha === currentSHA) {
          approvedPlans.delete(pId);
        } else {
          console.log(`${plan.name} has changed and needs to be re-applied`);
        }
      }
    }
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

module.exports = {
  listTargetState,
  listUnappliedPlans 
};
