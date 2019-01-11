"use strict";

const moment = require("moment");

function Approval() {
  this.approved = false;
  this.approvedDate = moment().format("YYYY-MM-DD HH:mm:ss");
  this.approvedSha = "",
  this.releaseTag = "0.0.0", 
  this.approvers = [];
}

Approval.prototype.addApprover = function(author, email, sha, appDate) {
  this.approvers.push({
    approvedDate: appDate === undefined ? moment().format("YYYY-MM-DD HH:mm:ss") : appDate,
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

Approval.prototype.fromObject = function(p) {
  this.approved = p.approved;
  this.approvedDate = p.approvedDate;
  this.approvedSha = p.approvedSha;
  this.approvers = p.approvers;
};

module.exports = Approval;

