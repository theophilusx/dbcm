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

function Plan({uuid, name, description, author, email, createdDate, planType}) {
  const logName = `${moduleName}.Plan`;

  try {
    assert.ok(name, "Missing plan name argument");
    assert.ok(description, "Missing pln description argument");
    assert.ok(author, "Missing author argument");
    assert.ok(email, "Missing email argument");
    this.uuid = uuid ? uuid : short().new();
    this.name = name;
    this.description = description;
    this.createdDate = createdDate ? createdDate : moment().format("YYYY-MM-DD HH:mm:ss");
    this.author = author;
    this.authorEmail = email;
    this.planType = planType ? planType : "Development";
    this.approvals = new ApprovalHistory(),
    this.change = path.join(
      "changes",
      `${name.replace(/\s+/g, "-")}.sql`
    );
    this.verify = path.join(
      "verify",
      `${name.replace(/\s+/g, "-")}.sql`
    );
    this.rollback = path.join(
      "rollback",
      `${name.replace(/\s+/g, "-")}.sql`
    );
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

Plan.prototype.textDisplay = function() {
  const logName = `${moduleName}.textDisplay`;

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
    this.approvals.currentApproval().textDisplay();
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

Plan.prototype.summaryLine = function() {
  const logName = `${moduleName}.summaryLine`;

  try {
    let line = `${this.name} : ${this.author} : ${this.createdDate} : `
        + `${this.planType} : ${this.approvals.currentApproval().approved ? "Approved" : "Unapproved"}`;
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

Plan.prototype.toObject = function() {
  const logName = `${moduleName}.toObject`;

  try {
    let pObj = {
      uuid: this.uuid,
      name: this.name,
      description: this.description,
      createdDate: this.createdDate,
      author: this.author,
      authorEmail: this.authorEmail,
      planType: this.planType,
      approvals: this.approvals.toObject(),
      change: this.change,
      verify: this.verify,
      rollback: this.rollback
    };
    return pObj;
  } catch (err) {
   throw new VError(err, `${logName}`);
  }
};

module.exports = Plan;

