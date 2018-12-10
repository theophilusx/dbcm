"use strict";

const moduleName = "psql";

const VError = require("verror");
const { execFile } = require("child_process");
const path = require("path");
const screen = require("./textScreen");
const query = require("./database");

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

async function applyCurrentPlan(state) {
  const logName = `${moduleName}.applyCurrentPlan`;

  try {
    if (state.currentPlan === "?:?:?") {
      throw new Error("No current plan defined");
    }
    let [pType, pName, pId] = state.currentPlan().split(":");
    let plan, status;
    switch (pType) {
    case "developmentPlans":
      plan = state.developmentPlans().get(pId);
      status = "Applied (Dev Test)";
      break;
    case "pendingPlans":
      plan = state.pendingPlans().get(pId);
      status = "Applied (Pending)";
      break;
    case "approvedPlans":
      plan = state.approvedPlans().get(pId);
      status = "Applied";
      break;
    default:
      throw new Error(`${logName} Unknown plan type: ${pType}`);
    }
    let changeFile = path.join(state.home(), state.currentRepository(), plan.change);
    let target = state.currentTargetDef();
    screen.heading("Apply Change");
    let [output, errors] = await psqlExec(state, changeFile);
    if (errors.length) {
      screen.errorMsg("Plan Failed to Apply Successfully", errors);
      await query.updateAppliedPlanStatus(state, plan, "Apply Failure");
      await query.addLogRecord(target, plan, errors);
      return false;
    } 
    screen.infoMsg("Plan Applied Successfully", output);
    await query.updateAppliedPlanStatus(state, plan, status);
    await query.addLogRecord(target, plan, output);
    return true;
  } catch (err) {
    throw new VError(err, `${logName} Failed to apply change`);
  }
}

module.exports = {
  psqlExec,
  applyCurrentPlan
};
