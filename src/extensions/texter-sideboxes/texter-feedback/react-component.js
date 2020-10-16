import type from "prop-types";
import React from "react";
import { withRouter } from "react-router";
import yup from "yup";
import Form from "react-formal";
import { Paper } from "material-ui";
import IconButton from "material-ui/IconButton/IconButton";
import AddIcon from "material-ui/svg-icons/content/add-circle";
import RemoveIcon from "material-ui/svg-icons/content/remove-circle";
import GSForm from "../../../components/forms/GSForm";
import loadData from "../../../containers/hoc/load-data";
import gql from "graphql-tag";
import _ from "lodash";
import theme from "../../../styles/theme";
import issueItems from "./config";

const inlineStyles = {
  wrapper: {
    position: "absolute",
    top: 112,
    right: 0,
    width: 340,
    padding: "0 20px 20px",
    zIndex: 999,
    borderLeft: `3px solid ${theme.colors.gray}`,
    height: "85.7vh",
    overflowY: "auto"
  },
  counterColumns: {
    marginTop: -20,
    display: "flex",
    justifyContent: "space-between"
  },
  counterWrapper: {
    borderRadius: 3,
    marginBottom: 8,
    padding: 6,
    height: 74,
    fontSize: 10
  },
  counterKey: {
    color: theme.colors.blue,
    fontSize: 13
  },
  counter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18
  },
  messageInputWrapper: {
    marginTop: -20
  },
  messageInput: {
    background: "#fff",
    padding: 4
  },
  submitButton: {
    marginTop: 15,
    fontSize: "17px !important"
  }
};

export const displayName = () => "Texter feedback";

export const showSidebox = ({ currentUser, review }) => {
  // Return anything False-y to not show
  // Return anything Truth-y to show
  // Return 'popup' to force a popup on mobile screens (instead of letting it hide behind a button)
  return review === "1" && currentUser.roles.includes("ADMIN");
};

const schema = yup.object({
  feedback: yup.object({
    message: yup.string(),
    issueCounts: yup.object(
      issueItems.reduce((obj, item) => {
        /* eslint-disable no-param-reassign*/
        obj[item.key] = yup.number();
        return obj;
      }, {})
    )
  })
});

export class TexterSideboxClass extends React.Component {
  constructor(props) {
    super(props);
    this.state = { feedback: props.assignment.feedback };
  }

  componentDidUpdate(prevProps, prevState) {
    if (!_.isEqual(prevState.feedback, this.state.feedback)) {
      this.debouncedUpdate();
    }
  }

  debouncedUpdate = _.debounce(
    async () => {
      const feedbackString = JSON.stringify(this.state.feedback);
      await this.props.mutations.updateFeedback(feedbackString);
    },
    500,
    { leading: false, trailing: true }
  );

  render() {
    const { message, issueCounts } = this.state.feedback;

    const IssueCounter = ({ value, issueType }) => {
      return (
        <div style={inlineStyles.counter}>
          <IconButton
            disabled={!value}
            onClick={() => {
              this.setState({
                feedback: {
                  ...this.state.feedback,
                  issueCounts: {
                    ...issueCounts,
                    [issueType]: (issueCounts[issueType] || 0) - 1
                  }
                }
              });
            }}
          >
            <RemoveIcon />
          </IconButton>
          {issueCounts[issueType] || "0"}
          <IconButton
            onClick={() => {
              this.setState({
                feedback: {
                  ...this.state.feedback,
                  issueCounts: {
                    ...issueCounts,
                    [issueType]: (issueCounts[issueType] || 0) + 1
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
      <div style={inlineStyles.wrapper}>
        <h2>Texter Feedback</h2>
        <GSForm
          schema={schema}
          value={this.state}
          onChange={formValues => {
            this.setState(formValues);
          }}
          onSubmit={async () => {
            this.setState({
              feedback: {
                ...this.state.feedback,
                sweepComplete: true
              }
            });
          }}
        >
          <div style={inlineStyles.counterColumns}>
            <div>
              <h3>Issues</h3>
              {issueItems.map(({ key }) => {
                const count = (Object.entries(issueCounts).find(
                  issueCount => issueCount[0] === key
                ) || [])[1];

                return (
                  <Paper style={inlineStyles.counterWrapper}>
                    <span style={inlineStyles.counterKey}>
                      {_.startCase(key)}
                    </span>
                    <span> Issues</span>
                    <IssueCounter value={count} issueType={key} />
                  </Paper>
                );
              })}
            </div>
            <div>
              <h3>Mastery Skills</h3>
              {/* TODO: add masterySkills to config */}
            </div>
          </div>

          <h3>Your Feedback Message</h3>

          <Form.Field
            name="feedback.message"
            style={inlineStyles.messageInputWrapper}
            textareaStyle={inlineStyles.messageInput}
            fullWidth
            multiLine
            rows={4}
            rowsMax={6}
          />

          <Form.Button
            style={inlineStyles.submitButton}
            labelStyle={{ fontSize: 17 }}
            type="submit"
            label="Sweep Complete"
            disabled={!message}
          />
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
  onUpdateTags: type.func,

  mutations: type.object
};

export const mutations = {
  updateFeedback: ownProps => feedback => ({
    mutation: gql`
      mutation updateFeedback($assignmentId: String!, $feedback: String!) {
        updateFeedback(assignmentId: $assignmentId, feedback: $feedback) {
          id
          feedback {
            message
            issueCounts
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
