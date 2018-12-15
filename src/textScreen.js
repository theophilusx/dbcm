"use strict";

const chalk = require("chalk");
const sprintf = require("sprintf-js").sprintf;
const boxen = require("boxen");
const cliWidth = require("cli-width");

const boxOptions = {
  padding: 1,
  float: "center",
  align: "center"
};

function menuHeading(txt) {
  console.log(`\n\t${chalk.underline.yellow(txt)}\n`);
}

function heading(txt) {
  console.log(`\n\t${chalk.underline.cyan(txt)}\n`);
}

function status(state) {
  let width = cliWidth({defaultWidth: 80});
  let strLength = "Repository: ".length
      + state.currentRepository().length
      + "Target: ".length
      + state.currentTarget().length;
  let padding = " ".repeat(width - strLength - 6);
  
  let repo = chalk`{bold ${state.currentRepository()}}`;
  let target = chalk`{bold ${state.currentTarget()}}`;
  console.log(boxen(`  Repository: ${repo}${padding}Target: ${target}  `));
}

function errorMsg(title, msg) {
  console.log(boxen(chalk`\n\t{bgRed {yellowBright ${title}}}\n${msg}\n`, boxOptions));
}

function warningMsg(title, msg) {
  console.log(boxen(chalk`{yellowBright ${title}}\n\n${msg}`, boxOptions));
}

function infoMsg(title, msg) {
  console.log(boxen(chalk`\n\t{cyan ${title}}\n${msg}\n`, boxOptions));
}

module.exports = {
  menuHeading,
  heading,
  status,
  errorMsg,
  warningMsg,
  infoMsg
};
