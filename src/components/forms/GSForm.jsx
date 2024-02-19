import PropTypes from "prop-types";
import React from "react";
import Form from "react-formal";
import { StyleSheet, css } from "aphrodite";
import { GraphQLRequestError } from "../../network/errors";
import { log } from "../../lib";
import withMuiTheme from "../../containers/hoc/withMuiTheme";

class GSForm extends React.Component {
  static propTypes = {
    value: PropTypes.object,
    defaultValue: PropTypes.object,
    onChange: PropTypes.func,
    children: PropTypes.array
  };

  state = {
    formErrors: null,
    isSubmitting: false,
    model: null,
    globalErrorMessage: null
  };

  constructor(props) {
    super(props);
    this.styles = StyleSheet.create({
      errorMessage: {
        color: this.props.muiTheme.palette.error.main,
        marginRight: "auto",
        marginLeft: "auto",
        textAlign: "center"
      }
    });
    // if you need to reference this (ex: for submit())
    // outside of this compoent you can pass a ref in
    if (props.setRef) {
      this.form = props.setRef;
    } else {
      this.form = React.createRef();
    }
  }

  handleFormError(err) {
    if (err instanceof GraphQLRequestError) {
      this.setState({ globalErrorMessage: err.message });
    } else if (err.message) {
      this.setState({ globalErrorMessage: err.message });
    } else {
      log.error(err);
      this.setState({
        globalErrorMessage:
          "Oops! Your form submission did not work. Contact your administrator."
      });
    }
  }

  renderChildren(children) {
    const childrenList =
      React.Children.map(children, child => {
        if (child === null) {
          return child;
        } else if (child.type === Form.Field) {
          const name = child.props.name;
          let required = false;
          try {
            // if is set as required through YUP
            required = this.props.schema.fields[name].exclusiveTests.required;
          } catch (e) {}
          let error = this.state.formErrors
            ? this.state.formErrors[name]
            : null;
          let clonedElement = child;
          if (error) {
            error = error[0]
              ? error[0].message.replace(name, child.props.label)
              : null;
            clonedElement = React.cloneElement(child, {
              helperText: error,
              error: true
            });
          }
          return React.cloneElement(clonedElement, {
            events: ["onBlur"],
            required
          });
        } else if (child.type === Form.Submit) {
          const { isSubmitting } = this.state;
          const As = child.props.as;
          return React.cloneElement(child, {
            as: props => <As isSubmitting={isSubmitting} {...props} />
          });
        } else if (child.props && child.props.children) {
          return React.cloneElement(child, {
            children: this.renderChildren(child.props.children)
          });
        }
        return child;
      }) || [];

    return childrenList.length === 1 ? childrenList[0] : childrenList;
  }

  renderGlobalErrorMessage() {
    if (!this.state.globalErrorMessage) {
      return "";
    }

    return (
      <div className={css(this.styles.errorMessage)}>
        {this.state.globalErrorMessage}
      </div>
    );
  }

  render() {
    const { setRef, muiTheme, ...props } = this.props;
    return (
      <Form
        ref={this.form}
        value={props.value || this.state.model || props.defaultValue}
        onChange={model => {
          this.setState({ model });
          if (props.onChange) {
            props.onChange(model);
          }
        }}
        onError={errors => {
          this.setState({ formErrors: errors });
        }}
        {...props}
        onSubmit={async formValues => {
          this.setState({
            isSubmitting: true,
            globalErrorMessage: null
          });
          if (props.onSubmit) {
            try {
              await props.onSubmit(formValues);
            } catch (ex) {
              this.handleFormError(ex);
            }
          }
          this.setState({ isSubmitting: false });
        }}
      >
        {this.renderGlobalErrorMessage()}
        {this.renderChildren(props.children)}
      </Form>
    );
  }
}

GSForm.propTypes = {
  onSubmit: PropTypes.func
};

export default withMuiTheme(GSForm);
