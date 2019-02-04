"use strict";

const moduleName = "Approval";

const moment = require("moment");
const VError = require("verror");
const Table = require("cli-table3");
const chalk = require("chalk");

function Approval(params) {
  this.approved = params.approved ? params.approved : false;
  this.approvedDate = params.approvedDate ?
    params.approvedDate : moment().format("YYYY-MM-DD HH:mm:ss");
  this.approvedSha = params.approvedSha ? params.approvedSha : "",
  this.releaseTag = params.releaseTag ? params.releaseTag : "0.0.0", 
  this.approvers = [];
}

Approval.prototype.addApprover = function(author, email, sha) {
  this.approvers.push({
    approvedDate: moment().format("YYYY-MM-DD HH:mm:ss"),
    author: author,
    email: email,
    versionSha: sha
  });
};

Approval.prototype.approvalCount = function() {
  return this.approvers.length;
};

Approval.prototype.setApprovalState = function(state, sha, appDate) {
  this.approved = state;
  this.approvedDate = appDate === undefined ? moment().format("YYYY-MM-DD HH:mm:ss") : appDate;
  this.approvedSha = sha;
};

Approval.prototype.setReleaseTag = function(tag) {
  return this.releaseTag = tag;
};

Approval.prototype.textDisplay = function() {
  const logName = `${moduleName}.textDisplay`;

  try {
    const table = new Table();
    table.push({"Approved": this.approved ? chalk.green("Yes") : chalk.red("No")});
    if (this.approved) {
      table.push(
        {"Approved Date": chalk.green(this.approvedDate)},
        {"Approved SHA": chalk.green(this.approvedSha)},
        {"Release Tag": chalk.green(this.releaseTag)}
      );
      let appList = this.approvers.map(a => {
        return `${a.author} <${a.email}> on ${a.approvedDate}`;
      });
      table.push({"Approvers": chalk.green(appList.join("\n"))});
    }
    console.log(table.toString());
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

Approval.prototype.fromObject = function(p) {
  this.approved = p.approved;
  this.approvedDate = p.approvedDate;
  this.approvedSha = p.approvedSha;
  this.approvers = p.approvers;
};

module.exports = Approval;

