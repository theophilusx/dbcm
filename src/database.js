"use strict";

const moduleName = "database";

const VError = require("verror");
const db = require("./db");

async function getAppliedChanges(state) {
  const logName = `${moduleName}.getAppliedchanges`;
  const sql = "SELECT * FROM dbcm.change_sets "
        + "WHERE status IN ('applied', 'verified')";
  
  try {
    let target = state.currentTargetDef();
    let client = db.getClient(target.database, target.host, target.port, target.user, target.password);
    await client.connect();
    let rslt = await db.execSQL(client, sql);
    client.end();
    if (rslt.rowCount) {
      return rslt.rows;
    }
    return [];
  } catch (err) {
    throw new VError(err, `${logName} DB Error`);
  } 
}

module.exports = {
  getAppliedChanges
};
