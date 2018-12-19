"use strict";

const moduleName = "plans";

const VError = require("verror");
const short = require("short-uuid");
const path = require("path");
const moment = require("moment");
const fse = require("fse");
const git = require("./git");
const files = require("./files");
const screen = require("./textScreen");

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
  const logName = `${moduleName}.readDevelopmentPlans`;
  const planFile = path.join(state.home(), state.currentRepository(), "development-plans.json");
  
  return readPlanFile(planFile)
    .catch(err => {
      throw new VError(err, `${logName} Failed to read pending plan file for ${state.currentRepository}`);
    });
}

function readRejectedPlans(state) {
  const logName = `${moduleName}.readRejectedPlans`;
  const planFile = path.join(state.home(), state.currentRepository(), "rejected-plans.json");
  
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
      return readRejectedPlans(state);
    })
    .then(planData => {
      let plansMap = planObjectToMap(planData);
      state.setRejectedPlans(plansMap);
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
      approvalSha: "",
      approvals: [],
      name: name,
      description: desc,
      uuid: newUUID,
      change: path.join("changes", `${name.replace(/\s+/g, "-")}.sql`),
      verify: path.join("verify", `${name.replace(/\s+/g, "-")}.sql`),
      rollback: path.join("rollback", `${name.replace(/\s+/g, "-")}.sql`)
    };
    return plan;
  } catch (err) {
    throw new VError(err, `${logName} Failed to create new plan ${name}`);
  }
}

async function createChangePlan(state, plan) {
  const logName = `${moduleName}.createChangePlan`;
  const repo = state.get("repoObject");
  const newBranch = `${plan.name.replace(/\s+/g, "-")}`;

  try {
    let ref = await git.createBranch(repo, newBranch);
    await repo.checkoutBranch(ref);
    await files.createChangeFiles(state, plan);
    let planMap = state.developmentPlans();
    planMap.set(plan.uuid, plan);
    state.setDevelopmentPlans(planMap);
    state.setCurrentPlanType("developmentPlans");
    state.setCurrentPlan(plan.uuid);
    await writePlanFiles(state);
    let changedFiles = await repo.getStatus();
    if (changedFiles.length) {
      await git.addAndCommit(state, changedFiles, "Initial commit for plan: "
                             + `'${plan.name}'`);
    }
    return state;
  } catch (err) {
    throw new VError(err, `${logName} Failed to create change plan`);
  }
}

async function movePlanToPending(state) {
  const logName = `${moduleName}.movePlanToPending`;

  try {
    let planDef = state.currentPlanDef();
    let devPlans = state.developmentPlans();
    let pendingPlans = state.pendingPlans();
    let branch = `${planDef.name.replace(/\s+/g, "-")}`;
    pendingPlans.set(planDef.uuid, planDef);
    devPlans.delete(planDef.uuid);
    state.setDevelopmentPlans(devPlans);
    state.setPendingPlans(pendingPlans);
    await writePlanFiles(state);
    state.setCurrentPlanType("pendingPlans");
    await state.writeConfigFile();
    let repo = state.get("repoObject");
    let files = await repo.getStatus();
    await git.addAndCommit(state, files, `Commit plan '${planDef.name}' for approval`);
    await git.pullMaster(repo);
    await git.mergeBranchIntoMaster(state, branch);
    return state;
  } catch (err) {
    throw new VError(err, `${logName} Failed to move development plan to pending plan`);
  }
}

function movePlanToApproved(state) {
  const logName = `${moduleName}.movePlanToApproved`;

  try {
    let pendingPlans = state.pendingPlans();
    let approvedPlans = state.approvedPlans();
    let planDef = state.currentPlanDef();
    if (planDef.approved) {
      approvedPlans.set(planDef.uuid, planDef);
      pendingPlans.delete(planDef.uuid);
      state.setPendingPlans(pendingPlans);
      state.setApprovedPlans(approvedPlans);
      state.setCurrentPlanType("approvedPlans");
    }
    return state;
  } catch (err) {
    throw new VError(err, `${logName} Failed to move pendingplan to approved plan`);
  }
}

function findPlan(state, pId) {
  const logName = `${moduleName}.findPlan`;

  try {
    if (state.developmentPlans().has(pId)) {
      return ["developmentPlans", state.developmentPlans().get(pId)];
    }
    if (state.pendingPlans().has(pId)) {
      return ["pendingPlans", state.pendingPlans().get(pId)];
    }
    if (state.approvedPlans().has(pId)) {
      return ["approvedPlans", state.approvedPlans().get(pId)];
    }
    if (state.rejectedPlans().has(pId)) {
      return ["rejectedPlans", state.rejectedPlans().has(pId)];
    }
    console.log(`${logName} Plan ${pId} not found!`);
    return [];
  } catch (err) {
    throw new VError(err, `${logName} Failed to find plan ${pId}`);
  }
}

module.exports = {
  readPlanFiles,
  writePlanFiles,
  makePlanRecord,
  createChangePlan,
  movePlanToPending,
  movePlanToApproved,
  findPlan
};
