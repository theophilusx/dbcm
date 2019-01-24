"use strict";

const expect = require("chai").expect;
const should = require("chai").should();
const Target = require("../src/Target");
const TargetMap = require("../src/TargetMap");

let testMap, newMap;
let testTarget1, testTarget2, testTarget3;
let testTarget4, testTarget5, testTarget6;

function initTestData() {
  testTarget1 = new Target("targetName1", "db1", "user1", "pwd1");
  testTarget2 = new Target("targetName2", "db2", "user2", "pwd2");
  testTarget3 = new Target("targetName3", "db3", "user3", "pwd3");
  testTarget4 = new Target("targetName4", "db4", "user4", "pwd4");
  testTarget5 = new Target("targetName5", "db5", "user5", "pwd5");
  testTarget6 = new Target("targetName6", "db6", "user6", "pwd6");
  testMap = new TargetMap([testTarget1, testTarget2]);
}

describe("Test TargetMap object", function() {

  describe("Plain constructor called", function() {
    it("Constructor returns an object", function() {
      expect(new TargetMap()).to.be.an("object");
    });

    it("Returned object has correct list of properties", function() {
      expect(new TargetMap()).to.have.key("targets");    
    });
  });

  describe("Constructor called with arguments", function() {
    before("Initialise test data", function() {
      initTestData();
    });

    it("Initialised object creation", function() {
      expect(testMap).to.be.an("object");
    });

    it("Object has correct properties", function() {
      expect(testMap).to.have.key("targets");      
    });

    it("Object has correct number of elements", function() {
      expect(testMap.targets.size).to.equal(2);      
    });
  });
  
  describe("Test TargetMap methods", function() {
    before("Initalise test data", function() {
      initTestData();
    });

    describe("Get method", function() {
      it("Non existent key returns undefined", function() {
        expect(testMap.get("notExist")).to.equal(undefined);      
      });

      it("Existing key returns target object", function() {
        expect(testMap.get("targetName1")).to.be.an("object");
      });

      it("Returned object has correct properties", function() {
        expect(testMap.get("targetName2")).to.include.all.keys(
          "name",
          "database",
          "host",
          "port",
          "user",
          "password"
        );
      });

      it("Returned object has same values as initialiser object", function() {
        expect(testMap.get("targetName2")).to.deep.equal(testTarget2);        
      });
    });

    describe("Set method", function() {
      describe("Add new target", function() {
        before("Add new test target", function() {
          testMap.set(testTarget3);
        });

        it("Targets increased by 1", function() {
          expect(testMap.targets.size).to.equal(3);        
        });

        it("Can retrieve new target", function() {
          expect(testMap.get("targetName3")).to.be.an("object");        
        });

        it("Verify returned target has right keys", function() {
          expect(testMap.get("targetName3")).to.include.all.keys(
            "name",
            "database",
            "host",
            "port",
            "user",
            "password"
          );
        });

        it("Verify returns correct target", function() {
          expect(testMap.get("targetName3")).to.deep.equal(testTarget3);
        });
      });
    });
    
    describe("names method", function() {
      it("names returns array", function() {
        expect(testMap.names()).to.be.an("array");
      });

      it("Names return length is correct", function() {
        expect(testMap.names().length).to.equal(3);
      });

      it("Names returns all names", function() {
        expect(testMap.names()).includes("targetName1", "targetName2", "targetName3");
      });
    });
    
    describe("toArray method", function() {

      it("Returns an array", function() {
        expect(testMap.toArray()).is.an("array");
      });

      it("Has correct number of elements", function() {
        expect(testMap.toArray().length).to.equal(3);
      });

      it("Has correct elements", function() {
        expect(testMap.toArray()).to.deep.equal([testTarget1, testTarget2, testTarget3]);
      });
    });

    describe("targetParams()", function() {

      it("returns object", function() {
        expect(testMap.targetParams("targetName1")).to.be.an("object");
      });

      it("returns correct params", function() {
        expect(testMap.targetParams("targetName2")).to.deep.equal(testTarget2.params());
      });
    });

    describe("fromArrayu method", function() {
      before("Re-initialise target map", function() {
        testMap.fromArray([testTarget4, testTarget5, testTarget6]);
      });

      it("Targets has correct number of elements", function() {
        expect(testMap.targets.size).to.equal(3);
      });

      it("has correct elements", function() {
        expect(testMap.toArray()).to.deep.equal([
          testTarget4,
          testTarget5,
          testTarget6
        ]);
      });
    });
  });

  describe("Test TargetMap -> array -> TargetMap", function() {
    before("Initialise for test", function() {
      initTestData();
      newMap = new TargetMap();
      newMap.fromArray(testMap.toArray());
    });

    it("Has correct number of targets", function() {
      expect(newMap.targets.size).to.equal(testMap.targets.size);
    });

    it("Has correct target elements", function() {
      expect(newMap.toArray()).to.deep.equal(testMap.toArray());
    });
  });
});

