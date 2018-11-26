"use strict";

const moduleName = "files";

const VError = require("verror");
const path = require("path");
const fse = require("fse");

function createPlansFile(rootPath) {
  const logName = `${moduleName}.createPlansFile`;
  const plans = {
    name: "plans",
    version: "1.0.0",
    plans: []
  };
  const plansFile = path.join(rootPath, "plans.json");

  return fse.writeFile(plansFile, JSON.stringify(plans), "utf-8")
    .then(() => {
      console.log("Created plans.json file");
      return true;
    })
    .catch(err => {
      throw new VError(err, `${logName} Failed to create plans.json file in ${rootPath}`);
    });
}

function createChangesDir(rootPath) {
  const logName = `${moduleName}.createChangesDir`;
  const contents = "This directory contains SQL scripts representing DB structure changes";
  const dir = path.join(rootPath, "changes");
  
  return fse.mkdir(dir)
    .then(() => {
      let filePath = path.join(dir, "README");
      return fse.writeFile(filePath, contents, "utf-8");
    })
    .then(() => {
      console.log("Changes directory created");
      return true;
    })
    .catch(err => {
      throw new VError(err, `${logName} Failed to create changes directory in ${rootPath}`);
    });
}

function createValidateDir(rootPath) {
  const logName = `${moduleName}.createValidateDir`;
  const contents = "This directory contains SQL scripts to validate DB structure changes";
  const dir = path.join(rootPath, "validate");
  
  return fse.mkdir(dir)
    .then(() => {
      let filePath = path.join(dir, "README");
      return fse.writeFile(filePath, contents, "utf-8");
    })
    .then(() => {
      console.log("Validate directory created");
      return true;
    })
    .catch(err => {
      throw new VError(err, `${logName} Failed to create validate directory in ${rootPath}`);
    });
}

function createRollbackDir(rootPath) {
  const logName = `${moduleName}.createRollbackDir`;
  const contents = "This directory contains SQL scripts to rollback DB structure changes";
  const dir = path.join(rootPath, "rollback");
  
  return fse.mkdir(dir)
    .then(() => {
      let filePath = path.join(dir, "README");
      return fse.writeFile(filePath, contents, "utf-8");
    })
    .then(() => {
      console.log("Rollback directory created");
      return true;
    })
    .catch(err => {
      throw new VError(err, `${logName} Failed to create rollback directory in ${rootPath}`);
    });
}

function isInitialised(rootPath) {
  const logName = `${moduleName}.isInitialised`;

  return fse.access(path.join(rootPath, "plans.json"), fse.constants.R_OK | fse.constants.W_OK)
    .then(() => {
      console.log("Repository is initialised for DBCM");
      return true;
    })
    .catch(err => {
      if (err.code === "ENOENT") {
        console.log("Repository is not initialized");
        return false;
      }
      console.dir(err);
      throw new VError(err, `${logName} Failed to test repo init status`);
    });
}

async function initialiseRepo(rootPath) {
  const logName = `${moduleName}.initialiseRepo`;

  try {
    await createPlansFile(rootPath);
    await createChangesDir(rootPath);
    await createValidateDir(rootPath);
    await createRollbackDir(rootPath);
    return true;
  } catch (err) {
    throw new VError(err, `${logName} Failed to initialise repository ${rootPath}`);
  }
}

module.exports = {
  createPlansFile,
  createChangesDir,
  createValidateDir,
  createRollbackDir,
  isInitialised,
  initialiseRepo
};
