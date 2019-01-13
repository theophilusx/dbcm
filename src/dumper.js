"use strict";

const moduleName = "dumper";

const AppState = require("./AppState");
const {GitRepo} = require("./GitRepo");
const Plan = require("./Plan");
const PlanMap = require("./PlanMap");
const Repository = require("./Repository");
const RepositoryMap = require("./RepositoryMap");
const Target = require("./Target");
const TargetMap = require("./TargetMap");

function getType(v) {
  const logName = `${moduleName}.getType`;
  
  switch (typeof v) {
  case "boolean":
  case "number":
  case "string":
  case "symbol":
  case "undefined":
  case "function":
    return typeof v;
  case "object":
    if (Array.isArray(v)) {
      return "array";
    } else if (v instanceof AppState) {
      return "AppState";
    } else if (v instanceof GitRepo) {
      return "GitRepo";
    } else if (v instanceof Plan) {
      return "Plan";
    } else if (v instanceof PlanMap) {
      return "PlanMap";
    } else if (v instanceof Repository) {
      return "Repository";
    } else if (v instanceof RepositoryMap) {
      return "RepositoryMap";
    } else if (v instanceof Target) {
      return "Target";
    } else if (v instanceof TargetMap) {
      return "TargetMap";
    } else if (v instanceof Map) {
      return "map";
    } else if (v instanceof Set) {
      return "set";
    } else {
      return "object";
    }
  default:
    throw new Error(`${logName} Unrecognised object type: ${v}`);
  }
}

function dumpBoolean(v) {
  return `[bool] ${v}`;
}

function dumpNumber(v) {
  return `[num] ${v}`;
}

function dumpString(v) {
  return `[str] ${v}`;
}

function dumpSymbol(v) {
  return `[sym] ${v}`;
}

function dumpUndefined(v) {
  return "[undefined]";
}

function dumpFunction(v) {
  return `[func] ${v}`;
}

function dumpValue(v, indent="", name="") {
  const type = getType(v);
  switch(type) {
  case "boolean":
    return `${indent}${name} ${dumpBoolean(v)}`;
  case "number":
    return `${indent}${name} ${dumpNumber(v)}`;
  case "string":
    return `${indent}${name} ${dumpString(v)}`;
  case "symbol":
    return `${indent}${name} ${dumpSymbol(v)}`;
  case "undefined":
    return `${indent}${name} ${dumpUndefined(v)}`;
  case "function":
    return `${indent}${name} ${dumpFunction(v)}`;
  case "array": {
    let data = [];
    let cnt = 0;
    data.push(`${indent}${name} [array] [`);
    v.forEach(el => {
      data.push(dumpValue(el, indent + " ", `${cnt}:`));
      cnt++;
    });
    data.push(`${indent}]`);
    return data.join("\n");
  }
  case "map": {
    let data = [];
    data.push(`${indent}${name} [map] {`);
    for (let [k, value] of v.entries()) {
      data.push(dumpValue(value, `${indent} `, k));
    }
    data.push(`${indent}}`);
    return data.join("\n");
  }
  default: {
    let data = [];
    data.push(`${indent}${name} [${type}] {`);
    for (let [p, value] of Object.entries(v)) {
      data.push(dumpValue(value, `${indent} `, p));
    }
    data.push(`${indent}}`);
    return data.join("\n");
  }
  }
}

module.exports = {
  dumpValue
};


