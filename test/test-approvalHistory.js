"use strict";

const VError = require("verror");
const expect = require("chai").expect;
const should = require("chai").should();
const {ApprovalHistory} = require("../src/ApprovalHistory");
const {Approval} = require("../src/Approval");

describe("Test ApprovalHistory object", function() {
  describe("Test object construction", function() {
    let ah1, ah2;
    
    before("Construcion test data", function() {
      ah1 = new ApprovalHistory();
      ah2 = new ApprovalHistory();
    });
    
    it("Calling constructor returns correct instance", function() {
      expect(new ApprovalHistory()).to.be.an.instanceof(ApprovalHistory);
    });

    it("Create from object", function() {
      ah2.fromObject(ah1);
      expect(ah2).to.deep.equal(ah1);
    });
  });

  describe("Test object methods", function() {
    let ah1, ah2;
    
    before("method test data", function() {
      ah1 = new ApprovalHistory();
      ah2 = new ApprovalHistory();
    });

    it("Current approval returns Approval object", function() {
      expect(ah1.currentApproval()).to.be.an.instanceof(Approval);
    });

    it("Current approval count returns correct value", function() {
      expect(ah1.currentApprovalCount()).to.equal(0);
    });

    it("Add approval", function() {
      ah1.addApproval("Joe Strummer", "joe@example.com", "appSha");
      expect(ah1.currentApprovalCount()).to.equal(1);
    });

    it("Current approval state", function() {
      expect(ah1.currentApprovalState()).to.equal(false);
      ah1.current.approved = true;
      expect(ah1.currentApprovalState()).to.equal(true);
    });

    it("Set approval state", function() {
      ah1.setApprovalState(true, "nowApprovedSha", "2019-10-10 09:10:11");
      expect(ah1.currentApprovalState()).to.equal(true);
      expect(ah1.current.approvedDate).to.equal("2019-10-10 09:10:11");
      expect(ah1.current.approvedSha).to.equal("nowApprovedSha");
    });

    it("Reset approval state", function() {
      ah1.resetApproval();
      expect(ah1.currentApprovalCount()).to.equal(0);
      expect(ah1.history.length).to.equal(1);
      expect(ah1.currentApprovalState()).to.equal(false);
    });
  });
});
