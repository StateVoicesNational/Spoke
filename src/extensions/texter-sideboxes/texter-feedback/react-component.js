import PropTypes from "prop-types";
import React from "react";
import { withRouter } from "react-router";
import ReactTooltip from "react-tooltip";
import * as yup from "yup";
import Form from "react-formal";
import { gql } from "@apollo/client";
import _ from "lodash";

import AddIcon from "@material-ui/icons/Add";
import RemoveIcon from "@material-ui/icons/Remove";
import IconButton from "@material-ui/core/IconButton";
import Paper from "@material-ui/core/Paper";
import Switch from "@material-ui/core/Switch";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import CircularProgress from "@material-ui/core/CircularProgress";

import GSForm from "../../../components/forms/GSForm";
import GSTextField from "../../../components/forms/GSTextField";
import GSSubmitButton from "../../../components/forms/GSSubmitButton";
import loadData from "../../../containers/hoc/load-data";
import { defaults } from "./config";
import AssignmentTexterFeedback from "./AssignmentTexterFeedback";
import withMuiTheme from "../../../containers/hoc/withMuiTheme";

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
    issueCounts: yup.object(),
    skillCounts: yup.object()
  })
});

export class TexterSideboxClassBase extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isSaving: false,
      feedback: {
        issueCounts: {},
        skillCounts: {},
        ...props.assignment.feedback
      }
    };
  }

  inlineStyles = {
    wrapper: {
      position: "absolute",
      top: 112,
      right: 0,
      width: 340,
      padding: "0 20px 20px",
      zIndex: 999,
      borderLeft: `3px solid`,
      height: "calc(100% - 130px)",
      overflowY: "auto"
    },
    counterColumns: {
      marginTop: -20,
      display: "flex",
      justifyContent: "space-around"
    },
    counterWrapper: {
      borderRadius: 3,
      marginBottom: 8,
      padding: 6,
      height: 74,
      minWidth: 130,
      fontSize: 10
    },
    counterKey: {
      color: this.props.muiTheme.palette.error.main,
      fontSize: 13
    },
    counter: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 18
    },
    skillsWrapper: {
      padding: "10px 0 4px",
      minWidth: 170
    },
    skillCheckbox: {
      marginBottom: 10,
      padding: "6px 0"
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
    },
    saveWrapper: {
      position: "fixed",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginTop: -56,
      right: 0,
      height: 56,
      width: 384,
      background: "rgb(126, 128, 139)"
    },
    saveText: {
      fontSize: 16,
      color: "#fff"
    }
  };

  componentDidUpdate(prevProps, prevState) {
    if (
      this.state.isSaving &&
      _.isEqual(this.props.assignment.feedback, this.state.feedback)
    ) {
      this.setIsSaving(false);
    }

    if (!_.isEqual(prevState.feedback, this.state.feedback)) {
      this.debouncedUpdate();
    }
  }

  setIsSaving(isSaving) {
    this.setState({ isSaving });
  }

  debouncedUpdate = _.debounce(
    async () => {
      this.setIsSaving(true);
      await this.props.mutations.updateFeedback(this.state.feedback);
      if (this.state.feedback.sweepComplete) {
        this.props.router.push(`/admin/${this.props.organizationId}/incoming`);
      }
    },
    500,
    { leading: false, trailing: true }
  );

  handleCounterChange = (type, key, direction) => {
    this.setIsSaving(true);
    this.setState(({ feedback }) => {
      const prevCount = feedback[type][key] || 0;
      /* eslint-disable no-nested-ternary */
      return {
        feedback: {
          ...feedback,
          [type]: {
            ...(feedback[type] || {}),
            [key]:
              direction === "increment"
                ? prevCount + 1
                : type === "skillCounts"
                ? 0
                : prevCount - 1
          }
        }
      };
    });
  };

  render() {
    const { feedback, isSaving } = this.state;
    const { settingsData } = this.props;
    let config = defaults;

    if (settingsData && settingsData.texterFeedbackJSON) {
      try {
        config = JSON.parse(settingsData.texterFeedbackJSON);
      } catch (err) {
        console.log("Corrupted TexterFeedback JSON", err);
      }
    }

    const Counter = ({ value, type, countKey }) => {
      return (
        <div key={countKey} style={this.inlineStyles.counter}>
          <IconButton
            disabled={!value}
            onClick={() =>
              this.handleCounterChange(type, countKey, "decrement")
            }
          >
            <RemoveIcon />
          </IconButton>
          {feedback[type][countKey] || "0"}
          <IconButton
            onClick={() =>
              this.handleCounterChange(type, countKey, "increment")
            }
          >
            <AddIcon />
          </IconButton>
        </div>
      );
    };

    return (
      <div style={this.inlineStyles.wrapper}>
        {isSaving && (
          <div style={this.inlineStyles.saveWrapper}>
            <CircularProgress size={24} style={{ marginRight: 10 }} />
            <span style={this.inlineStyles.saveText}>Saving feedback...</span>
          </div>
        )}
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
          <div style={this.inlineStyles.counterColumns}>
            {!!config.issues.length && (
              <div>
                <h3 style={{ color: this.props.muiTheme.palette.error.main }}>
                  Issues
                </h3>
                {config.issues.map(({ key, tooltip }) => {
                  const count = (Object.entries(
                    feedback.issueCounts || []
                  ).find(issueCount => issueCount[0] === key) || [])[1];

                  return (
                    <Paper key={key} style={this.inlineStyles.counterWrapper}>
                      <span
                        style={this.inlineStyles.counterKey}
                        data-tip
                        data-for={`${key}-issues`}
                      >
                        {_.startCase(key)}
                      </span>
                      <ReactTooltip id={`${key}-issues`}>
                        {tooltip}
                      </ReactTooltip>
                      <Counter
                        value={count}
                        type="issueCounts"
                        countKey={key}
                      />
                    </Paper>
                  );
                })}
              </div>
            )}
            {!!config.skills.length && (
              <div>
                <h3 style={{ color: this.props.muiTheme.palette.success.main }}>
                  Skills
                </h3>
                <Paper style={this.inlineStyles.skillsWrapper}>
                  {config.skills.map(({ key, content }) => {
                    const isChecked = !!(Object.entries(
                      feedback.skillCounts || []
                    ).find(skillCounts => skillCounts[0] === key) || [])[1];

                    return (
                      <div key={key}>
                        <FormControlLabel
                          label={_.startCase(key)}
                          labelPlacement="start"
                          control={
                            <Switch
                              color="primary"
                              checked={isChecked}
                              data-tip
                              data-for={`${key}-skills`}
                              onChange={() =>
                                this.handleCounterChange(
                                  "skillCounts",
                                  key,
                                  isChecked ? "decrement" : "increment"
                                )
                              }
                            />
                          }
                        />
                        <ReactTooltip id={`${key}-skills`} place="left">
                          {content}
                        </ReactTooltip>
                      </div>
                    );
                  })}
                </Paper>
              </div>
            )}
          </div>

          <h3>Your Feedback Message</h3>

          <Form.Field
            as={GSTextField}
            name="feedback.message"
            style={this.inlineStyles.messageInputWrapper}
            textareaStyle={this.inlineStyles.messageInput}
            fullWidth
            multiline
            rows={4}
            maxRows={6}
          />

          <Form.Submit
            style={this.inlineStyles.submitButton}
            as={GSSubmitButton}
            label="Sweep Complete"
            disabled={!feedback.message}
          />
        </GSForm>
      </div>
    );
  }
}

