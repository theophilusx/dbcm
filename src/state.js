"use strict";

const moduleName = "state";

const VError = require("verror");
const path = require("path");
const fse = require("fse");
const plans = require("./plans");

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

async function createApplicationState() {
  const logName = `${moduleName}.createApplicationState`;
  const state = new Map();

  try {
    console.log("read config file");
    let config = await readConfig();
    console.log("set basic appState values");
    state.set("user", config.user);
    state.set("home", config.repositoryHome);
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
    state.set("repositories", repoMap);
    console.log("Set some defaults");
    state.set("currentRepository", undefined);
    state.set("currentTarget", undefined);
    state.set("psqlPath", config.psqlPath);
    state.set("approvalType", "none");
    state.set("approvers", new Map());
    state.set("developmentPlans", new Map());
    state.set("pendingPlans", new Map());
    state.set("approvedPlans", new Map());
    state.set("menuChoice", "unknown");
    state.set("repoObject", undefined);
    return {
      get: key => {
        return state.get(key);
      },
      set: (key, value) => {
        return state.set(key, value);
      },
      username: state.get("user").name,
      email: state.get("user").email,
      home: state.get("home"),
      repositories: state.get("repositories"),
      setRepositories: repoMap => {
        return state.set("repositories", repoMap);
      },
      repositoryDef: repoName => {
        return state.get("repositories").get(repoName);
      },
      setRepositoryDef: (repoName, defObject) => {
        return state.get("repositories").set(repoName, defObject);
      },
      currentRepository: state.get("currentRepository"),
      setCurrentRepository: repoName => {
        return state.set("currentRepository", repoName);
      },
      currentRepositoryDef: state.get("repositories").get(state.get("currentRepository")),
      currentRepositoryUrl: state.get("repositories").get(state.get("currentRepository")).url,
      currentRepositoryTargets: state.get("repositories").get(state.get("currentRepository")).targets,
      currentTarget: state.get("currentTarget"),
      setCurrentTarget: targetName => {
        return state.set("currentTarget", targetName);
      },
      currentTargetDef: state.get("repositories").get(state.get("currentRepository").targets.get(state.get("currentTarget"))),
      psqlPath: state.get("psqlPath"),
      setPsqlPath: psql => {
        return state.set("psqlPath", psql);
      },
      approvalType: state.get("approvalType"),
      setApprovalType: type => {
        return state.set("approvalType", type);
      },
      approvers: state.get("approvers"),
      setApprovers: appMap => {
        return state.set("approvers", appMap);
      },
      developmentPlans: state.get("developmentPlans"),
      setDevelopmentPlans: planMap => {
        return state.set("developmentPlans", planMap);
      },
      pendingPlans: state.get("pendingPlans"),
      setPendingPlans: planMap => {
        return state.set("pendingPlans", planMap);
      },
      approvedPlans: state.get("approvedPlans"),
      setApprovedPlans: planMap => {
        return state.set("approvedPlans", planMap);
      },
      menuChoice: state.get("menuChoice"),
      setMenuChoice: choice => {
        return state.set("menuChoice", choice);
      },
      writeConfigFile: async () => {
        await writeConfig(state);
      },
      saveState: async () => {
        await writeConfig(state);
        await plans.writePlanFiles(state);
      }
    };
  } catch (err) {
    throw new VError(err, `${logName} Failed to initialise DBCM state`);
  }
}


module.exports = {
  createApplicationState
};
