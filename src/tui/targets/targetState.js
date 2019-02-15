"use strict";

const VError = require("verror");
const cliWidth = require("cli-width");
const Table = require("cli-table3");
const moment = require("moment");
const queries = require("../../database");
const screen = require("../utils/textScreen");

async function targetState(state) {
  const logName = "targetState";
  const width = cliWidth({defaultWidth: 80}) - 6;
  const fmt = "YYYY-MM-DD HH:mm";
  const fixedWidth = 18 + 10 + 12 + 30 + 10;
  const extraSpace = Math.floor((width - fixedWidth) / 2);
  const nameSize = parseInt(30 + extraSpace);
  const bySize = parseInt(10 + extraSpace);

  try {
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

module.exports = targetState;
