"use strict";

const moduleName = "Plan";

const VError = require("verror");
const moment = require("moment");
const path = require("path");
const short = require("short-uuid");
const Table = require("cli-table3");
const chalk = require("chalk");
const ApprovalHistory = require("./ApprovalHistory");
const assert = require("assert");
const cliWidth = require("cli-width");

function Plan(params) {
  const logName = `${moduleName}.Plan`;

  try {
    assert.ok(params, "Missing parameter object for Plan constructor");
    assert.ok(params.name, "Missing plan name argument");
    assert.ok(params.description, "Missing pln description argument");
    assert.ok(params.author, "Missing author argument");
    assert.ok(params.authorEmail, "Missing authorEmail argument");
    this.uuid = params.uuid ? params.uuid : short().new();
    this.name = params.name;
    this.version = params.version ? params.version : "0.0.1";
    this.description = params.description;
    this.createdDate = params.createdDate
      ? params.createdDate
      : moment().format("YYYY-MM-DD HH:mm:ss");
    this.author = params.author;
    this.authorEmail = params.authorEmail;
    this.planType = params.planType ? params.planType : "Development";
    if (params.approvals) {
      this.approvals = new ApprovalHistory(
        params.approvals.current,
        params.approvals.history
      );
    } else {
      this.approvals = new ApprovalHistory();
    }
    this.change = params.change
      ? params.change
      : path.join("changes", `${params.name.replace(/\s+/g, "-")}.sql`);
    this.verify = params.verify
      ? params.verify
      : path.join("verify", `${params.name.replace(/\s+/g, "-")}.sql`);
    this.rollback = params.rollback
      ? params.rollback
      : path.join("rollback", `${params.name.replace(/\s+/g, "-")}.sql`);
    this.doc = params.doc
      ? params.doc
      : path.join("doc", `${params.name.replace(/\s+/g, "-")}.md`);
  } catch (err) {
    throw new VError(err, `${logName} Params:`);
  }
}

Plan.prototype.setCreatedDate = function() {
  const logName = `${moduleName}.setCreatedDate`;

  try {
    return (this.createdDate = moment().format("YYYY-MM-DD HH:mm:ss"));
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

Plan.prototype.setType = function(type) {
  const logName = `${moduleName}.setType`;

  try {
    if (
      type === "Development" ||
      type === "Pending" ||
      type === "Approved" ||
      type === "Rejected"
    ) {
      return (this.planType = type);
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
  return this.approvals.addCurrentApproval(author, email, sha);
};

Plan.prototype.resetApproval = function() {
  return this.approvals.resetApproval();
};

Plan.prototype.textDisplay = function() {
  const logName = `${moduleName}.textDisplay`;
  const width = cliWidth({defaultWidth: 80}) - 5;
  const dataWidth = width - 16;
  try {
    const table = new Table({colWidths: [15, dataWidth], wordWrap: true});
    table.push(
      {"Created Date": chalk.green(this.createdDate)},
      {Author: chalk.green(this.author)},
      {"Plan Name": chalk.green(this.name)},
      {UUID: chalk.green(this.uuid)},
      {Version: chalk.green(this.version)},
      {Description: chalk.green(this.description)},
      {Type: chalk.green(this.planType)},
      {Change: chalk.green(this.change)},
      {Verify: chalk.green(this.verify)},
      {Rollback: chalk.green(this.rollback)},
      {Documentation: chalk.green(this.doc)}
    );
    console.log(table.toString());
    this.approvals.currentApproval().textDisplay();
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

Plan.prototype.approvalSHA = function() {
  return this.approvals.currentApprovalSHA;
};

Plan.prototype.summaryLine = function() {
  const logName = `${moduleName}.summaryLine`;
  const width = cliWidth({defaultWidth: 80}) - 35;
  const nameWidth = this.name.length;
  const authorWidth = this.author.length;
  const versionWidth = this.version.length;
  const typeWidth = this.planType.length;
  const overRun = width - nameWidth - authorWidth - versionWidth - typeWidth;

  try {
    let name = this.name;
    let author = this.author;
    if (overRun < 0) {
      let x = Math.abs(Math.floor(overRun));
      let y = Math.floor(x / 2) + 2;
      let z = x - y + 2;
      author = author.substring(0, authorWidth - y) + "..";
      name = name.substring(0, nameWidth - z) + "..";
    }
    let line =
      `${name} : ${author} : ${this.version} : ` +
      `${this.createdDate} : ${this.planType}`;
    return line;
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

Plan.prototype.fromObject = function(pObj) {
  const logName = `${moduleName}.fromObject`;

  try {
    this.uuid = pObj.uuid;
    this.name = pObj.name;
    this.description = pObj.description;
    this.version = pObj.version;
    this.createdDate = pObj.createdDate;
    this.author = pObj.author;
    this.authorEmail = pObj.authorEmail;
    this.planType = pObj.planType;
    this.approvals.fromObject(pObj.approvals);
    this.change = pObj.change;
    this.verify = pObj.verify;
    this.rollback = pObj.rollback;
    this.doc = pObj.doc;
  } catch (err) {
    throw new VError(err, `${logName} Failed to create plan from object`);
  }
};

Plan.prototype.toObject = function() {
  const logName = `${moduleName}.toObject`;

  try {
    let pObj = {
      uuid: this.uuid,
      name: this.name,
      version: this.version,
      description: this.description,
      createdDate: this.createdDate,
      author: this.author,
      authorEmail: this.authorEmail,
      planType: this.planType,
      approvals: this.approvals.toObject(),
      change: this.change,
      verify: this.verify,
      rollback: this.rollback,
      doc: this.doc
    };
    return pObj;
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

module.exports = Plan;
