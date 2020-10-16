import PropTypes from "prop-types";
import React from "react";
import { withRouter } from "react-router";
import yup from "yup";
import Form from "react-formal";
import { Paper, Checkbox } from "material-ui";
import IconButton from "material-ui/IconButton/IconButton";
import AddIcon from "material-ui/svg-icons/content/add-circle";
import RemoveIcon from "material-ui/svg-icons/content/remove-circle";
import GSForm from "../../../components/forms/GSForm";
import loadData from "../../../containers/hoc/load-data";
import gql from "graphql-tag";
import _ from "lodash";
import theme from "../../../styles/theme";
import { issues, skills } from "./config";

const inlineStyles = {
  wrapper: {
    position: "absolute",
    top: 112,
    right: 0,
    width: 340,
    padding: "0 20px 20px",
    zIndex: 999,
    borderLeft: `3px solid ${theme.colors.gray}`,
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
    color: theme.colors.red,
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
      issues.reduce((obj, item) => {
        /* eslint-disable no-param-reassign*/
        obj[item.key] = yup.number();
        return obj;
      }, {})
    ),
    skillCounts: yup.object(
      skills.reduce((obj, item) => {
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
    this.state = {
      feedback: {
        issueCounts: {},
        skillCounts: {},
        ...props.assignment.feedback
      }
    };
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

  handleCounterChange = (type, key, direction) => {
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
    const { feedback } = this.state;

    const Counter = ({ value, type, countKey }) => {
      return (
        <div key={countKey} style={inlineStyles.counter}>
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
            {!!issues.length && (
              <div>
                <h3 style={{ color: theme.colors.darkRed }}>Issues</h3>
                {issues.map(({ key }) => {
                  const count = (Object.entries(
                    feedback.issueCounts || []
                  ).find(issueCount => issueCount[0] === key) || [])[1];

                  return (
                    <Paper key={key} style={inlineStyles.counterWrapper}>
                      <span style={inlineStyles.counterKey}>
                        {_.startCase(key)}
                      </span>
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
            {!!skills.length && (
              <div>
                <h3 style={{ color: theme.colors.darkGreen }}>Skills</h3>
                <Paper style={inlineStyles.skillsWrapper}>
                  {skills.map(({ key }) => {
                    const isChecked = (Object.entries(
                      feedback.skillCounts || []
                    ).find(skillCounts => skillCounts[0] === key) || [])[1];

                    return (
                      <Checkbox
                        label={_.startCase(key)}
                        style={inlineStyles.skillCheckbox}
                        checked={isChecked}
                        onCheck={() =>
                          this.handleCounterChange(
                            "skillCounts",
                            key,
                            isChecked ? "decrement" : "increment"
                          )
                        }
                      />
                    );
                  })}
                </Paper>
              </div>
            )}
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
            disabled={!feedback.message}
          />
        </GSForm>
      </div>
    );
  }
}

TexterSideboxClass.propTypes = {
  // data
  contact: PropTypes.object,
  campaign: PropTypes.object,
  assignment: PropTypes.object,
  texter: PropTypes.object,

  // parent state
  disabled: PropTypes.bool,
  navigationToolbarChildren: PropTypes.object,
  messageStatusFilter: PropTypes.string,
  onUpdateTags: PropTypes.func,

  mutations: PropTypes.object
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

export const TexterSidebox = loadData({ mutations })(
  withRouter(TexterSideboxClass)
);
