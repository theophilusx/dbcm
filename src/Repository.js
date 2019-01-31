"use strict";

const moduleName = "Repository";

const VError = require("verror");
const assert = require("assert");
const TargetMap = require("./TargetMap");
const GitRepo = require("./GitRepo");
const files = require("./files");
const path = require("path");
const fse = require("fse");

function Repository(name, url, repoPath) {
  const logName = `${moduleName}.Repository`;

  try {
    assert.ok(name, "Must provide a repository name");
    assert.ok(url, "Must provide a Git URL");
    assert.ok(repoPath, "Must provide a path to DBCM repositories root");
    this.name = name;
    this.url = url;
    this.path = repoPath;
    this.approvalType = "none";
    this.approvers = new Map();
    this.targets = new TargetMap();
    this.releaseTag = undefined;
    this.gitRepo = new GitRepo(name, url, repoPath);
  } catch (err) {
    throw new VError(err, `${logName} Failed to initialise change repository object`);
  }
}

Repository.prototype.setApprovalType = function(type) {
  const logName = `${moduleName}.setApprovalType`;

  try {
    if (type === "none" || type === "any" || type === "all") {
      this.approvalType = type;
    } else {
      throw new Error(`Invalid approval type: ${type}`);
    }
  } catch (err) {
    throw new VError(err, `${logName} Failed to set approval type`);
  }
};

Repository.prototype.setApprovers = function(approversList) {
  const logName = `${moduleName}.setApprovers`;

  try {
    if (Array.isArray(approversList)) {
      approversList.forEach(approver => {
        if (approver.name === undefined || approver.email === undefined) {
          throw new Error("Missing properties. Approvers must have "
                          + "name and email property");
        }
        this.approvers.set(approver.email, approver);
      });
    }
  } catch (err) {
    throw new VError(err, `${logName} Failed to set approvers for repositorhy `
                     + `${this.name}`);
  }
};

Repository.prototype.isApprover = function(email) {
  return this.approvers.has(email);
};

Repository.prototype.getApprover = function(email) {
  return this.approvers.get(email);
};

Repository.prototype.approverList = function() {
  let approvers = [];
  for (let approver of this.approvers.keys()) {
    approvers.push(this.approvers.get(approver));
  }
  return approvers;
};

Repository.prototype.writeApprovers = async function() {
  const logName = `${moduleName}.writeApprovers`;

  try {
    let approverFile = path.join(this.path, "approval.json");
    let appObj = {
      name: "Change Approval",
      version: "1.0.0",
      approvalType: this.approvalType
    };
    let approvers = [];
    for (let entry of this.approvers.values()) {
      approvers.push(entry);
    }
    appObj.approvers = approvers;
    return await fse.writeFile(approverFile, JSON.stringify(appObj, null, " "));
  } catch (err) {
    throw new VError(err, `${logName} Failed to write approval file`);
  }
}; 

Repository.prototype.readApprovers = async function() {
  const logName = `${moduleName}.readApprovers`;

  try {
    let approverFile = path.join(this.path, "approval.json");
    await fse.access(approverFile, fse.constants.R_OK | fse.constants.W_OK);
    let appObj = await fse.readJson(approverFile);
    this.setApprovalType(appObj.approvalType);
    this.setApprovers(appObj.approvers);
  } catch (err) {
    throw new VError(err, `${logName} Failed to initialise approver details`);
  }
};

Repository.prototype.getTarget = function(targetName) {
  return this.targets.get(targetName);
};

Repository.prototype.setTarget = function(target) {
  return this.targets.set(target);
};

Repository.prototype.targetNames = function() {
  return this.targets.names();
};

Repository.prototype.targetsArray = function() {
  return this.targets.toArray();
};

Repository.prototype.initTargets = function(targetsArray) {
  return this.targets.fromArray(targetsArray);
};

Repository.prototype.getTargetParams = function(targetName) {
  return this.targets.targetParams(targetName);
};

Repository.prototype.isTargetInitialised = async function(targetName) {
  const logName = `${moduleName}.isTArgetInitialised`;

  try {
    return await this.targets.targetIsInitialised(targetName);    
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

Repository.prototype.getStatus = async function() {
  return await this.gitRepo.getStatus();  
};

Repository.prototype.getStatusString = async function() {
  return await this.gitRepo.statusString();
};

Repository.prototype.toObject = function() {
  const logName = `${moduleName}.toObject`;

  try {
    let repoObject = {
      name: this.name,
      url: this.url,
      path: this.path,
      targets: this.targetsArray()
    };
    return repoObject;
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

Repository.prototype.fromObject = function(repObj) {
  const logName = `${moduleName}.fromObject`;

  try {
    if (repObj && repObj.name) {
      this.name = repObj.name;
    } else {
      throw new Error("Initialisation object must have name property");
    }
    if(repObj && repObj.url) {
      this.url = repObj.url;
    } else {
      throw new Error("Initialisation object must have url property");
    }
    if (repObj && repObj.targets) {
      this.initTargets(repObj.targets);
    } else {
      throw new Error("Initialisation object must have targets property");
    }
  } catch (err) {
    throw new VError(err, `${logName} Failed to initialise Repository from object`);
  }
};

Repository.prototype.initGit = async function(branch, author, email) {
  const logName = `${moduleName}.initGit`;

  try {
    await this.gitRepo.init();
    let initialised = await files.isInitialised(this.path);
    if (!initialised) {
      let branchRef = await this.gitRepo.createBranch(branch);
      await this.gitRepo.checkoutBranch(branchRef);
      await files.initialiseRepo(this.path);
    } else {
      await this.gitRepo.pullMaster();
      await this.gitRepo.rebaseBranch(branch, "master", author, email);
    }
    return true;
  } catch (err) {
    throw new VError(err, `${logName} Failed to initialise git repository`);
  } 
};

Repository.prototype.commit = async function(files, msg, author, email) {
  const logName = `${moduleName}.commit`;

  try {
    return await this.gitRepo.addCommit(files, msg, author, email);
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

module.exports = Repository;

