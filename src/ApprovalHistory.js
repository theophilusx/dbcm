"use strict";

const {Approval} = require("./Approval");

function ApprovalHistory() {
  this.current = new Approval();
  this.history = [];
}

ApprovalHistory.prototype.currentApproval = function() {
  return this.current;
};

ApprovalHistory.prototype.currentApprovalCount = function() {
  return this.current.approvalCount();
};

ApprovalHistory.prototype.addApproval = function(author, email, sha) {
  return this.current.addApprover(author, email, sha);
};

ApprovalHistory.prototye.currentApprovalState = function() {
  return this.current.approved;
};

ApprovalHistory.prototype.resetApproval = function() {
  if (this.current.approvalCount() > 0) {
    this.history.push(this.current);
    this.current = new Approval();
  } else {
    this.current.approved = false;
    this.approvalDate = undefined;
  }
};

ApprovalHistory.prototype.fromObject = function(appHistory) {
  this.current.fromObject(appHistory.current);
  appHistory.history.forEach(app => {
    let newApp = new Approval();
    newApp.fromObject(app);
    this.history.push(newApp);
  });
};

module.exports = {
  ApprovalHistory
};

