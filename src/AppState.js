"use strict";

const moduleName = "AppState";

const VError = require("verror");
const assert = require("assert");
const fse = require("fse");
const RepositoryMap = require("./RepositoryMap");
const PlanMap = require("./PlanMap");
const Repository = require("./Repository");
const path = require("path");

const defaultInit = path.join(process.env.HOME, ".dbcmrc");

function AppState() {
  this.state = new Map();
  this.initialised = false;
}

AppState.prototype.init = async function(rc = defaultInit) {
  const logName = `${moduleName}.init`;

  async function readConfig(fileName) {
    try {
      await fse.access(fileName, fse.constants.R_OK | fse.constants.W_OK);
      let config = await fse.readJson(fileName);
      return config;
    } catch (err) {
      if (err.code === "ENOENT" || err.code === undefined) {
        // no rc file - return default
        return {
          version: "1.0.0",
          user: {
            name: undefined,
            email: undefined
          },
          repositoryHome: undefined,
          repositories: [],
          psqlPath: undefined,
          currentRepositoryName: undefined,
          currentTargetName: undefined,
          currentPlanUUID: undefined
        };
      }
      throw new VError(err, `${logName} Failed to access ${fileName}`);
    }
  }

  try {
    if (this.initialised) {
      this.state.clear();
      this.initialised = false;
    }
    this.state.set("initFile", rc);
    let config = await readConfig(rc);
    this.state.set("user", config.user);
    this.state.set("home", config.repositoryHome);
    let repoMap = new RepositoryMap();
    if (Array.isArray(config.repositories) && config.repositories.length) {
      repoMap.fromArray(config.repositories);
    }
    this.state.set("repositories", repoMap);
    this.state.set("currentRepositoryName", config.currentRepository);
    this.state.set("currentTargetName", config.currentTarget);
    this.state.set("psqlPath", config.psqlPath);
    this.state.set("changePlans", new PlanMap());
    this.state.set("currentPlanUUID", config.currentPlan);
    this.state.set("menuChoice", "unknown");
    this.initialised = true;
  } catch (err) {
    throw new VError(err, `${logName} Failed to initialise application state`);
  }
};

AppState.prototype.get = function(key) {
  const logName = `${moduleName}.get`;

  try {
    if (!this.initialised) {
      throw new Error("AppState not initialised");
    }
    if (this.state.has(key)) {
      return this.state.get(key);
    }
    console.log(`${logName}: Unknown key ${key}`);
    return undefined;
  } catch (err) {
    throw new VError(err, `${logName} Error retrieving state value for ${key}`);
  }
};

AppState.prototype.set = function(key, value) {
  const logName = `${moduleName}.set`;

  try {
    if (!this.initialised) {
      throw new Error("AppState not initialised");
    }
    if (!this.state.has(key)) {
      console.log(`${logName}. New unknown key set: ${key}`);
    }
    this.state.set(key, value);
  } catch (err) {
    throw new VError(
      err,
      `${logName} Failed to set state value for key ${key}`
    );
  }
};

AppState.prototype.username = function() {
  return this.get("user").name;
};

AppState.prototype.email = function() {
  return this.get("user").email;
};

AppState.prototype.home = function() {
  return this.get("home");
};

AppState.prototype.psqlPath = function() {
  return this.get("psqlPath");
};

AppState.prototype.setPsqlPath = function(psql) {
  return this.set("psqlPath", psql);
};

AppState.prototype.repositoryMap = function() {
  return this.get("repositories");
};

AppState.prototype.setRepositoryMap = function(repoMap) {
  const logName = `${moduleName}.setRepositories`;

  try {
    if (repoMap instanceof RepositoryMap) {
      return this.set("repositories", repoMap);
    }
    throw new Error("Argument must be an instance of RepositoryMap");
  } catch (err) {
    throw new VError(err, `${logName} Failed to set repositories`);
  }
};

AppState.prototype.repositoryCount = function() {
  return this.get("repositories").size();
};

AppState.prototype.repositoryNames = function() {
  return this.get("repositories").repositoryNames();
};

