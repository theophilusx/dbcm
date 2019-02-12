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
    let rslt = await db.execSQL(target.params(), sql);
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
        + "WHERE status IN ('Applied', 'Verified', 'Failed') "
        + "ORDER BY applied_dt DESC";
  
  try {
    let rslt = await db.execSQL(target.params(), sql);
    let planList = [];
    let sequence = 0;
    for (let r of rslt.rows) {
      planList.push([
        `${r.plan_name} (${r.plan_id}) ${r.status}`,
        `${sequence}:${r.plan_id}`
      ]);
      sequence += 1;
    }
    return planList;
  } catch (err) {
    throw new VError(err, `${logName} Failed to build up plan candidate list`);
  }
}

async function getRollbackSets(target, pId) {
  const logName = `${moduleName}.getRollbackSets`;
  const sql = "SELECT plan_id, change_sha, applied_dt FROM dbcm.change_plans "
        + "WHERE applied_dt >= (SELECT applied_dt FROM dbcm.change_plans WHERE plan_id = $1) "
        + "AND status IN ('Applied', 'Verified', 'Failed') "
        + "ORDER BY applied_dt DESC";
  
  try {
    let rslt = await db.execSQL(target.params(), sql, [pId]);
    let result = [];
    for (let r of rslt.rows) {
      result.push([
        r.plan_id,
        r.change_sha
      ]);
    }
    return result;
  } catch (err) {
    throw new VError(err, `${logName} Failed to get rollback sets`);
  }
}

async function getAppliedPlans(target) {
  const logName = `${moduleName}.getAppliedPlans`;
  const sql = "SELECT plan_id, status, repository_version, "
        + "change_sha, applied_dt FROM dbcm.change_plans "
        + "WHERE status IN ('Applied', 'Verified') "
        + "ORDER BY applied_dt";
  
  try {
    let rslt = await db.execSQL(target.params(), sql);
    let result = [];
    for (let r of rslt.rows) {
      result.push({
        uuid: r.plan_id,
        status: r.status,
        version: r.repository_version,
        changeSHA: r.change_sha,
        appliedDate: moment(r.applied_dt).format("YYYY-MM-DD HH:mm:ss") 
      });
    }
    return result;
  } catch (err) {
    console.log(err.message);
    throw new VError(err, `${logName} Failed to get applied plans`);
  }
}

async function planExists(state, planId) {
  const logName = `${moduleName}.planExists`;
  const sql = "SELECT * FROM dbcm.change_plans "
        + "WHERE plan_id = $1";

  try {
    let target = state.currentTargetDef();
    let rslt = await db.execSQL(target.params(), sql, [planId]);
    if (rslt.rowCount) {
      return true;
    }
    return false;
  } catch (err) {
    throw new VError(err, `${logName} DB Error`);
  } 
}

async function updateAppliedPlanStatus(state, plan, status, sha) {
  const logName = `${moduleName}.updatePlanStatus`;
  const insertSQL = "INSERT INTO dbcm.change_plans "
        + "(plan_id, applied_by, plan_name, description, status, "
        + "plan_type, repository_version, change_sha) "
        + "VALUES ($1, $2, $3, $4, $5, $6, $7, $8)";
  const updateSQL = "UPDATE dbcm.change_plans "
        + "SET applied_by = $1, "
        + "applied_dt = current_timestamp, "
        + "status = $2, "
        + "plan_type = $3, "
        + "repository_version = $4, "
        + "change_sha = $5 "
        + "WHERE plan_id = $6";

  try {
    let target = state.currentTargetDef();
    let planKnown = await planExists(state, plan.uuid);
    let rowCount = 0;
    if (planKnown) {
      let rslt = await db.execSQL(target.params(), updateSQL, [
        state.email(),
        status,
        plan.planType,
        plan.version,
        sha,
        plan.uuid
      ]);
      rowCount = rslt.rowCount;
    } else {
      let rslt = await db.execSQL(target.params(), insertSQL, [
        plan.uuid,
        state.email(),
        plan.name,
        plan.description,
        status,
        plan.planType,
        plan.version,
        sha
      ]);
      rowCount = rslt.rowCount;
    }
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
    let rslt = await db.execSQL(target.params(), sql, [
      moment().format("YYYY-MM-DD HH:mm:ss"),
      state.email(),
      status,
      plan.uuid
    ]);
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
    let rslt = await db.execSQL(target.params(), sql, [
      moment().format("YYYY-MM-DD HH:mm:ss"),
      state.email(),
      status,
      plan.uuid
    ]);
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
    let rslt = await db.execSQL(target.params(), sql, [
      moment().format("YYYY-MM-DD HH:mm:ss"),
      plan.uuid,
      plan.name,
      msg
    ]);
    return rslt.rowCount;
  } catch (err) {
    throw new VError(err, `${logName} Failed to add log record`);
  }
}

async function getLogRecords(target) {
  const logName = `${moduleName}.getLogRecords`;
  const sql = "SELECT * FROM dbcm.change_log";
  
  try {
    let rslt = await db.execSQL(target.params(), sql);
    return rslt.rows;
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
}

module.exports = {
  getTargetState,
  getRollbackCandidates,
  getRollbackSets,
  getAppliedPlans,
  planExists,
  updateAppliedPlanStatus,
  updateVerifiedPlanStatus,
  updateRollbackPlanStatus,
  addLogRecord,
  getLogRecords
};
