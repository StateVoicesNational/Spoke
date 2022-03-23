import PropTypes from "prop-types";
import React, { useState } from "react";
import { compose } from "recompose";
import gql from "graphql-tag";
import * as yup from "yup";
import Form from "react-formal";
import colorDifference from "color-difference";

import withSetTheme from "../hoc/withSetTheme";
import loadData from "../hoc/load-data";
import GSColorPicker from "../../components/forms/GSColorPicker";
import GSForm from "../../components/forms/GSForm";
import GSSubmitButton from "../../components/forms/GSSubmitButton";

import Snackbar from "@material-ui/core/Snackbar";
import Alert from "@material-ui/lab/Alert";

const ThemeEditor = props => {
  const palette = props.muiTheme.palette;

  const [saveSuccessful, setSaveSuccessful] = useState(false);
  const [model, setModel] = useState({
    primary: palette.primary.main,
    secondary: palette.secondary.main,
    info: palette.info.main,
    success: palette.success.main,
    warning: palette.warning.main,
    error: palette.error.main
  });

  function isSimilarToBackground(color) {
    try {
      // the scale is 0 to 100;
      // 20 was chosen by what viusally made sense to the developer
      return (
        colorDifference.compare(
          color,
          props.muiTheme.palette.background.default
        ) < 20
      );
    } catch (e) {
      return false;
    }
  }

  const errorMessage =
    "This color will make it hard to see some buttons and text on the background";
  const isValidProps = [
    "is-valid-hex",
    errorMessage,
    val => !isSimilarToBackground(val)
  ];
  const themeFormSchema = yup.object({
    primary: yup
      .string()
      .required()
      .test(...isValidProps),
    secondary: yup
      .string()
      .required()
      .test(...isValidProps),
    info: yup
      .string()
      .required()
      .test(...isValidProps),
    success: yup
      .string()
      .required()
      .test(...isValidProps),
    warning: yup
      .string()
      .required()
      .test(...isValidProps),
    error: yup
      .string()
      .required()
      .test(...isValidProps)
  });

  return (
    <React.Fragment>
      <h2>Theme</h2>
      <GSForm
        schema={themeFormSchema}
        onChange={model => setModel(model)}
        value={model}
        onSubmit={data => {
          props.mutations.updateTheme(data).then(() => {
            props.setTheme({
              palette: {
                primary: { main: data.primary },
                secondary: { main: data.secondary },
                info: { main: data.info },
                success: { main: data.success },
                warning: { main: data.warning },
                error: { main: data.error }
              }
            });
            setSaveSuccessful(true);
          });
        }}
      >
        <Form.Field
          as={GSColorPicker}
          label="Primary"
          name="primary"
          fullWidth
        />
        <Form.Field
          as={GSColorPicker}
          label="Secondary"
          name="secondary"
          fullWidth
        />
        <Form.Field as={GSColorPicker} label="Info" name="info" fullWidth />
        <Form.Field
          as={GSColorPicker}
          label="Success"
          name="success"
          fullWidth
        />
        <Form.Field
          as={GSColorPicker}
          label="Warning"
          name="warning"
          fullWidth
        />
        <Form.Field as={GSColorPicker} label="Error" name="error" fullWidth />

        <Form.Submit
          as={GSSubmitButton}
          label="Save Theme"
          disabled={!themeFormSchema.isValidSync(model)}
        />
      </GSForm>
      <Snackbar
        open={saveSuccessful}
        autoHideDuration={2000}
        onClose={() => {
          setSaveSuccessful(false);
        }}
      >
        <Alert elevation={6} variant="filled" severity="success">
          Theme update successful!
        </Alert>
      </Snackbar>
    </React.Fragment>
  );
};

ThemeEditor.propTypes = {
  organizationId: PropTypes.string,
  mutations: PropTypes.object,
  muiTheme: PropTypes.object
};

const mutations = {
  updateTheme: ownProps => ({
    primary,
    secondary,
    info,
    success,
    warning,
    error
  }) => ({
    mutation: gql`
      mutation updateTheme(
        $primary: String
        $secondary: String
        $info: String
        $success: String
        $warning: String
        $error: String
        $organizationId: String!
      ) {
        updateTheme(
          primary: $primary
          secondary: $secondary
          info: $info
          success: $success
          warning: $warning
          error: $error
          organizationId: $organizationId
        ) {
          theme
        }
      }
    `,
    variables: {
      organizationId: ownProps.organizationId,
      primary,
      secondary,
      info,
      success,
      warning,
      error
    }
  })
};

export default compose(
  withSetTheme,
  loadData({
    mutations
  })
)(ThemeEditor);
