"use strict";

const chalk = require("chalk");

function menuHeading(txt) {
  console.log(`\n\t${chalk.underline.yellow(txt)}\n`);
}

function heading(txt) {
  console.log(`\n\t${chalk.underline.cyan(txt)}\n`);
}

function status(state) {
  let repo = chalk`{bold ${state.currentRepository()}}`;
  let target = chalk`{bold ${state.currentTarget()}}`;
  let [type, name, id] = state.currentPlan() === "?:?:?" ?
    ["", "Undefined", ""] : state.currentPlan().split(":");
  let planStr = chalk`{bold ${name}} ${type} (${id})`;
  console.log(chalk`\n{inverse == Repository: ${repo} Target: ${target} Plan: ${planStr} ==}`);
}

function errorMsg(title, msg) {
  console.log(chalk`\n\t{bgRed {yellowBright ${title}}}`);
  console.log(`\n${msg}`);
}

function warningMsg(title, msg) {
  console.log(chalk`\n\t{yellowBright ${title}}`);
  console.log(`\n${msg}`);
}

function infoMsg(title, msg) {
  console.log(chalk`\n\t{cyan ${title}}`);
  console.log(`\n${msg}`);
}

module.exports = {
  menuHeading,
  heading,
  status,
  errorMsg,
  warningMsg,
  infoMsg
};
