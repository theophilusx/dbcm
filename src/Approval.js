"use strict";

const moment = require("moment");

function Approval() {
  this.approved = false;
  this.approvalDate = undefined;
  this.approvers = [];
}

Approval.prototype.addApprover = function(author, email, sha) {
  this.approvers.push({
    approvedOn: moment().format("YYYY-MM-DD HH:mm:ss"),
    author: author,
    email: email,
    versionSha: sha
  });
};

Approval.prototype.approvalCount = function() {
  return this.approvers.length;
};

Approval.prototype.setApprovalState = function(state, sha) {
  this.approved = state;
  this.approvalSha = sha;
  this.approvalDate = moment().format("YYYY-MM-DD HH:mm:ss");
};

Approval.prototype.fromObject = function(p) {
  this.approved = p.approved;
  this.approvedDate = p.approvedDate;
  this.approvers = p.approvers;
};

module.exports = {
  Approval
};
