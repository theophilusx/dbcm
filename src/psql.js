"use strict";

const moduleName = "psql";

const VError = require("verror");
const { execFile } = require("child_process");
const path = require("path");
const screen = require("./tui/utils/textScreen");
const query = require("./database");

function filterUninterestingContent(str) {
  const logName = `${moduleName}.filterUninterestingContent`;

  function isInteresting(str) {
    if (str.match(/NOTICE:.*, skipping$/)) {
      return false;
    }
    return true;
  }
  
  try {
    let lines = str.split("\n");
    let filtered = lines.filter(l => isInteresting(l));
    if (filtered.length) {
      return filtered.join("\n");
    }
    return "";
  } catch (err) {
    throw new VError(err, `${logName} Failed to filter string`);
  }
}

function extractErrors(data) {
  const logName = `${moduleName}.extractErrors`;

  try {
    let lines = filterUninterestingContent(data).split("\n");
    let output = [];
    let matches;
    for (let l of lines) {
      if ((matches = l.match(/\/([^/]+.sql):(\d+):.*ERROR:(.*)$/))) {
        output.push(`${matches[1]} Line ${matches[2]} ${matches[3]}`);
      } else {
        output.push(l);
      }
    }
    return output.join("\n");
  } catch (err) {
    throw new VError(err, `${logName} `);
  }
}

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

async function applyPlan(state, plan, target) {
  const logName = `${moduleName}.applyPlan`;

  try {
    let changeFile = path.join(
      state.home(),
      state.currentRepositoryName(),
      plan.change
    );
    let sha = await state.currentRepositoryDef().gitRepo.getChangeFileSHA(plan);
    let [output, errors] = await psqlExec(state, changeFile);
    if (errors) {
      let filteredErrors = extractErrors(errors);
      if (filteredErrors.length) {
        screen.errorMsg("Plan Failed", filteredErrors);
        await query.updateAppliedPlanStatus(state, plan, "Failed", sha);
        await query.addLogRecord(target, plan, errors);
        return false;
      }
    }
    console.log(output);
    screen.infoMsg(
      "Plan Applied Successfully",
      `Plan ${plan.name} applied without error`);
    await query.updateAppliedPlanStatus(state, plan, "Applied", sha);
    await query.addLogRecord(target, plan, output);
    return true;
  } catch (err) {
    throw new VError(err, `${logName} Failed to apply change`);
  }
}

async function verifyPlan(state, plan, target) {
  const logName = `${moduleName}.verifyPlan`;

  try {
    let verifyFile = path.join(
      state.home(),
      state.currentRepositoryName(),
      plan.verify
    );
    let [output, errors] = await psqlExec(state, verifyFile);
    if (errors) {
      let filteredErrors = extractErrors(errors);
      if (filteredErrors.length) {
        screen.errorMsg("Verify Failure", filteredErrors);
        await query.addLogRecord(target, plan, errors);
        return false;
      }
    }
    console.log(output);
    screen.infoMsg(
      "Plan Verified",
      `Plan ${plan.name} verification script ran without errors`
    );
    await query.updateVerifiedPlanStatus(state, plan, "Verified");
    await query.addLogRecord(target, plan, output);
    return true;
  } catch (err) {
    throw new VError(err, `${logName} Failed to verify changes`);
  }
}

async function rollbackPlan(state, plan, target) {
  const logName = `${moduleName}.rollbackCurrentPlan`;

  try {
    let rollbackFile = path.join(
      state.home(),
      state.currentRepositoryName(),
      plan.rollback
    );
    let [output, errors] = await psqlExec(state, rollbackFile);
    if (errors) {
      let filteredErrors = extractErrors(errors);
      if (filteredErrors.length) {
        screen.errorMsg("Rollback Failure", filteredErrors);
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
    }
    console.log(output);
    screen.infoMsg(
      "Rollback Successful",
      `Plan ${plan.name} has been successfully rolled back`
    );
    await query.updateRollbackPlanStatus(state, plan, "Rolledback");
    await query.addLogRecord(target, plan, output);
    return true;
  } catch (err) {
    throw new VError(err, `${logName} Failed to execute rollback plan`);
  }
}

module.exports = {
  psqlExec,
  applyPlan,
  verifyPlan,
  rollbackPlan
};
