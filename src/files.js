"use strict";

const moduleName = "files";

const VError = require("verror");
const path = require("path");
const fse = require("fse");

function createPlanFile(rootPath) {
  const logName = `${moduleName}.createPlanFiles`;
  const contents = {
    name: "Change Plans",
    version: "1.0.0",
    plans: []
  };
  const planFile = path.join(rootPath, "change-plans.json");

  return fse.writeFile(planFile, JSON.stringify(contents, null, " "), "utf-8")
    .then(() => {
      console.log("Created change-plans.json file");
      return true;
    })
    .catch(err => {
      throw new VError(err, `${logName} Failed to create change-plans.json file `
                       + `in ${rootPath}`);
    });
}

function createApprovalFile(rootPath) {
  const logName = `${moduleName}.createApprovalFile`;
  const content = {
    name: "Change Approval",
    version: "1.0.0",
    approvalType: "none",
    approvers: []
  };
  const approvalFile = path.join(rootPath, "approval.json");
  
  return fse.writeFile(approvalFile, JSON.stringify(content, null, " "), "utf-8")
    .then(() => {
      console.log("Created approval.json file");
    })
    .catch(err => {
      throw new VError(err, `${logName}`);
    });
}

function createChangesDir(rootPath) {
  const logName = `${moduleName}.createChangesDir`;
  const contents =
        "This directory contains SQL scripts representing DB structure changes";
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
      throw new VError(err, `${logName} Failed to create changes directory `
                       + `in ${rootPath}`);
    });
}

function createVerifyDir(rootPath) {
  const logName = `${moduleName}.createVerifyDir`;
  const contents =
        "This directory contains SQL scripts to verify DB structure changes";
  const dir = path.join(rootPath, "verify");
  
  return fse.mkdir(dir)
    .then(() => {
      let filePath = path.join(dir, "README");
      return fse.writeFile(filePath, contents, "utf-8");
    })
    .then(() => {
      console.log("Verify directory created");
      return true;
    })
    .catch(err => {
      throw new VError(err, `${logName} Failed to create verify directory`
                       + ` in ${rootPath}`);
    });
}

function createRollbackDir(rootPath) {
  const logName = `${moduleName}.createRollbackDir`;
  const contents =
        "This directory contains SQL scripts to rollback DB structure changes";
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
      throw new VError(err, `${logName} Failed to create rollback directory `
                       + `in ${rootPath}`);
    });
}

function isInitialised(rootPath) {
  const logName = `${moduleName}.isInitialised`;
  const planFile = path.join(rootPath, "change-plans.json");
  
  return fse.access(planFile, fse.constants.R_OK | fse.constants.W_OK)
    .then(() => {
      return true;
    })
    .catch(err => {
      if (err.code === "ENOENT") {
        return false;
      }
      throw new VError(err, `${logName} Failed to test repo init status`);
    });
}

async function initialiseRepo(rootPath) {
  const logName = `${moduleName}.initialiseRepo`;

  try {
    await createPlanFile(rootPath);
    await createApprovalFile(rootPath);
    await createChangesDir(rootPath);
    await createVerifyDir(rootPath);
    await createRollbackDir(rootPath);
    return true;
  } catch (err) {
    throw new VError(err, `${logName} Failed to initialise repository ${rootPath}`);
  }
}

function makeChangeFile(rootPath, changeRecord) {
  const logName = `${moduleName}.makeChangeFile`;
  const changeFile = path.join(rootPath, `${changeRecord.change}`);
  const content = `
-- Name:   ${changeRecord.name}
-- Author: ${changeRecord.author} <${changeRecord.authorEmail}>
-- Date:   ${changeRecord.createdDate}
-- Source: ${changeRecord.change}
-- Type:   Changes

BEGIN;

-- changes go here

COMMIT;

`;

  return fse.writeFile(changeFile, content, "utf-8")
    .catch(err => {
      throw new VError(err, `${logName} Failed to create change file ${changeRecord.change}`);
    });
}

function makeVerifyFile(rootPath, changeRecord) {
  const logName = `${moduleName}.makeVerifyFile`;
  const verifyFile = path.join(rootPath, `${changeRecord.verify}`);
  const content = `
-- Name:   ${changeRecord.name}
-- Author: ${changeRecord.author} <${changeRecord.authorEmail}>
-- Date:   ${changeRecord.createdDate}
-- Source: ${changeRecord.verify}
-- Type:   Verify

-- verify code go here

`;

  return fse.writeFile(verifyFile, content, "utf-8")
    .catch(err => {
      throw new VError(err, `${logName} Failed to create verify file ${changeRecord.change}`);
    });
}

function makeRollbackFile(rootPath, changeRecord) {
  const logName = `${moduleName}.makeRollbackFile`;
  const rollbackFile = path.join(rootPath, `${changeRecord.rollback}`);
  const content = `
-- Name:   ${changeRecord.name}
-- Author: ${changeRecord.author} <${changeRecord.authorEmail}>
-- Date:   ${changeRecord.createdDate}
-- Source: ${changeRecord.rollback}
-- Type:   Rollback

BEGIN;

-- rollback of changes go here

COMMIT;

`;

  return fse.writeFile(rollbackFile, content, "utf-8")
    .catch(err => {
      throw new VError(err, `${logName} Failed to create rollback file ${changeRecord.rollback}`);
    });
}


function createChangeFiles(root, changeRecord) {
  const logName = `${moduleName}.createchangeFiles`;

  return makeChangeFile(root, changeRecord)
    .then(() => {
      return makeVerifyFile(root, changeRecord);
    })
    .then(() => {
      return makeRollbackFile(root, changeRecord);
    })
    .catch(err => {
      throw new VError(err, `${logName} Failed to create change files`);
    });
}

module.exports = {
  isInitialised,
  initialiseRepo,
  createChangeFiles
};
