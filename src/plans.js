"use strict";

const moduleName = "plans";

const VError = require("verror");
const short = require("short-uuid");
const path = require("path");
const moment = require("moment");
const fse = require("fse");
const git = require("./git");
const files = require("./files");

function planObjectToMap(pobj) {
  const logName = `${moduleName}.planObjectToMap`;

  try {
    let plans = pobj.plans;
    let planMap = new Map();
    for (let p of plans) {
      planMap.set(p.uuid, p);
    }
    return planMap;
  } catch (err) {
    throw new VError(err, `${logName} Failed to convert plan object to map`);
  }
}

function planMapToObject(pmap, name) {
  const logName = `${moduleName}.planMapToObject`;

  try {
    let plans = [];
    for (let p of pmap.keys()) {
      plans.push(pmap.get(p));
    }
    let planObj = {
      name: name,
      version: "1.0.0",
      plans: plans
    };
    return planObj;
  } catch (err) {
    throw new VError(err, `${logName} Failed to create plan object from plan map`);
  }
}

function readPlanFile(planFile) {
  const logName = `${moduleName}.readPlanFile`;
  
  return fse.readJson(planFile)
    .catch(err => {
      throw new VError(err, `${logName} Failed to read plan file ${planFile}`);
    });
}

function readApprovedPlans(state) {
  const logName = `${moduleName}.readApprovedPlans`;
  const planFile = path.join(state.home(), state.currentRepository(), "approved-plans.json");

  return readPlanFile(planFile)
    .catch(err => {
      throw new VError(err, `${logName} Failed to read plan file for ${state.currentRepository}`);
    });
}

function readPendingPlans(state) {
  const logName = `${moduleName}.readPendingPlans`;
  const planFile = path.join(state.home(), state.currentRepository(), "pending-plans.json");
  
  return readPlanFile(planFile)
    .catch(err => {
      throw new VError(err, `${logName} Failed to read pending plan file for ${state.currentRepository}`);
    });
}

function readDevelopmentPlans(state) {
  const logName = `${moduleName}.readPendingPlans`;
  const planFile = path.join(state.home(), state.currentRepository(), "development-plans.json");
  
  return readPlanFile(planFile)
    .catch(err => {
      throw new VError(err, `${logName} Failed to read pending plan file for ${state.currentRepository}`);
    });
}

function readPlanFiles(state) {
  const logName = `${moduleName}.initPlans`;

  return readApprovedPlans(state)
    .then(planData => {
      let plansMap = planObjectToMap(planData);
      state.setApprovedPlans(plansMap);
      return readPendingPlans(state);
    })
    .then(planData => {
      let plansMap = planObjectToMap(planData);
      state.setPendingPlans(plansMap);
      return readDevelopmentPlans(state);
    })
    .then(planData => {
      let plansMap = planObjectToMap(planData);
      state.setDevelopmentPlans(plansMap);
      return state;
    })
    .catch(err => {
      throw new VError(err, `${logName} Failed to initialise plans`);
    });
}

function writePlanFiles(state) {
  const logName = `${moduleName}.writePlanFiles`;

  let approvedPlans = state.approvedPlans();
  let planObj = planMapToObject(approvedPlans, "Approved Plans");
  let planFile = path.join(state.home(), state.currentRepository(), "approved-plans.json");
  return fse.writeFile(planFile, JSON.stringify(planObj, null, " "), "utf-8")
    .then(() => {
      let pendingPlans = state.pendingPlans();
      let planObj = planMapToObject(pendingPlans, "Pending Plans");
      let planFile = path.join(state.home(), state.currentRepository(), "pending-plans.json");
      return fse.writeFile(planFile, JSON.stringify(planObj, null, " "), "utf-8");
    })
    .then(() => {
      let developmentPlans = state.developmentPlans();
      let planObj = planMapToObject(developmentPlans, "Development Plans");
      let planFile = path.join(state.home(), state.currentRepository(), "development-plans.json");
      return fse.writeFile(planFile, JSON.stringify(planObj, null, " "), "utf-8");
    })
    .catch(err => {
      throw new VError(err, `${logName} Failed to write plans to files`);
    });
}

function makePlanRecord(state, name, desc) {
  const logName = `${moduleName}.createChangeRecord`;
  const fmt = "YYYY-MM-DD HH:mm:ss";
  try {
    let newUUID = short().new();
    let plan = {
      createdDate: moment().format(fmt),
      author: state.username(),
      authorEmail: state.email(),
      approved: false,
      approvals: [],
      name: name,
      description: desc,
      uuid: newUUID,
      change: path.join("changes", `${name.replace(/\s+/g, "-")}-${newUUID}.sql`),
      verify: path.join("verify", `${name.replace(/\s+/g, "-")}-${newUUID}.sql`),
      rollback: path.join("rollback", `${name.replace(/\s+/g, "-")}-${newUUID}.sql`)
    };
    return plan;
  } catch (err) {
    throw new VError(err, `${logName} Failed to create new plan ${name}`);
  }
}

function createChangePlan(state, plan) {
  const logName = `${moduleName}.createChangePlan`;
  const repo = state.get("repoObject");
  const newBranch = `${plan.name.replace(/\s+/g, "-")}-${plan.uuid}`;

  return git.createBranch(repo, newBranch)
    .then(branchRef => {
      return repo.checkoutBranch(branchRef);
    })
    .then(() => {
      return files.createChangeFiles(state, plan);
    })
    .catch(err => {
      throw new VError(err, `${logName} Failed to create new plan`);
    });
}

module.exports = {
  readPlanFiles,
  writePlanFiles,
  makePlanRecord,
  createChangePlan
};
