"use strict";

const VError = require("verror");
const expect = require("chai").expect;
const should = require("chai").should();
const {Target} = require("../src/Target");
const {TargetMap} = require("../src/TargetMap");

describe("Create TargetMap object", function() {
  it("Default object creation", function() {
    expect(new TargetMap()).to.be.an("object");
    expect(new TargetMap()).to.have.key("targets");
  });
  it("Initialised object creation", function() {
    let t1 = new Target("tName1", "dbName1", "dbUser1", "dbPwd1");
    let t2 = new Target("tName2", "dbName2", "dbUser2", "dbPwd2");
    let tm = new TargetMap([t1, t2]);
    expect(tm).to.be.an("object");
    expect(tm).to.have.key("targets");
    expect(tm.targets.size).to.equal(2);
  });
});

describe("Test TargetMap methods", function() {
  let t1 = new Target("tName1", "dbName1", "dbUser1", "dbPwd1");
  let t2 = new Target("tName2", "dbName2", "dbUser2", "dbPwd2");
  let t3 = new Target("tName3", "dbName3", "dbUser3", "dbPwd3");
  let tm = new TargetMap([t1, t2]);
  describe("Get", function() {
    it("Non existent returns undefined", function() {
      expect(tm.get("notExist")).to.equal(undefined);      
    });
    it("Existing returns target object", function() {
      expect(tm.get("tName1")).to.be.an("object");
      expect(tm.get("tName1")).to.include.all.keys(
        "name",
        "database",
        "host",
        "port",
        "user",
        "password"
      );
      expect(tm.get("tName2")).to.deep.equal(t2);
    });
  });
  describe("Set", function() {
    describe("Add new target", function() {
      tm.set(t3);
      it("Targets increased by 1", function() {
        expect(tm.targets.size).to.equal(3);        
      });
      it("Can retrieve new target", function() {
        expect(tm.get("tName3")).to.be.an("object");        
      });
      it("Verify returned target has right keys", function() {
        expect(tm.get("tName3")).to.include.all.keys(
          "name",
          "database",
          "host",
          "port",
          "user",
          "password"
        );
      });
      it("Verify returns correct target", function() {
        expect(tm.get("tName3")).to.deep.equal(t3);
      });
    });
  });
  describe("names()", function() {
    it("names() returns array", function() {
      expect(tm.names()).to.be.an("array");
    });
    it("Names length is 3", function() {
      expect(tm.names().length).to.equal(3);
    });
    it("Returns all names", function() {
      expect(tm.names()).includes("tName1", "tName2", "tName3");
    });
  });
  describe("toArray()", function() {
    it("Returns array", function() {
      expect(tm.toArray()).is.an("array");
    });
    it("Has correct number of elements", function() {
      expect(tm.toArray().length).to.equal(3);
    });
    it("Has correct elements", function() {
      expect(tm.toArray()).to.deep.equal([t1, t2, t3]);
    });
  });
  describe("targetParams()", function() {
    it("returns object", function() {
      expect(tm.targetParams("tName1")).to.be.an("object");
    });
    it("returns correct params", function() {
      expect(tm.targetParams("tName2")).to.deep.equal(t2.params());
    });
  });
  describe("fromArrayu()", function() {
    let b1 = new Target("n1", "db1", "u1", "pwd1");
    let b2 = new Target("n2", "db2", "u2", "pwd2");
    let b3 = new Target("n3", "db3", "u3", "pwd3");
    it("Re-initialise object", function() {
      expect(tm.fromArray([b1, b2, b3])).to.be.an("object");
    });
    it("Has 3 targets", function() {
      expect(tm.targets.size).to.equal(3);
    });
    it("has correct elements", function() {
      expect(tm.toArray()).to.deep.equal([b1, b2, b3]);
    });
  });
});
