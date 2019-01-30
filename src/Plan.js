"use strict";

const moduleName = "Plan";

const VError = require("verror");
const moment = require("moment");
const path = require("path");
const short = require("short-uuid");
const Table = require("cli-table3");
const chalk = require("chalk");
const ApprovalHistory = require("./ApprovalHistory");

function Plan(initData) {
  const logName = `${moduleName}.Plan`;

  try {
    if (initData.name && initData.description
        && initData.author && initData.email) {
      this.uuid = initData.uuid ? initData.uuid : short().new();
      this.name = initData.name;
      this.description = initData.description;
      this.createdDate = initData.createdDate ?
        initData.creaedDate : moment().format("YYYY-MM-DD HHm:m:ss");
      this.author = initData.author;
      this.authorEmail = initData.email;
      this.planType = initData.planType ? initData.planType : "Development";
      this.approvals = new ApprovalHistory(),
      this.change = path.join(
        "change",
        `${initData.name.replace(/\s+/g, "-")}.sql`
      );
      this.verify = path.join(
        "verify",
        `${initData.name.replace(/\s+/g, "-")}.sql`
      );
      this.rollback = path.join(
        "rollback",
        `${initData.name.replace(/\s+/g, "-")}.sql`
      );
    }
    throw new Error("Must provide at least name, description, author and email "
                    + "properties when initialising a new Plan object");
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
}

Plan.prototype.setType = function(type) {
  const logName = `${moduleName}.setType`;

  try {
    if (type === "Development" || type === "Pending"
        || type === "Approved" || type === "Rejected") {
      this.planType = type;
    }
    throw new Error(`Unknown plan type ${type}`);
  } catch (err) {
    throw new VError(err, `${logName} Failed to set plan type`);
  }
};

Plan.prototype.currentApproval = function() {
  return this.approvals.currentApproval();
};

Plan.prototype.currentApprovalState = function() {
  return this.approvals.currentApprovalState();
};

Plan.prototype.setCurrentApprovalState = function(appState, sha, appDate) {
  return this.approvals.setCurrentApprovalState(appState, sha, appDate);
};

Plan.prototype.currentApprovalCount = function() {
  return this.approvals.currentApprovalCount();
};

Plan.prototype.addApproval = function(author, email, sha) {
  return this.approvals.addApproval(author, email, sha);
};

Plan.prototype.resetApproval = function() {
  return this.approvals.resetApproval();
};

Plan.prototype.fromObject = function(pObj) {
  const logName = `${moduleName}.fromObject`;

  try {
    this.uuid = pObj.uuid;
    this.name = pObj.name;
    this.description = pObj.description;
    this.createdDate = pObj.createdDate;
    this.author = pObj.author;
    this.authorEmail = pObj.authorEmail;
    this.planType = pObj.planType;
    this.approvals.fromObject(pObj.approvals);
    this.change = pObj.change;
    this.verify = pObj.verify;
    this.rollback = pObj.rollback;
  } catch (err) {
    throw new VError(err, `${logName} Failed to create plan from object`);
  }
};

Plan.prototype.textDisplay = function() {
  const logName = `${moduleName}.textdisplay`;

  try {
    const table = new Table();
    table.push(
      {"Created Date": chalk.green(this.createdDate)},
      {"Author": chalk.green(this.author)},
      {"Plan Name": chalk.green(this.name)},
      {"UUID": chalk.green(this.uuid)},
      {"Description": chalk.green(this.description)},
      {"Type": chalk.green(this.planType)},
      {"Change File": chalk.green(this.change)},
      {"Verify File": chalk.green(this.verify)},
      {"Rollback File": chalk.green(this.rollback)}
    );
    console.log(table.toString());
    this.approvals.currentApproval().textdisplay();
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

Plan.prototype.summaryLine = function() {
  const logName = `${moduleName}.summaryLine`;

  try {
    let line = `${this.name} : ${this.author} : ${this.cretedDate} : `
        + `${this.approvals.currentApproval().approved ? "Approved" : "Unapproved"}`;
    return line;
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

module.exports = Plan;

