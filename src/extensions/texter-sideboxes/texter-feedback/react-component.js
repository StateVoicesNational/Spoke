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
import IconButton from "material-ui/IconButton/IconButton";
import AddIcon from "material-ui/svg-icons/content/add-circle";
import RemoveIcon from "material-ui/svg-icons/content/remove-circle";
import DoneIcon from "material-ui/svg-icons/action/done";
import { css } from "aphrodite";
import GSForm from "../../../components/forms/GSForm";
import { withRouter } from "react-router";
import loadData from "../../../containers/hoc/load-data";
import isEqual from "lodash/isEqual";
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
  // only show if in review mode and an admin
  return true;
};

const schema = yup.object({
  feedback: yup.object({
    message: yup.string(),
    issueCounts: yup.object({
      optOuts: yup.number(),
      tags: yup.number(),
      responses: yup.number(),
      hostile: yup.number()
    })
  })
});

export class TexterSideboxClass extends React.Component {
  constructor(props) {
    super(props);
    this.state = { feedback: props.assignment.feedback };
  }

  async componentDidUpdate(prevProps, prevState) {
    if (isEqual(prevState, this.state)) return;

    let feedbackString = JSON.stringify(this.state.feedback);
    console.log("componentDidUpdate: ", this.state.feedback);
    await this.props.mutations.updateFeedback(feedbackString);
  }

  render() {
    const { assignment } = this.props;
    const { message, issueCounts } = this.state.feedback;
    const { optOuts, tags, responses, hostile } = issueCounts;

    console.log("state on render: ", this.state);

    const IssueCounter = ({ value, issueType }) => {
      return (
        <div>
          <IconButton
            disabled={!value}
            onClick={() => {
              this.setState({
                feedback: {
                  ...this.state.feedback,
                  issueCounts: {
                    ...issueCounts,
                    [issueType]: issueCounts[issueType] - 1
                  }
                }
              });
            }}
          >
            <RemoveIcon />
          </IconButton>
          {issueCounts[issueType]}
          <IconButton
            onClick={() => {
              this.setState({
                feedback: {
                  ...this.state.feedback,
                  issueCounts: {
                    ...issueCounts,
                    [issueType]: issueCounts[issueType] + 1
                  }
                }
              });
            }}
          >
            <AddIcon />
          </IconButton>
        </div>
      );
    };

    return (
      <div>
        <h3>Feedback</h3>
        <GSForm
          schema={schema}
          value={this.state}
          onChange={formValues => {
            console.log("form values: ", formValues);
            this.setState(formValues);
          }}
          onSubmit={async () => {
            let feedbackString = JSON.stringify(this.state.feedback);
            console.log("feedback on submit: ", this.state.feedback);
            await this.props.mutations.updateFeedback(feedbackString);
          }}
        >
          <Form.Field name="feedback.message" fullWidth multiLine />
          Opt Out errors:
          <IssueCounter value={issueCounts.optOuts} issueType="optOuts" />
          Tag errors:
          <IssueCounter value={issueCounts.tags} issueType="tags" />
          Response errors:
          <IssueCounter value={issueCounts.responses} issueType="responses" />
          Hostile errors:
          <IssueCounter value={issueCounts.hostile} issueType="hostile" />
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
          feedback {
            message
            issueCounts {
              optOuts
              tags
              responses
              hostile
            }
          }
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
