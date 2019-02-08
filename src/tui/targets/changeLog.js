"use strict";

const VError = require("verror");
const cliWidth = require("cli-width");
const Table = require("cli-table3");
const moment = require("moment");
const query = require("../../database");

async function changeLog(state) {
  const logName = "changeLog";
  const width = cliWidth({defaultWidth: 80}) - 6;
  const col1Width = 25;
  const col2Width = width - col1Width;
  
  try {
    let table = new Table({colWidths: [col1Width, col2Width]});
    let data = await query.getLogRecords(state.currentTargetDef());
    for (let r of data) {
      table.push(
        [`Id: ${r.log_id}`,
         {rowSpan: 3, content: r.msg}],
        [moment(r.log_dt).format("YYYY-MM-DD HH:mm:ss")],
        [`Plan: ${r.plan_name}`]
      );
    }
    console.log(table.toString());
    return state;
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
}

module.exports = changeLog;
