"use srict";

const expect = require("chai").expect;
const should = require("chai").should();
const Approval = require("../src/Approval");

describe("Test Approval object", function() {
  describe("Test Approval cnstruction", function() {
    let aObj, testApproval;
    
    before("Setup construction test data", function() {
      aObj = {
        approved: true,
        approvedDate: "2018-11-25 09:10:11",
        approvedSha: "somesha",
        approvers: [{
          approvedDate: "2018-11-25 09:10:12",
          author: "Billy Childish",
          email: "billy@example.com",
          versionSha: "someversionsha"
        }]
      };
      testApproval = new Approval();
    });
    
    it("Construct Approval object", function() {
      expect(new Approval()).to.be.an.instanceof(Approval);      
    });

    it("From object", function() {
      testApproval.fromObject(aObj);
      expect(testApproval.approved).to.equal(aObj.approved);
      expect(testApproval.approvedDate).to.equal(aObj.approvedDate);
      expect(testApproval.approvedSha).to.equal(aObj.approvedSha);
      expect(testApproval.approvers).to.deep.equal(aObj.approvers);
    });
  });

  describe("Test object methods", function() {
    let testApproval;
    let author1, email1, sha1, date1;
    let author2, email2, sha2, date2;
    
    before("method test data setup", function() {
      author1 = "Tav Falco";
      email1 = "tav@example.com";
      sha1 = "version1sha";
      date1 = "2019-01-02 03:04:05";
      author2 = "Alex Chilton";
      email2 = "alex@example.com";
      sha2 = "version2sha";
      date2 = "2019-02-03 04:05:06";
      testApproval = new Approval();
    });

    it("Add approver adds an approver", function() {
      testApproval.addApprover(author1, email1, sha1, date1);
      expect(testApproval.approvers[0].author).to.equal(author1);
      expect(testApproval.approvers[0].email).to.equal(email1);
      expect(testApproval.approvers[0].versionSha).to.equal(sha1);
      expect(testApproval.approvers[0].approvedDate).to.equal(date1);
    });

    it("Approver count gives correct count", function() {
      testApproval.addApprover(author2, email2, sha2, date2);
      expect(testApproval.approvalCount()).to.equal(2);
    });

    it("Set approval state", function() {
      testApproval.setApprovalState(true, "newAppSha", "2019-03-04 05:06:07");
      expect(testApproval.approved).to.equal(true);
      expect(testApproval.approvedSha).to.equal("newAppSha");
      expect(testApproval.approvedDate).to.equal("2019-03-04 05:06:07");
    });
  });
});
