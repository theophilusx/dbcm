"use strict";

const VError = require("verror");
const Table = require("cli-table3");
const screen = require("../utils/textScreen");
const cliWidth = require("cli-width");

async function unappliedPlans(state) {
  const logName = "unappliedPlans";
  const width = cliWidth({defaultWidth: 80}) - 6;
  const nameWidth = 20;
  const verWidth = 9;
  const authorWidth = 20;
  const descWidth = width - nameWidth - verWidth - authorWidth;
  const table = new Table({
    head: ["Plan Name", "Version", "Description", "Author"],
    colWidths: [nameWidth, verWidth, descWidth, authorWidth],
    wordWrap: true
  });

  try {
    let repo = state.currentRepositoryDef();
    let target = state.currentTargetDef();
    let approvedPlans = state.changePlans().planGroupMap("Approved");
    let unappliedPlans = await target.unappliedPlans(repo, approvedPlans);
    if (unappliedPlans.size) {
      for (let plan of unappliedPlans.values()) {
        table.push([plan.name, plan.version, plan.description, plan.author]);
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
    throw new VError(err, `${logName}`);
  }
}

module.exports = unappliedPlans;
