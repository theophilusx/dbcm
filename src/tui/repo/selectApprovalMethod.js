"use strict";

const VError = require("verror");
const menu = require("../utils/textMenus");

const typeQuestions = [
  {
    type: "list",
    name: "approvalType",
    choices: [
      {
        name: "No Approval Required",
        value: "none"
      },
      {
        name: "Any Single Approver Can Approve A Change",
        value: "any"
      },
      {
        name: "All Defined Approvers Must Approve A Change",
        value: "all"
      }
    ],
    message: "Select approval type"
  }
];

const memberQuestions = [
  {
    type: "input",
    name: "name",
    message: "Approver's name"
  },
  {
    type: "input",
    name: "email",
    message: "Approver's email address"
  }
];

function actions(state) {
  const logName = "actions";

  return async answers => {
    try {
      state.currentRepositoryDef().setApprovalType(answers.approvalType);
      if (answers.approvalType !== "none") {
        let approverList = await menu.collectionMenu(
          "Define Approvers",
          memberQuestions
        );
        state.currentRepositoryDef().setApprovers(approverList);
      } else {
        state.currentRepositoryDef().setApprovers([]);
      }
      await state.currentRepositoryDef().writeApprovers();
      return state;
    } catch (err) {
      throw new VError(err, `${logName}`);
    }
  };
}

async function selectApprovalMethod(state) {
  const logName = "seletApprovalMethod";

  try {
    state = await menu.genericMenu(
      state,
      "Approval Method",
      typeQuestions,
      actions);
    return state;
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
}

module.exports = selectApprovalMethod;

