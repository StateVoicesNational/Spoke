import PropTypes from "prop-types";
import React from "react";
import loadData from "./hoc/load-data";
import gql from "graphql-tag";
import Paper from "material-ui/Paper";
import { Step, Stepper, StepLabel, StepContent } from "material-ui/Stepper";
import FlatButton from "material-ui/FlatButton";
import RaisedButton from "material-ui/RaisedButton";
import Divider from "material-ui/Divider";
import { withRouter } from "react-router";

class Terms extends React.Component {
  handleTermsAgree = async () => {
    const { data, router, mutations, location } = this.props;
    const userData = await mutations.userAgreeTerms(data.currentUser.id);
    if (userData.data.userAgreeTerms.terms) {
      router.push(location.query.next);
    }
  };

  state = {
    finished: false,
    stepIndex: 0
  };

  handleNext = () => {
    const { stepIndex } = this.state;
    this.setState({
      stepIndex: stepIndex + 1,
      finished: stepIndex >= 2
    });
    if (stepIndex >= 2) this.handleTermsAgree();
  };

  handlePrev = () => {
    const { stepIndex } = this.state;
    if (stepIndex > 0) {
      this.setState({ stepIndex: stepIndex - 1 });
    }
  };

  renderStepActions(step) {
    const { stepIndex } = this.state;

    return (
      <div style={{ margin: "12px 0" }}>
        <RaisedButton
          label={stepIndex === 2 ? "Agree" : "Next"}
          disableTouchRipple
          disableFocusRipple
          primary
          onClick={this.handleNext}
          style={{ marginRight: 12 }}
        />
        {step > 0 && (
          <FlatButton
            label="Back"
            disabled={stepIndex === 0}
            disableTouchRipple
            disableFocusRipple
            onClick={this.handlePrev}
          />
        )}
      </div>
    );
  }

  render() {
    const { finished, stepIndex } = this.state;

    return (
      <div style={{ maxWidth: 380, maxHeight: 400, margin: "auto" }}>
        <Paper style={{ padding: 20, margin: 20 }}>
          <h2>Code Of Conduct</h2>
          <Divider />
          <Stepper activeStep={stepIndex} orientation="vertical">
            <Step>
              <StepLabel>
                <div
                  style={{
                    marginLeft: "25px",
                    paddingLeft: "21px",
                    marginTop: "-46px"
                  }}
                >
                  <u>Inappropriate Behaviour</u>
                </div>
              </StepLabel>
              <StepContent>
                <p>
                  Occasionally someone might be rude or use inappropriate
                  language to you — please don’t engage or respond in kind. We
                  will make sure that person isn’t contacted again.
                </p>
                {this.renderStepActions(0)}
              </StepContent>
            </Step>
            <Step>
              <StepLabel>
                <div
                  style={{
                    marginLeft: "25px",
                    paddingLeft: "21px",
                    marginTop: "-46px"
                  }}
                >
                  <u>Commit to Reply</u>
                </div>
              </StepLabel>
              <StepContent>
                <p>
                  Please commit to responding to people who reply to you. We're
                  attempting to grow trust and understanding in our community
                  and maintaining an open dialogue is key.
                </p>
                {this.renderStepActions(1)}
              </StepContent>
            </Step>
            <Step>
              <StepLabel>
                <div
                  style={{
                    marginLeft: "25px",
                    paddingLeft: "21px",
                    marginTop: "-46px"
                  }}
                >
                  <u>Retention</u>
                </div>
              </StepLabel>
              <StepContent>
                <p>
                  We maintain a record of all conversations with this account.
                </p>
                {this.renderStepActions(2)}
              </StepContent>
            </Step>
          </Stepper>
          {finished && (
            <p style={{ margin: "20px 0", textAlign: "center" }}>Thanks!</p>
          )}
        </Paper>
      </div>
    );
  }
}

Terms.propTypes = {
  mutations: PropTypes.object,
  router: PropTypes.object,
  data: PropTypes.object
};

const queries = {
  data: {
    query: gql`
      query getCurrentUser {
        currentUser {
          id
          terms
        }
      }
    `
  }
};

const mutations = {
  userAgreeTerms: ownProps => userId => ({
    mutation: gql`
      mutation userAgreeTerms($userId: String!) {
        userAgreeTerms(userId: $userId) {
          id
          terms
        }
      }
    `,
    variables: {
      userId
    }
  })
};

export default loadData({
  queries,
  mutations
})(withRouter(Terms));
