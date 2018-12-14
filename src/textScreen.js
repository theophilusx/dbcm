"use strict";

const chalk = require("chalk");
const sprintf = require("sprintf-js").sprintf;

function menuHeading(txt) {
  console.log(`\n\t${chalk.underline.yellow(txt)}\n`);
}

function heading(txt) {
  console.log(`\n\t${chalk.underline.cyan(txt)}\n`);
}

function status(state) {
  let repo = chalk`{bold ${state.currentRepository()}}`;
  let target = chalk`{bold ${state.currentTarget()}}`;
  let line = sprintf("== %10s %-30s    %10s %-30s ==", "Repository", repo, "Target", target);
  console.log(chalk`\n{inverse ${line}}`);
}

function errorMsg(title, msg) {
  console.log(chalk`\n\t{bgRed {yellowBright ${title}}}`);
  console.log(`\n${msg}\n`);
}

function warningMsg(title, msg) {
  console.log(chalk`\n\t{yellowBright ${title}}`);
  console.log(`\n${msg}\n`);
}

function infoMsg(title, msg) {
  console.log(chalk`\n\t{cyan ${title}}`);
  console.log(`\n${msg}\n`);
}

module.exports = {
  menuHeading,
  heading,
  status,
  errorMsg,
  warningMsg,
  infoMsg
};
