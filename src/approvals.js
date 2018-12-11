"use strict";

const moduleName = "approvals";

const VError = require("verror");
const path = require("path");
const fse = require("fse");

function readApprovalsFile(state) {
  const logName = `${moduleName}.readApprovalsFile`;
  const filePath = path.join(state.home(), state.currentRepository(), "approvals.json");

  return fse.readJson(filePath)
    .then(data => {
      let approverMap = new Map();
      for (let ap of data.approvers) {
        approverMap.set(ap.email, ap.name);
      }
      state.setApprovalType(data.type); 
      state.setApprovers(approverMap);
      return state;
    })
    .catch(err => {
      throw new VError(err, `${logName} Failed to read approvals.json`);
    });
}

function writeApprovalsFile(state) {
  const logName = `${moduleName}.writeApprovalsFile`;
  const filePath = path.join(state.home(), state.currentRepository(), "approvals.json");
  let content = {
    name: "Change Approvals",
    version: "1.0.0",
    type: state.approvalType()
  };
  let approvers = [];
  let appMap = state.approvers();
  for (let email of appMap.keys()) {
    approvers.push({
      name: appMap.get(email),
      email: email
    });
  }
  content.approvers = approvers;
  return fse.writeFile(filePath, JSON.stringify(content, null, " "), "utf-8")
    .catch(err => {
      throw new VError(err, `${logName} Failed to write approvals.json`);
    });
}

function isApprover(state) {
  const logName = `${moduleName}.isApprover`;

  try {
    let approvers = state.approvers();
    if (approvers.has(state.email())) {
      return true;
    }
    return false;
  } catch (err) {
    throw new VError(err, `${logName} Failed to determine approver state`);
  }
}

function addApproval(state) {
  const logName = `${moduleName}.addApproval`;

  try {
    let pId = state.currentPlan().split(":")[2];
    let pendingPlans = state.pendingPlans();
    let planDef = pendingPlans.get(pId);
    planDef.approvals.push({
      name: state.username(),
      email: state.email()
    });
    if (state.approvalType() === "any"
        || state.approvers().size === planDef.approvals.length) {
      planDef.approved = true;
    }
    pendingPlans.set(pId, planDef);
    state.setPendingPlans(pendingPlans);
    return state;
  } catch (err) {
    throw new VError(err, `${logName} Failed to add approval to plan`);
  }
}

module.exports = {
  readApprovalsFile,
  writeApprovalsFile,
  isApprover,
  addApproval
};
