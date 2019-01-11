"use strict";

const chalk = require("chalk");
const boxen = require("boxen");
const cliWidth = require("cli-width");
const wrapAnsi = require("wrap-ansi");

const boxOptions = {
  padding: 1,
  float: "center",
  align: "left"
};

function menuHeading(txt) {
  let width = cliWidth({defaultWidth: 80});
  let paddingSize = (width - txt.length) / 2;
  let padding = " ".repeat(paddingSize);
  console.log(`${padding}${chalk.underline.yellow(txt)}\n`);
}

function heading(txt) {
  let width = cliWidth({defaultWidth: 80});
  let paddingSize = (width - txt.length) / 2;
  let padding = " ".repeat(paddingSize);
  console.log(`${padding}${chalk.underline.cyan(txt)}\n`);
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
  let width = cliWidth({defaultWidth: 80});
  let txt = wrapAnsi(msg.trim().replace(/\t+/g, ""), width - 5, {hard: true});
  
  console.log(boxen(chalk`{red ${title.trim()}}\n\n${txt}`, boxOptions));
}

function warningMsg(title, msg) {
  let width = cliWidth({defaultWidth: 80});
  let txt = wrapAnsi(msg.trim().replace(/\t+/g, ""), width - 5, {hard: true});
  
  console.log(boxen(chalk`{yellowBright ${title.trim()}}\n\n${txt}`, boxOptions));
}

function infoMsg(title, msg) {
  let width = cliWidth({defaultWidth: 80});
  let txt = wrapAnsi(msg.trim().replace(/\t+/g, ""), width - 5, {hard: true});

  console.log(boxen(chalk`{cyan ${title.trim()}}\n\n${txt}`, boxOptions));
}

module.exports = {
  menuHeading,
  heading,
  status,
  errorMsg,
  warningMsg,
  infoMsg
};
