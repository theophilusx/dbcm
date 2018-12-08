"use strict";

const moduleName = "psql";

const VError = require("verror");
const { execFile } = require("child_process");
const path = require("path");
const chalk = require("chalk");

function psqlExec(state, script) {
  const logName = `${moduleName}.psqlExec`;

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
      let child = execFile(psql, args, {env: env, shell: true}, (err, stdout, stderr) => {
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
    default:
      throw new Error(`${logName} Unknown plan type: ${pType}`);
    }
    let changeFile = path.join(state.home(), state.currentRepository(), plan.change);
    console.log(`Applying change ${pName} (${pId})`);
    let [output, errors] = await psqlExec(state, changeFile);
    if (errors.length) {
      console.log(chalk.red("Plan failed to apply successfully!"), `\n`);
      console.log(errors);
      return false;
    } 
    console.log(chalk.green("Plan applied successfully"));
    console.log(output);
    return true;
  } catch (err) {
    throw new VError(err, `${logName} Failed to apply change`);
  }
}

module.exports = {
  psqlExec,
  applyCurrentPlan
};
