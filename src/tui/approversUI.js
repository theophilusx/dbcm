"use strict";

const moduleName = "approversUI";

const VError = require("verror");
const menu = require("./utils/textMenus");

const appTypeQ = [
  {
    type: "confirm",
    name: "hasApproval",
    message: "Do changes need to be approved:",
  },
  {
    type: "list",
    name: "approvalType",
    choices: [
      {
        name: "Any single approver can approve change",
        value: "any"
      },
      {
        name: "All listed approvers must approve the change",
        value: "all"
      }
    ],
    message: "Approval Type:",
    when: answers => {
      return answers.hasApproval;
    }
  }];

const appMemberQ = [
  {
    type: "input",
    name: "name",
    message: "Approver name:"
  },
  {
    type: "input",
    name: "email",
    message: "Approver email:"
  }];


function typeActions(state) {
  const logName = `${moduleName}.typeActions`;
  
  return async answers => {
    try {
      if (!answers.hasApproval) {
        return state;
      }
      state.currentRepositoryDef().setApprovalType(answers.approvalType);
      let approverList = await menu.collectionMenu(
        "Approvers",
        appMemberQ
      );
      state.currentRepositoryDef().setApprovers(approverList);
      await state.currentRepositoryDef().writeApprovers();
      return state;
    } catch (err) {
      throw new VError(err, `${logName}`);
    }
  };
}

async function getApprovalConfig(state) {
  const logName = `${moduleName}.getApprovalType`;

  try {
    state = await menu.genericMenu(state, "Approval Configuration", appTypeQ, typeActions);
    return state;
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
}

module.exports = {
  getApprovalConfig
};

