import type from "prop-types";
import React from "react";
import { Link } from "react-router";
import yup from "yup";
import Form from "react-formal";
import FlatButton from "material-ui/FlatButton";
import TagChip from "../../../components/TagChip";
import theme from "../../../styles/theme";
import CheckIcon from "material-ui/svg-icons/action/check-circle";
import CircularProgress from "material-ui/CircularProgress";
import DoneIcon from "material-ui/svg-icons/action/done";
import { css } from "aphrodite";
import GSForm from "../../../components/forms/GSForm";
import { withRouter } from "react-router";
import loadData from "../../../containers/hoc/load-data";
import gql from "graphql-tag";

import {
  flexStyles,
  inlineStyles
} from "../../../components/AssignmentTexter/StyleControls";

export const displayName = () => "Texter feedback";

export const showSidebox = ({
  contact,
  campaign,
  messageStatusFilter,
  assignment
}) => {
  // Return anything False-y to not show
  // Return anything Truth-y to show
  // Return 'popup' to force a popup on mobile screens (instead of letting it hide behind a button)
  // console.log("showsidebox", messageStatusFilter, contact, campaign);
  return true;
};

const schema = yup.object({ feedback: yup.string() });

export class TexterSideboxClass extends React.Component {
  constructor(props) {
    super(props);
    this.state = { feedback: props.assignment.feedback };
  }

  render() {
    const { assignment } = this.props;
    const { feedback } = this.state;

    return (
      <div>
        <h3>Feedback</h3>
        <GSForm
          schema={schema}
          value={this.state}
          onChange={formValues => this.setState(formValues)}
          onSubmit={() => {
            this.props.mutations.updateFeedback(this.state.feedback);
          }}
        >
          <Form.Field name="feedback" fullWidth multiLine />
          <Form.Button type="submit" label="save" disabled={false} />
        </GSForm>
      </div>
    );
  }
}

TexterSideboxClass.propTypes = {
  // data
  contact: type.object,
  campaign: type.object,
  assignment: type.object,
  texter: type.object,

  // parent state
  disabled: type.bool,
  navigationToolbarChildren: type.object,
  messageStatusFilter: type.string,
  onUpdateTags: type.func
};

export const mutations = {
  updateFeedback: ownProps => feedback => ({
    mutation: gql`
      mutation updateFeedback($assignmentId: String!, $feedback: String!) {
        updateFeedback(assignmentId: $assignmentId, feedback: $feedback) {
          id
          feedback
        }
      }
    `,
    variables: {
      assignmentId: ownProps.assignment.id,
      feedback
    }
  })
};

export const TexterSidebox = loadData({ mutations })(
  withRouter(TexterSideboxClass)
);
