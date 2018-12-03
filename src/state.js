"use strict";

const moduleName = "state";

const VError = require("verror");
const path = require("path");
const fse = require("fse");

const rcPath = path.join(process.env.HOME, ".dbcmrc");

function readConfig() {
  const logName = `${moduleName}.readConfig`;

  return fse.access(path.join(rcPath), fse.constants.R_OK | fse.constants.W_OK)
    .then(() => {
      return fse.readJson(rcPath);
    })
    .catch(err => {
      if (err.code === "ENOENT") {
        // no rc file - return default 
        return {
          version: "1.0.0",
          user: {
            name: undefined,
            email: undefined
          },
          repositoryHome: undefined,
          repositories: [],
          psqlPath: undefined
        };
      }
      throw new VError(err, `${logName} Failed to access ${rcPath}`);
    });
}

async function setInitialState() {
  const logName = `${moduleName}.setInitialState`;
  const appState = new Map();

  try {
    console.log("read config file");
    let config = await readConfig();
    console.log("set basic appState values");
    appState.set("user", config.user);
    appState.set("version", config.version);
    appState.set("home", config.repositoryHome);
    console.log("Set repository data");
    let repoMap = new Map();
    if (config.repositories.length) {
      for (let repo of config.repositories) {
        let targetMap = new Map();
        for (let t of repo.targets) {
          let targetName = t.targetName;
          let params = {
            database: t.database,
            host: t.host,
            port: t.port,
            user: t.user,
            password: t.password
          };
          targetMap.set(targetName, params);
        }
        repoMap.set(repo.name, {
          url: repo.url,
          targets: targetMap
        });
      }
    }
    appState.set("repositories", repoMap);
    console.log("Set some defaults");
    appState.set("currentRepository", undefined);
    appState.set("currentTarget", undefined);
    appState.set("psqlPath", config.psqlPath);
    appState.set("approvalType", "none");
    appState.set("approvers", new Map());
    appState.set("developmentPlans", new Map());
    appState.set("pendingPlans", new Map());
    appState.set("approvedPlans", new Map());
    return appState;
  } catch (err) {
    throw new VError(err, `${logName} Failed to initialise DBCM state`);
  }
}

async function writeConfig(appState) {
  const logName = `${moduleName}.writeState`;
  let newConfig = {};

  try {
    newConfig.version = appState.get("version");
    newConfig.user = appState.get("user");
    newConfig.repositoryHome = appState.get("home");
    newConfig.psqlPath = appState.get("psqlPath");
    let repoList = [];
    let repoMap = appState.get("repositories");
    for (let repoName of repoMap.keys()) {
      let repo = repoMap.get(repoName);
      let url = repo.url;
      let targets = [];
      let targetMap = repo.targets;
      for (let targetName of targetMap.keys()) {
        let params = targetMap.get(targetName);
        targets.push({
          targetName: targetName,
          database: params.database,
          host: params.host,
          port: params.port,
          user: params.user,
          password: params.password
        });
      }
      repoList.push({
        name: repoName,
        url: url,
        targets: targets
      });
    }
    newConfig.repositories = repoList;
    await fse.writeFile(rcPath, JSON.stringify(newConfig, null, " "));
  } catch (err) {
    throw new VError(err, `${logName} Failed to write ${rcPath}`);
  }
}

function getRepositoryDefinition(appState, repoName) {
  return appState.get("repositories").get(repoName);
}

function setRepositoryDefinition(appState, repoName, defObj) {
  appState.get("repositories").set(repoName, defObj);
  return appState;
}

function getRepositoryUrl(appState, repoName) {
  return getRepositoryDefinition(appState, repoName).url;
}

function setRepositoryUrl(appState, repoName, url) {
  getRepositoryDefinition(appState, repoName).url = url;
}

function getRepositoryTargets(appState, repoName) {
  return getRepositoryDefinition(appState, repoName).targets;
}

function setRepositoryTargets(appState, repoName, targetMap) {
  appState.get("repositories").get(repoName).targets = targetMap;
}

function getTargetDefinition(appState, repoName, targetName) {
  return getRepositoryTargets(appState, repoName).get(targetName);
}

function setTargetDefinition(appState, repoName, targetName, defObj) {
  getRepositoryTargets(appState, repoName).set(targetName, defObj);
  return appState;
}

module.exports = {
  setInitialState,
  writeConfig,
  getRepositoryDefinition,
  setRepositoryDefinition,
  getRepositoryUrl,
  setRepositoryUrl,
  getRepositoryTargets,
  setRepositoryTargets,
  getTargetDefinition,
  setTargetDefinition
};
