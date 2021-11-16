/* eslint-disable no-unused-vars */
import DeleteIcon from "@material-ui/icons/Delete";
import Avatar from "@material-ui/core/Avatar";
import FolderIcon from "@material-ui/icons/Folder";
import TextField from "@material-ui/core/TextField";
import Autocomplete from "@material-ui/lab/Autocomplete";
import LoadingIndicator from "../../../components/LoadingIndicator";
import _ from "lodash";
import type from "prop-types";
import React from "react";
import * as yup from "yup";
import Form from "react-formal";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import IconButton from "@material-ui/core/IconButton";
import GSForm from "../../../components/forms/GSForm";
import GSSubmitButton from "../../../components/forms/GSSubmitButton";
import fetch from "node-fetch";
import { GVIRS_INTEGRATION_ENDPOINT, GVIRS_MINQUERY_SIZE } from "./const";
import CircularProgress from "@material-ui/core/CircularProgress";
import { log } from "../../../lib/log";

export default function GvirsLoaderField(props) {
  const [open, setOpen] = React.useState(false);
  const [options, setOptions] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedSegments, setSelectedSegments] = React.useState([]);
  const [error, setError] = React.useState("");

  // See https://v4.mui.com/components/autocomplete/#controllable-states
  const [value, setValue] = React.useState(null);
  const [inputValue, setInputValue] = React.useState("");

  React.useEffect(() => {
    setLoading(true);
    let active = true;

    if (inputValue.length >= GVIRS_MINQUERY_SIZE) {
      (async () => {
        try {
          const response = await fetch(
            `${GVIRS_INTEGRATION_ENDPOINT}?query=${encodeURI(
              inputValue
            )}&clientchoicedata=${encodeURI(props.clientChoiceData)}`
          );
          const json = await response.json();

          if (active) {
            setOptions(json.segments);
          }
          setError("");
        } catch (err) {
          setError(err.message);
          log.error(error);
        }
      })();
    }

    setLoading(false);

    return () => {
      active = false;
    };
  }, [inputValue]);

  React.useEffect(() => {
    if (!open) {
      setOptions([]);
    }
  }, [open]);

  const removeId = id => {
    setSelectedSegments(selectedSegments.filter(item => item.id !== id));
  };

  return (
    <div style={{ display: "flex" }}>
      <div style={{ padding: "5px", flexBasis: "50%" }}>
        <div style={{ display: "flex" }}>
          <Autocomplete
            value={value}
            inputValue={inputValue}
            id="gvirsloader"
            style={{ width: "100%" }}
            open={open}
            onOpen={() => {
              setOpen(true);
            }}
            onClose={() => {
              setOpen(false);
            }}
            getOptionSelected={(option, theValue) =>
              theValue ? option.title === theValue.title : false
            }
            getOptionLabel={option => (option ? option.title : "")}
            options={options}
            loading={loading}
            disableClearable
            onInputChange={(_event, text) => {
              setInputValue(text);
            }}
            onChange={(_event, el, _reason) => {
              // Fired when the input value changes (i.e something is selected)
              if (el) {
                const elid = el.id;
                if (!selectedSegments.find(element => element.id === elid)) {
                  const newSelectedSegments = selectedSegments.concat([el]);
                  props.onChange(newSelectedSegments);
                  setSelectedSegments(newSelectedSegments);
                }
              }
              // Finally we clear the value, which is a bit counter
              // intuitive but how we want this to operate
              setValue(null);
              setInputValue("");
            }}
            renderInput={params => (
              <TextField
                {...params}
                label="GVIRS Segments"
                variant="outlined"
                error={error.length > 0}
                helperText={error}
                style={{ width: "100%" }}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <React.Fragment>
                      {loading ? (
                        <CircularProgress color="inherit" size={20} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </React.Fragment>
                  )
                }}
              />
            )}
          />
          {loading && <LoadingIndicator />}
        </div>
        <h4>Selected Segments</h4>
        <div style={{ display: "flex" }}>
          <List style={{ flexBasis: "100%" }}>
            {selectedSegments.map(x => (
              <ListItem key={`listitem ${x.id}`}>
                <ListItemAvatar>
                  <Avatar>
                    <FolderIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText primary={x.title} />
                <ListItemSecondaryAction onClick={() => removeId(x.id)}>
                  <IconButton edge="end" aria-label="delete">
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </div>
      </div>
    </div>
  );
}

export class CampaignContactsForm extends React.Component {
  state = {
    error: null,
    result: []
  };

  renderForm(resultMessage) {
    return (
      <GSForm
        schema={yup.object({
          segmentIds: yup.array().of(
            yup.object().shape({
              count: yup.number(),
              id: yup.number(),
              title: yup.string()
            })
          )
        })}
        // initialValues={{ segmentIds: [] }}
        onChange={formValues => {
          this.setState({ ...formValues });
          this.props.onChange(JSON.stringify(formValues));
        }}
        onSubmit={formValues => {
          // sets values locally
          this.setState({ ...formValues });
          // triggers the parent to update values
          this.props.onChange(JSON.stringify(formValues));
          // and now do whatever happens when clicking 'Next'
          this.props.onSubmit();
        }}
      >
        <Form.Field name="segmentIds">
          {props => (
            <GvirsLoaderField
              clientChoiceData={this.props.clientChoiceData}
              {...props}
            />
          )}
        </Form.Field>
        <List>
          {resultMessage ? (
            <ListItem>
              <ListItemIcon>{this.props.icons.check}</ListItemIcon>
              <ListItemText primary={resultMessage} />
            </ListItem>
          ) : null}
        </List>
        <Form.Submit
          as={GSSubmitButton}
          disabled={this.props.saveDisabled}
          label={this.props.saveLabel}
        />
      </GSForm>
    );
  }

  render() {
    let resultMessage = "";

    if (this.props.lastResult && this.props.lastResult.result) {
      try {
        const { message, finalCount } = JSON.parse(
          this.props.lastResult.result
        );
        resultMessage = message || `Loaded ${finalCount} contacts`;
      } catch (err) {
        resultMessage = err.message;
      }
    } else if (this.state.error) {
      resultMessage = `Error: ${JSON.stringify(this.state.error)}`;
    } else {
      resultMessage = "";
    }

    let subtitle = (
      <span>
        Please select one or more gVIRS segments that contain contact
        information you wish to load.
      </span>
    );

    return (
      <div>
        {subtitle}
        {this.renderForm(resultMessage)}
      </div>
    );
  }
}

CampaignContactsForm.propTypes = {
  onChange: type.func,
  onSubmit: type.func,
  campaignIsStarted: type.bool,
  icons: type.object,
  saveDisabled: type.bool,
  saveLabel: type.string,
  clientChoiceData: type.string,
  jobResultMessage: type.string,
  lastResult: type.object
};

GvirsLoaderField.propTypes = {
  onChange: type.func,
  clientChoiceData: type.string
};