AppState.prototype.repositoryDef = function(repoName) {
  const logName = `${moduleName}.repositoryDef`;

  try {
    if (this.get("repositories").has(repoName)) {
      return this.get("repositories").getRepo(repoName);
    }
    throw new Error(`Unknown repository ${repoName}`);
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

AppState.prototype.setRepositoryDef = function(defObject) {
  const logName = `${moduleName}.setRepositoryDef`;

  try {
    if (defObject instanceof Repository) {
      return this.get("repositories").setRepo(defObject);
    }
    throw new Error("Argument must be a Repostiory object");
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

AppState.prototype.currentRepositoryName = function() {
  return this.get("currentRepositoryName");
};

AppState.prototype.setCurrentRepositoryName = function(repoName) {
  return this.set("currentRepositoryName", repoName);
};

AppState.prototype.currentRepositoryDef = function() {
  const logName = `${moduleName}.currentRepositoryDef`;

  try {
    if (this.get("currentRepositoryName")) {
      return this.get("repositories").getRepo(
        this.get("currentRepositoryName")
      );
    }
    throw new Error("Current repository not defined");
  } catch (err) {
    throw new VError(err, `${logName} Failed to set repository definition`);
  }
};

AppState.prototype.currentRepositoryUrl = function() {
  const logName = `${moduleName}.currentRepositoryUrl`;

  try {
    if (this.get("currentRepositoryName")) {
      return this.get("repositories").getRepo(this.get("currentRepositoryName"))
        .url;
    }
    throw new Error("Current repository not defined");
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

AppState.prototype.currentReleaseTag = function() {
  return this.currentRepositoryDef().releaseTag;
};

AppState.prototype.setCurrentReleaseTag = function(tag) {
  return (this.currentRpositoryDef().releaseTag = tag);
};

AppState.prototype.currentRepositoryTargets = function() {
  const logName = `${moduleName}.currentRepositoryTargets`;

  try {
    if (this.get("currentRepositoryName")) {
      return this.get("repositories").getRepo(this.get("currentRepositoryName"))
        .targets;
    }
    throw new Error("Current repository not defined");
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

AppState.prototype.setCurrentRepositoryTargets = function(targetMap) {
  if (this.get("currentRepositoryName")) {
    return (this.get("repositories").getRepo(
      this.get("currentRepositoryName")
    ).targets = targetMap);
  }
  throw new Error("Current repository not defined");
};

AppState.prototype.addCurrentRepositoryTarget = function(target) {
  const logName = `${moduleName}.addTarget`;

  try {
    return this.currentRepositoryDef().setTarget(target);
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

AppState.prototype.currentTargetName = function() {
  return this.get("currentTargetName");
};

AppState.prototype.setCurrentTargetName = function(targetName) {
  return this.set("currentTargetName", targetName);
};

AppState.prototype.currentTargetDef = function() {
  const logName = `${moduleName}.currentTargetDef`;

  try {
    if (this.get("currentRepositoryName") && this.get("currentTargetName")) {
      return this.currentRepositoryDef().getTarget(
        this.get("currentTargetName")
      );
    }
    throw new Error(
      "Either current repository or current target is not defined"
    );
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

AppState.prototype.currentApprovalType = function() {
  const logName = `${moduleName}.currentApprovalType`;

  try {
    if (this.get("currentRepositoryName")) {
      return this.currentRepositoryDef().approvalType;
    }
    throw new Error("Current repository not defined");
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

AppState.prototype.setCurrentApprovalType = function(type) {
  const logName = `${moduleName}.setCurrentApprovalType`;

  try {
    if (this.get("currentRepositoryName")) {
      return this.currentRepositoryDef().setApprovalType(type);
    }
    throw new Error("Current repository not defined");
  } catch (err) {
    throw new VError(err, `${logName} Failed to set approval type`);
  }
};

AppState.prototype.currentApprovers = function() {
  const logName = `${moduleName}.currentApprovers`;

  try {
    if (this.get("currentRepositoryName")) {
      return this.currentRepositoryDef().approvers;
    }
    throw new Error("Current repository not defined");
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

AppState.prototype.setApprovers = function(appMap) {
  const logName = `${moduleName}.setApprovers`;

  try {
    assert.ok(appMap instanceof Map, "Argument must be a Map() instance");
    if (this.get("currentRepositoryName")) {
      return (this.currentRepositoryDef().approvers = appMap);
    }
    throw new Error("Current repository not defined");
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

AppState.prototype.changePlans = function() {
  return this.get("changePlans");
};

AppState.prototype.setChangePlans = function(plansMap) {
  const logName = `${moduleName}.setChangePlans`;

  try {
    assert.ok(
      plansMap instanceof PlanMap,
      "Argument must be a PlanMap() instance"
    );
    return this.set("changePlans", plansMap);
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

AppState.prototype.readChangePlans = async function() {
  const logName = `${moduleName}.readChangePlans`;

  try {
    assert.ok(this.currentRepositoryName(), "Current repositorhy not defined");
    let plansFile = path.join(
      this.currentRepositoryDef().path,
      "change-plans.json"
    );
    await this.changePlans().readPlans(plansFile);
    return true;
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

AppState.prototype.writeChangePlans = async function() {
  const logName = `${moduleName}.writeChangePlans`;

  try {
    assert.ok(this.currentRepositoryName(), "Current repository not defined");
    let plansFile = path.join(
      this.currentRepositoryDef().path,
      "change-plans.json"
    );
    await this.changePlans().writePlans(plansFile);
    return true;
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

AppState.prototype.addChangePlan = async function(plan) {
  const logName = `${moduleName}.addChangePlan`;

  try {
    assert.ok(this.currentRepositoryName(), "Current repository not defined");
    let rootPath = path.join(this.home(), this.currentRepositoryName());
    await this.get("changePlans").add(rootPath, plan);
    return true;
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

AppState.prototype.deleteChangePlan = function(plan) {
  const logName = `${moduleName}.deleteChangePlan`;

  try {
    let rootPath = path.join(this.home(), this.currentRepositoryName());
    this.get("changePlans").remove(rootPath, plan);
    return true;
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

AppState.prototype.currentPlanUUID = function() {
  return this.get("currentPlanUUID");
};

AppState.prototype.setCurrentPlanUUID = function(id) {
  return this.set("currentPlanUUID", id);
};

AppState.prototype.planDef = function(planUUID) {
  return this.get("changePlans").get(planUUID);
};

AppState.prototype.currentPlanDef = function() {
  const logName = `${moduleName}.currentPlanDef`;

  try {
    if (this.get("changePlans") && this.get("currentPlanUUID")) {
      return this.get("changePlans").get(this.get("currentPlanUUID"));
    }
    throw new Error("Both changePlans and currentPlanUUID must be defined");
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

AppState.prototype.currentPlanType = function() {
  const logName = `${moduleName}.currentPlanType`;

  try {
    if (this.get("changePlans") && this.get("currentPlanUUID")) {
      return this.currentPlanDef().planType;
    }
    throw new Error("Both changePlans and currentPlanUUID must be defined");
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

AppState.prototype.setCurrentPlanType = function(type) {
  const logName = `${moduleName}.setCurrentPlanType`;

  try {
    if (this.get("changePlans") && this.get("currentPlanUUID")) {
      return this.currentPlanDef().setType(type);
    }
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

AppState.prototype.menuChoice = function() {
  return this.get("menuChoice");
};

AppState.prototype.setMenuChoice = function(choice) {
  return this.set("menuChoice", choice);
};

AppState.prototype.writeUserInit = async function(rc) {
  const logName = `${moduleName}.writeConfig`;

  try {
    let initFile = rc ? rc : this.get("initFile");
    let newConfig = {
      version: "1.0.0",
      user: this.get("user"),
      repositoryHome: this.get("home"),
      psqlPath: this.get("psqlPath"),
      currentRepositoryName: this.get("currentRepositoryName"),
      currentTargetName: this.get("currentTargetName"),
      currentPlanUUID: this.get("currentPlanUUID")
    };
    let repoList = this.state.get("repositories").toArray();
    newConfig.repositories = repoList;
    await fse.writeFile(initFile, JSON.stringify(newConfig, null, " "));
  } catch (err) {
    throw new VError(err, `${logName} Failed to write config to ${rc}`);
  }
};

AppState.prototype.saveRepoMetadata = async function() {
  const logName = `${moduleName}.saveRepoMetadata`;

  try {
    if (this.currentRepositoryName()) {
      await this.writeChangePlans();
    }
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

module.exports = AppState;
