"use strict";

const moduleName = "psql";

const VError = require("verror");
const { execFile } = require("child_process");
const path = require("path");
const screen = require("./textScreen");
const query = require("./database");
const git = require("./git");

function psqlExec(state, script) {

  return new Promise((resolve, reject) => {
    try {
      let psql = state.psqlPath();
      let target = state.currentTargetDef();
      let env = {
        PGDATABASE: target.database,
        PGHOST: target.host,
        PGPORT: target.port,
        PGUSER: target.user,
        PGPASSWORD: target.password
      };
      let args = [
        `-f ${script}`,
        `${target.database}`
      ];
      let child = execFile(
        psql,
        args,
        {env: env, shell: true},
        (err, stdout, stderr) => {
          if (err) {
            reject(err.message);
          }
          resolve([stdout, stderr]);
        });
    } catch (err) {
      reject(err.message);
    }
  });
}

function getPlan(state) {
  const logName = `${moduleName}.getPlan`;

  try {
    if (state.currentPlan === "?:?:?") {
      throw new Error("No current plan defined");
    }
    let [pType, pName, pId] = state.currentPlan().split(":");
    let plan;
    switch (pType) {
    case "developmentPlans":
      plan = state.developmentPlans().get(pId);
      break;
    case "pendingPlans":
      plan = state.pendingPlans().get(pId);
      break;
    case "approvedPlans":
      plan = state.approvedPlans().get(pId);
      break;
    case "rejectedPlans":
      plan = state.rejectedPlans().get(pId);
      break;
    default:
      throw new Error(`Unknown plan type: ${pType}`);
    }
    return plan;
  } catch (err) {
    throw new VError(err, `${logName} Failed to get plan definition`);
  }
}

async function applyCurrentPlan(state) {
  const logName = `${moduleName}.applyCurrentPlan`;

  try {
    let plan = getPlan(state);
    let pType = state.currentPlan().split(":")[0];
    let changeFile = path.join(state.home(), state.currentRepository(), plan.change);
    let sha = await git.getChangesSha(state, plan);
    let target = state.currentTargetDef();
    screen.heading("Apply Change");
    let [output, errors] = await psqlExec(state, changeFile);
    if (errors.length) {
      screen.errorMsg("Plan Failed", errors);
      await query.updateAppliedPlanStatus(state, plan, "Failure", pType, sha);
      await query.addLogRecord(target, plan, errors);
      return false;
    } 
    screen.infoMsg("Plan Applied Successfully", output);
    await query.updateAppliedPlanStatus(state, plan, "Applied", pType, sha);
    await query.addLogRecord(target, plan, output);
    return true;
  } catch (err) {
    throw new VError(err, `${logName} Failed to apply change`);
  }
}

async function verifyCurrentPlan(state) {
  const logName = `${moduleName}.verifyCurrentPlan`;

  try {
    let plan = getPlan(state);
    let verifyFile = path.join(state.home(), state.currentRepository(), plan.verify);
    let target = state.currentTargetDef();
    screen.heading("Verify Change");
    let [output, errors] = await psqlExec(state, verifyFile);
    if (errors.length) {
      screen.errorMsg("Verify Failure", errors);
      await query.addLogRecord(target, plan, errors);
      return false;
    }
    screen.infoMsg("Plan Verified", output);
    await query.updateVerifiedPlanStatus(state, plan, "Verified");
    await query.addLogRecord(target, plan, output);
    return true;
  } catch (err) {
    throw new VError(err, `${logName} Failed to verify changes`);
  }
}

async function rollbackPlan(state, plan) {
  const logName = `${moduleName}.rollbackCurrentPlan`;

  try {
    let rollbackFile = path.join(state.home(), state.currentRepository(), plan.rollback);
    let target = state.currentTargetDef();
    screen.heading("Rollback Change");
    let [output, errors] = await psqlExec(state, rollbackFile);
    if (errors.length) {
      screen.errorMsg("Rollback Failure", errors);
      screen.warningMsg(
        "Unknown DB State",
        "Because the rollback script had errors, the state of the database is now uncertain\n"
          + "It is HIGHLY REOMMENDED that a manual inspection is performed and any necessary\n"
          + "manual actions are taken to ensure the database is in a consistent and known state\n"
        + "i.e. state is as would be expected prior to application of the current change plan"
      );
      await query.updateRollbackPlanStatus(state, plan, "Unknown");
      await query.addLogRecord(target, plan, errors);
      return false;
    } 
    screen.infoMsg("Rollback Successful", "Change successfully rolled back");
    await query.updateRollbackPlanStatus(state, plan, "Rolledback");
    await query.addLogRecord(target, plan, output);
    return true;
  } catch (err) {
    throw new VError(err, `${logName} Failed to execute rollback plan`);
  }
}

module.exports = {
  psqlExec,
  applyCurrentPlan,
  verifyCurrentPlan,
  rollbackPlan
};
