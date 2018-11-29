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

function readApprovedPlans(appState) {
  const logName = `${moduleName}.readApprovedPlans`;
  const planFile = path.join(appState.get("home"), appState.get("currentRepository"), "approved-plans.json");

  return readPlanFile(planFile)
    .catch(err => {
      throw new VError(err, `${logName} Failed to read plan file for ${appState.get("currentRepository")}`);
    });
}

function readPendingPlans(appState) {
  const logName = `${moduleName}.readPendingPlans`;
  const planFile = path.join(appState.get("home"), appState.get("currentRepository"), "pending-plans.json");
  
  return readPlanFile(planFile)
    .catch(err => {
      throw new VError(err, `${logName} Failed to read pending plan file for ${appState.get("currentRepository")}`);
    });
}

function readDevelopmentPlans(appState) {
  const logName = `${moduleName}.readPendingPlans`;
  const planFile = path.join(appState.get("home"), appState.get("currentRepository"), "development-plans.json");
  
  return readPlanFile(planFile)
    .catch(err => {
      throw new VError(err, `${logName} Failed to read pending plan file for ${appState.get("currentRepository")}`);
    });
}

function initPlans(appState) {
  const logName = `${moduleName}.initPlans`;

  return readApprovedPlans(appState)
    .then(planData => {
      let plansMap = planObjectToMap(planData);
      appState.set("approvedPlans", plansMap);
      return appState;
    })
    .then(() => {
      return readPendingPlans(appState);
    })
    .then(planData => {
      let plansMap = planObjectToMap(planData);
      appState.set("pendingPlans", plansMap);
      return readDevelopmentPlans(appState);
    })
    .then(planData => {
      let plansMap = planObjectToMap(planData);
      appState.set("developmentPlans", plansMap);
      return appState;
    })
    .catch(err => {
      throw new VError(err, `${logName} Failed to initialise plans`);
    });
}

function createChangeRecord(appState, name, desc) {
  const logName = `${moduleName}.createChangeRecord`;
  const fmt = "YYYY-MM-DD HH:mm:ss";
  try {
    let newUUID = short().new();
    let plan = {
      createdDate: moment().format(fmt),
      author: appState.get("user").name,
      authorEmail: appState.get("user").email,
      approved: false,
      approvedDate: undefined,
      approvedByName: undefined,
      approvedByEmail: undefined,
      name: name,
      description: desc,
      uuid: newUUID,
      change: path.join("changes", `${name.replace(" ", "-")}-${newUUID}.sql`),
      verify: path.join("verify", `${name.replace(" ", "-")}-${newUUID}.sql`),
      rollback: path.join("rollback", `${name.replace(" ", "-")}-${newUUID}.sql`)
    };
    return plan;
  } catch (err) {
    throw new VError(err, `${logName} Failed to create new plan ${name}`);
  }
}

function writePlanFiles(appState) {
  const logName = `${moduleName}.writePlanFiles`;

  let approvedPlans = appState.get("approvedPlans");
  let planObj = planMapToObject(approvedPlans, "Approved Plans");
  let planFile = path.join(appState.get("home"), appState.get("currentRepository"), "approved-plans.json");
  return fse.writeFile(planFile, JSON.stringify(planObj, null, " "), "utf-8")
    .then(() => {
      let pendingPlans = appState.get("pendingPlans");
      let planObj = planMapToObject(pendingPlans, "Pending Plans");
      let planFile = path.join(appState.get("home"), appState.get("currentRepository"), "pending-plans.json");
      return fse.writeFile(planFile, JSON.stringify(planObj, null, " "), "utf-8");
    })
    .then(() => {
      let developmentPlans = appState.get("developmentPlans");
      let planObj = planMapToObject(developmentPlans, "Development Plans");
      let planFile = path.join(appState.get("home"), appState.get("currentRepository"), "development-plans.json");
      return fse.writeFile(planFile, JSON.stringify(planObj, null, " "), "utf-8");
    })
    .catch(err => {
      throw new VError(err, `${logName} Failed to write plans to files`);
    });
}

function createChangePlan(appState, repo, newPlan) {
  const logName = `${moduleName}.createChangePlan`;
  const newBranch = `${newPlan.name.replace(" ", "-")}-${newPlan.uuid}`;

  return git.createBranch(repo, newBranch)
    .then(branchRef => {
      return repo.checkoutBranch(branchRef);
    })
    .then(() => {
      return files.createChangeFiles(appState, newPlan);
    })
    .then(() => {
      return repo.getStatus();
    })
    .then(fileList => {
      return git.addAndCommit(repo, newBranch, fileList, `Initial commit for ${newPlan.name}`);
    })
    .then(() => {
      appState.get("developmentPlans").set(newPlan.uuid, newPlan);
      return writePlanFiles(appState);
    })
    .then(() => {
      return appState;
    })
    .catch(err => {
      throw new VError(err, `${logName} Failed to create change plan for ${newPlan.name}`);
    });
}

module.exports = {
  initPlans,
  createChangeRecord,
  writePlanFiles,
  createChangePlan
};
