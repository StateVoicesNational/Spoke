import type from "prop-types";
import React from "react";
import { withRouter } from "react-router";
import loadData from "../../../containers/hoc/load-data";

export const displayName = () => "Allow bulk send for this campaign";

export const showSidebox = () => {
  return true;
};

export class TexterSideboxClass extends React.Component {
  gotoInitials = () => {
    const { campaign, assignment } = this.props;
    this.props.router.push(
      `/app/${campaign.organization.id}/todos/${assignment.id}/text`
    );
  };

  gotoReplies = () => {
    const { campaign, assignment } = this.props;
    this.props.router.push(
      `/app/${campaign.organization.id}/todos/${assignment.id}/reply`
    );
  };

  gotoTodos = () => {
    const { campaign } = this.props;
    this.props.router.push(`/app/${campaign.organization.id}/todos`);
  };

  render() {
    return null;
  }
}

TexterSideboxClass.propTypes = {
  router: type.object,
  mutations: type.object,

  // data
  contact: type.object,
  campaign: type.object,
  assignment: type.object,
  texter: type.object,

  // parent state
  navigationToolbarChildren: type.object,
  messageStatusFilter: type.string
};

export const mutations = {};

export const TexterSidebox = loadData({ mutations })(
  withRouter(TexterSideboxClass)
);
