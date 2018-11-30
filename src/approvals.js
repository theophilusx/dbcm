"use strict";

const moduleName = "approvals";

const VError = require("verror");
const path = require("path");
const fse = require("fse");

function readApprovalsFile(appState) {
  const logName = `${moduleName}.readApprovalsFile`;
  const filePath = path.join(appState.get("home"), appState.get("currentRepository"), "approvals.json");

  return fse.readJson(filePath)
    .then(data => {
      let approverMap = new Map();
      for (let ap of data.approvers) {
        approverMap.set(ap.email, ap.name);
      }
      appState.set("approvalType", data.type);
      appState.set("approvers", approverMap);
    })
    .catch(err => {
      throw new VError(err, `${logName} Failed to read approvals.json`);
    });
}

function writeApprovalsFile(appState) {
  const logName = `${moduleName}.writeApprovalsFile`;
  const filePath = path.join(appState.get("home"), appState.get("currentRepository"), "approvals.json");
  let content = {
    name: "Change Approvals",
    version: "1.0.0",
    type: appState.get("approvalType")
  };
  let approvers = [];
  let appMap = appState.get("approvers");
  
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

module.exports = {
  readApprovalsFile,
  writeApprovalsFile 
};