TexterSideboxClassBase.propTypes = {
  // data
  contact: PropTypes.object,
  campaign: PropTypes.object,
  assignment: PropTypes.object,
  texter: PropTypes.object,
  router: PropTypes.object,
  organizationId: PropTypes.string,
  settingsData: PropTypes.object,

  // parent state
  disabled: PropTypes.bool,
  navigationToolbarChildren: PropTypes.object,
  onUpdateTags: PropTypes.func,

  mutations: PropTypes.object
};

const TexterSideboxClass = withMuiTheme(TexterSideboxClassBase);

export { TexterSideboxClass };

export const mutations = {
  updateFeedback: ownProps => feedback => ({
    mutation: gql`
      mutation updateFeedback($assignmentId: String!, $feedback: JSON!) {
        updateFeedback(assignmentId: $assignmentId, feedback: $feedback) {
          id
          feedback {
            message
            issueCounts
            skillCounts
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

export const TexterSidebox = withRouter(
  loadData({ mutations })(TexterSideboxClass)
);

export const showSummary = ({ assignment }) =>
  // has feedback to acknowledge
  assignment &&
  assignment.feedback &&
  assignment.feedback.sweepComplete &&
  assignment.feedback.isAcknowledged === false
    ? // popup in summary case overrides other content and sideboxes
      "popup"
    : false;

export const SummaryComponent = AssignmentTexterFeedback;

export const adminSchema = () => ({
  texterFeedbackJSON: yup.string()
});

export class AdminConfig extends React.Component {
  render() {
    return (
      <div>
        <p>
          Enables texter feedback interface for Admins from the "Sweep
          conversations" link from Campaign Stats page for a texter. The
          feedback is then shown to the texters.
        </p>
        <Form.Field
          as={GSTextField}
          fullWidth
          name="texterFeedbackJSON"
          label="Advanced JSON config override"
        />
      </div>
    );
  }
}

AdminConfig.propTypes = {
  settingsData: PropTypes.object,
  onToggle: PropTypes.func
};
