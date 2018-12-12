"use strict";

const moduleName = "database";

const VError = require("verror");
const db = require("./db");
const moment = require("moment");

async function getTargetState(state) {
  const logName = `${moduleName}.getTargetState`;
  const sql = "SELECT * FROM dbcm.change_plans "
        + "ORDER BY applied_dt";
  
  try {
    let target = state.currentTargetDef();
    let client = db.getClient(target);
    await client.connect();
    let rslt = await db.execSQL(client, sql);
    client.end();
    if (rslt.rowCount) {
      return rslt.rows;
    }
    return [];
  } catch (err) {
    throw new VError(err, `${logName} Failed to get current target state`);
  } 
}

async function getRollbackCandidates(target) {
  const logName = `${moduleName}.getRollbackCandidates`;
  const sql = "SELECT * FROM dbcm.change_plans "
        + "WHERE status NOT LIKE 'Rolled Back%' "
        + "AND status NOT LIKE 'Unknown%' "
        + "ORDER BY applied_dt DESC";
  
  try {
    let client = db.getclient(target);
    await client.connect();
    let rslt = await db.execSQL(client, sql);
    let planList = [];
    let sequence = 0;
    for (let r of rslt.rows) {
      planList.push([
        `${r.name} (${r.plan_id}) ${r.status}`,
        `${sequence}:${r.plan_id}`
      ]);
      sequence += 1;
    }
    await client.end();
    return planList;
  } catch (err) {
    throw new VError(err, `${logName} Failed to build up plan candidate list`);
  }
}

async function getRollbackSets(target, pId) {
  const logName = `${moduleName}.getRollbackSets`;
  const sql = "SELECT plan_id, applied_dt FROM dbcm.change_plans "
        + "WHERE applied_dt >= (SELECT applied_dt FROM dbcm.change_plans WHERE plan_id = $1) "
        + "AND status NOT LIKE 'Roll Back%' "
        + "AND status NOT LIKE `Unknown%` "
        + "ORDER BY applied_dt DESC";
  
  try {
    let client = db.getClient(target);
    await client.connect();
    let rslt = await db.execSQL(client, sql, [pId]);
    let result = [];
    for (let r of rslt.rows) {
      result.push(r.plan_id);
    }
    await client.end();
    return result;
  } catch (err) {
    throw new VError(err, `${logName} Failed to get rollback sets`);
  }
}

async function planExists(state, planId) {
  const logName = `${moduleName}.planExists`;
  const sql = "SELECT * FROM dbcm.change_plans "
        + "WHERE plan_id = $1";

  try {
    let target = state.currentTargetDef();
    let client = db.getClient(target);
    await client.connect();
    let rslt = await db.execSQL(client, sql, [planId]);
    client.end();
    if (rslt.rowCount) {
      return true;
    }
    return false;
  } catch (err) {
    throw new VError(err, `${logName} DB Error`);
  } 
}

async function updateAppliedPlanStatus(state, plan, status) {
  const logName = `${moduleName}.updatePlanStatus`;
  const insertSQL = "INSERT INTO dbcm.change_plans "
        + "(plan_id, applied_by, plan_name, description, status) "
        + "VALUES ($1, $2, $3, $4, $5)";
  const updateSQL = "UPDATE dbcm.change_plans "
        + "SET applied_by = $1, "
        + "status = $2 "
        + "WHERE plan_id = $3";

  try {
    let target = state.currentTargetDef();
    let client = db.getClient(target);
    await client.connect();
    let planKnown = await planExists(state, plan.uuid);
    let rowCount = 0;
    if (planKnown) {
      let rslt = await db.execSQL(client, updateSQL, [
        state.email(),
        status,
        plan.uuid
      ]);
      rowCount = rslt.rowCount;
    } else {
      let rslt = await db.execSQL(client, insertSQL, [
        plan.uuid,
        state.email(),
        plan.name,
        plan.description,
        status
      ]);
      rowCount = rslt.rowCount;
    }
    await client.end();
    return rowCount;
  } catch (err) {
    throw new VError(err, `${logName} Failed to record plan application state`);
  }
}

async function updateVerifiedPlanStatus(state, plan, status) {
  const logName = `${moduleName}.updateVerifiedPlanState`;
  const sql = "UPDATE dbcm.change_plans "
        + "SET verified_dt = $1, "
        + "verified_by = $2, "
        + "status = $3 "
        + "WHERE plan_id = $4";

  try {
    let planKnown = await planExists(state, plan.uuid);
    if (!planKnown) {
      throw new Error(`Plan ${plan.name} not known`);
    }
    let target = state.currentTargetDef();
    let client = db.getClient(target);
    await client.connect();
    let rslt = await db.execSQL(client, sql, [
      moment().format("YYYY-MM-DD HH:mm:ss"),
      state.email(),
      status,
      plan.uuid
    ]);
    await client.end();
    return rslt.rowCount;
  } catch (err) {
    throw new VError(err, `${logName} Failed to update verified status`);
  }
}

async function updateRollbackPlanStatus(state, plan, status) {
  const logName = `${moduleName}.updateRollbackPlanStatus`;
  const sql = "UPDATE dbcm.change_plans "
        + "SET rollback_dt = $1, "
        + "rollback_by = $2, "
        + "status = $3 "
        + "WHERE plan_id = $4";

  try {
    let planKnown = await planExists(state, plan.uuid);
    if (!planKnown) {
      throw new Error(`Plan ${plan.name} not known`);
    }
    let target = state.currentTargetDef();
    let client = db.getClient(target);
    await client.connect();
    let rslt = await db.execSQL(client, sql, [
      moment().format("YYYY-MM-DD HH:mm:ss"),
      state.email(),
      status,
      plan.uuid
    ]);
    await client.end();
    return rslt.rowCount;
  } catch (err) {
    throw new VError(err, `${logName} Failed updating rollback status`);
  }
}

async function addLogRecord(target, plan, msg) {
  const logName = `${moduleName}.addLogRecord`;
  const sql = "INSERT INTO dbcm.change_log "
        + "(log_dt, plan_id, plan_name, msg) "
        + "VALUES ($1, $2, $3, $4)";

  try {
    let client = db.getClient(target);
    await client.connect();
    let rslt = await db.execSQL(client, sql, [
      moment().format("YYYY-MM-DD HH:mm:ss"),
      plan.uuid,
      plan.name,
      msg
    ]);
    await client.end();
    return rslt.rowCount;
  } catch (err) {
    throw new VError(err, `${logName} Failed to add log record`);
  }
}

module.exports = {
  getTargetState,
  getRollbackCandidates,
  getRollbackSets,
  planExists,
  updateAppliedPlanStatus,
  updateVerifiedPlanStatus,
  updateRollbackPlanStatus,
  addLogRecord
};
