"use strict";

const moduleName = "state";

const VError = require("verror");
const fse = require("fse");
const {RepositoryMap} = require("./RepositoryMap");

function AppState() {
  this.state = new Map();
  this.initialised = false;
}

AppState.prototype.init = async function(rc) {
  const logName = `${moduleName}.init`;

  async function readConfig(fileName) {
    try {
      await fse.access(fileName, fse.constants.R_OK | fse.constants.W_OK);
      let config = fse.readJson(fileName);
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
          currentRepository: undefined,
          currentTarget: undefined,
          currentPlan: undefined,
          currentPlanType: undefined,
          currentReleaseTag: "0.0.0"
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
    let config = await readConfig(rc);
    this.state.set("user", config.user);
    this.state.set("home", config.repositoryHome);
    let repoMap = new RepositoryMap();
    if (Array.isArray(config.repositories) && config.repositories.length) {
      repoMap.fromArray(config.repositories);
    }
    this.state.set("repositories", repoMap);
    this.state.set("currentRepository", config.currentRepository);
    this.state.set("currentTarget", config.currentTarget);
    this.state.set("psqlPath", config.psqlPath);
    this.state.set("changePlans", new Map());
    this.state.set("currentPlan", config.currentPlan);
    this.state.set("menuChoice", "unknown");
    this.initialised = true;
  } catch (err) {
    throw new VError(err, `${logName} Failed to initialise application state`);
  }
};

AppState.prototype.get = function(key) {
  const logName = `${moduleName}.get`;

  try {
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
    if (!this.state.has(key)) {
      console.log(`${logName}. New unknown key set: ${key}`);
    }
    this.state.set(key, value);
  } catch (err) {
    throw new VError(err, `${logName} Failed to set state value for key ${key}`);
  }
};

AppState.prototype.username = function() {
  return this.state.get("user").name;
};

AppState.prototype.email = function() {
  return this.state.get("user").email;
};

AppState.prototype.home = function() {
  return this.state.get("home");
};

AppState.prototype.repositories = function() {
  return this.state.get("repositories");
};

AppState.prototype.setRepositories = function(repoMap) {
  const logName = `${moduleName}.setRepositories`;

  try {
    if (repoMap instanceof RepositoryMap) {
      return this.state.set("repositories", repoMap);      
    }
    throw new Error("Argument must be an instance of RepositoryMap");
  } catch (err) {
    throw new VError(err, `${logName} Failed to set repositories`);
  }
};

AppState.prototype.repositoryCount = function() {
  return this.state.get("repositories").size();
};

AppState.prototype.repositoryDef = function(repoName) {
  if (this.state.get("repositories").has(repoName)) {
    return this.state.get("repositories").get(repoName);    
  }
  throw new Error(`Unknown repository ${repoName}`);
};

AppState.prototype.setRepositoryDef = function(repoName, defObject) {
  return this.state.get("repository").set(repoName, defObject);
};

AppState.prototype.currentRepository = function() {
  const logName = `${moduleName}.currentRepository`;

  try {
    if (this.state.get("currentRepository")) {
      return this.state.get("currentRepository");    
    }
    throw new Error("Current repository not defined");
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

AppState.prototype.setCurrentRepository = function(repoName) {
  return this.state.set("currentRepository", repoName);
};

AppState.prototype.currentRepositoryDef = function() {
  const logName = `${moduleName}.currentRepositoryDef`;

  try {
    if (this.state.get("currentRepository")) {
      return this.state.get("repositories").get(this.state.get("currentRepository"));    
    }
    throw new Error("Current repository not defined");
  } catch (err) {
    throw new VError(err, `${logName} Failed to set repository definition`);
  }
};

AppState.prototype.currentRepositoryUrl = function() {
  const logName = `${moduleName}.currentRepositoryUrl`;

  try {
    if (this.state.get("currentRepository")) {
      return this.state.get("repositories").get(this.state.get("currentRepository")).url;
    }
    throw new Error("Current repository not defined");
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

AppState.prototype.currentRepositoryTargets = function() {
  const logName = `${moduleName}.currentRepositoryTargets`;

  try {
    if (this.state.get("currentRepository")) {
      return this.state.get("repositories").get(this.state.get("currentRepository")).targets;
    }
    throw new Error("Current repository not defined");
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

AppState.prototype.setCurrentRepositoryTargets = function(targetMap) {
  if (this.state.get("currentRepository")) {
    return this.state.get("repositories").get(this.state.get("currentRepository")).targets = targetMap;
  }
  throw new Error("Current repository not defined");
};

AppState.prototype.currentTarget = function() {
  const logName = `${moduleName}.currentTarget`;

  try {
    if (this.state.get("currentTarget")) {
      return this.state.get("currentTarget");
    }
    throw new Error("Current target not defined");
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

AppState.prototype.setCurrentTarget = function(targetName) {
  return this.state.set("currentTarget", targetName);
};

AppState.prototype.currentTargetDef = function() {
  const logName = `${moduleName}.currentTargetDef`;

  try {
    if (this.state.get("currentRepository") && this.state.get("currentTarget")) {
      return this.state.get("repositories")
        .get(this.state.get("currentRepository"))
        .targets.get(this.state.get("currentTarget"));
    }
    throw new Error("Either current repository or current target is not defined");
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

AppState.prototype.psqlPath = function() {
  return this.state.get("psqlPath");
};

AppState.prototype.setPsqlPath = function(psql) {
  return this.state.set("psqlPath", psql);
};

AppState.prototype.currentApprovalType = function() {
  const logName = `${moduleName}.currentApprovalType`;

  try {
    if (this.state.get("currentRepository")) {
      return this.currentRepositoryDef().approvalType;
    }
    throw new Error("Current repository not defined");
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

AppState.prototype.setApprovalType = function(type) {
  return this.state.set("approvalType", type);
};

AppState.prototype.currentApprovers = function() {
  const logName = `${moduleName}.currentApprovers`;

  try {
    if (this.state.get("currentRepository")) {
      return this.currentRepositoryDef().approvers;
    }
    throw new Error("Current repository not defined");
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

AppState.prototype.setApprovers = function(appMap) {
  return this.state.set("approvers", appMap);
};

AppState.prototype.changePlans = function() {
  return this.state.get("changePlans");
};

AppState.prototype.setChangePlans = function(plansMap) {
  return this.state.set("changePlans", plansMap);
};

AppState.prototype.currentPlan = function() {
  return this.state.get("currentPlan");
};

AppState.prototype.setCurrentPlan = function(id) {
  return this.state.set("currentPlan", id);
};

AppState.prototype.currentPlanType = function() {
  return this.state.get("currentPlanType");
};

AppState.prototype.setCurrentPlanType = function(type) {
  return this.state.set("currentPlanType", type);
};

AppState.prototype.currentPlanDef = function() {
  if (this.state.get("changePlans") && this.state.get("currentPlan")) {
    return this.state.get("changePlans").get(this.state.get("currentPlan"));    
  }
  throw new Error("Either change plans is not defined or current plan is not defined");
};

AppState.prototype.menuChoice = function() {
  return this.state.get("menuChoice");
};

AppState.prototype.setMenuChoice = function(choice) {
  return this.state.set("menuChoice", choice);
};

AppState.prototype.currentReleaseTag = function() {
  return this.state.get("currentReleaseTag");
};

AppState.prototype.setCurrentReleaseTag = function(tag) {
  return this.state.set("currentReleaseTag", tag);
};

AppState.prototype.writeConfig = async function(fileName) {
  const logName = `${moduleName}.writeConfig`;
  
  try {
    let newConfig = {
      version: "1.0.0",
      user: this.state.get("user"),
      repositoryHome: this.state.get("home"),
      psqlPath: this.state.get("psqlPath"),
      currentRepository: this.state.get("currentRepository"),
      currentTarget: this.state.get("currentTarget"),
      currentPlan: this.state.get("currentPlan"),
      currentPlanType: this.state.get("currentPlanType"),
      currentReleaseTag: this.state.get("currentReleaseTag"),
    };
    let repoList = [];
    let repos = this.state.get("repositories");
    for (let r of repos.keys()) {
      let repo = repos.get(r);
      let targets = [];
      let targetMap = r.targets;
      for (let t of targetMap.keys()) {
        let params = targetMap.get(t);
        targets.push({
          targetName: t,
          database: params.database,
          host: params.host,
          port: params.port,
          user: params.user,
          password: params.password
        });
        repoList.push({
          name: r,
          url: repo.url,
          targets: targets
        });
      }
    }
    newConfig.repositories = repoList;
    await fse.writeFile(fileName, JSON.stringify(newConfig, null, " "));
  } catch (err) {
    throw new VError(err, `${logName} Failed to write config to ${fileName}`);
  }
};

module.exports = {
  AppState
};
