/* eslint-disable no-unused-vars */
import DeleteIcon from "@material-ui/icons/Delete";
import Avatar from "@material-ui/core/Avatar";
import FolderIcon from "@material-ui/icons/Folder";
import TextField from "@material-ui/core/TextField";
import Autocomplete from "@material-ui/lab/Autocomplete";
import LoadingIndicator from "../../../components/LoadingIndicator";
import _ from "lodash";
import Paper from "@material-ui/core/Paper";
import type from "prop-types";
import React from "react";
import * as yup from "yup";
import Form from "react-formal";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import ListSubheader from "@material-ui/core/ListSubheader";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import IconButton from "@material-ui/core/IconButton";
import GSForm from "../../../components/forms/GSForm";
import GSSubmitButton from "../../../components/forms/GSSubmitButton";
import fetch from "node-fetch";
import {
  CIVICRM_INTEGRATION_GROUPSEARCH_ENDPOINT,
  CIVICRM_MINQUERY_SIZE
} from "./util";
import CircularProgress from "@material-ui/core/CircularProgress";
import { log } from "../../../lib/log";

// function sleep(delay = 0) {
//   return new Promise(resolve => {
//     setTimeout(resolve, delay);
//   });
// }

export default function CiviCRMLoaderField(props) {
  const [open, setOpen] = React.useState(false);
  const [searchCrit, setSearchCrit] = React.useState("");
  const [options, setOptions] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedGroups, setSelectedGroups] = React.useState([]);
  const [error, setError] = React.useState("");

  // https://v4.mui.com/components/autocomplete/#controllable-states
  // TODO: This is mainly a reminder during dev, might want to remove later
  // The component has two states that can be controlled:
  // 1. the "value" state the one w the value/onChange props combination. This
  //    state represents the value selected by the user, for instance when
  //    pressing Enter.
  // 2. the "input value" state with the inputValue/onInputChange props
  //    combination. This state represents the value displayed in the textbox.
  const [value, setValue] = React.useState(null);
  const [inputValue, setInputValue] = React.useState("");

  React.useEffect(() => {
    setLoading(true);
    let active = true;

    if (searchCrit.length >= CIVICRM_MINQUERY_SIZE) {
      (async () => {
        try {
          const response = await fetch(
            `${CIVICRM_INTEGRATION_GROUPSEARCH_ENDPOINT}?query=${searchCrit}`
          );
          const json = await response.json();

          log.debug(json.groups);

          if (active) {
            setOptions(json.groups);
          }
          setError("");
        } catch (err) {
          setError(err.message);
          log.debug(error);
        }
      })();
    }

    setLoading(false);

    return () => {
      active = false;
    };
  }, [searchCrit]);

  React.useEffect(() => {
    if (!open) {
      setOptions([]);
    }
  }, [open]);

  const removeId = id => {
    setSelectedGroups(selectedGroups.filter(item => item.id !== id));
  };

  return (
    <div style={{ display: "flex" }}>
      <Paper elevation={2} style={{ flexBasis: "50%" }}>
        <div style={{ padding: "5px" }}>
          <div style={{ display: "flex" }}>
            <List style={{ flexBasis: "50%" }}>
              <ListSubheader inset>Selected groups</ListSubheader>
              {selectedGroups.map(x => (
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
          <div style={{ display: "flex" }}>
            <Autocomplete
              value={value}
              inputValue={inputValue}
              id="asynchronous-demo"
              style={{ width: 300 }}
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
              // filterSelectedOptions
              getOptionLabel={option => (option ? option.title : "")}
              options={options}
              loading={loading}
              // clearOnEscape
              // clearOnBlur
              disableClearable
              onInputChange={(_event, text) => {
                // Fired when the text changes (i.e typing)
                // TODO: combine these, don't need them separate?
                setSearchCrit(text);
                setInputValue(text);
              }}
              onChange={(_event, el, _reason) => {
                // Fired when the input value changes (i.e something is selected)
                if (el) {
                  const elid = el.id;
                  if (!selectedGroups.find(element => element.id === elid)) {
                    const newSelectedGroups = selectedGroups.concat([el]);
                    // ! I've commented this out because I'm not clear if its needed and was causing eslint warning
                    props.onChange(newSelectedGroups);
                    setSelectedGroups(newSelectedGroups);
                  }
                }
                // Finally we clear the value, which is a bit counter
                // intuitive but how we want this to operate
                log.debug("setting value to undefined/empty");
                setValue(null);
                setInputValue("");
                // setOpen(false);
                // setSearchCrit('');
                // setOptions([]);
              }}
              renderInput={params => (
                <TextField
                  {...params}
                  label="CiviCRM Groups"
                  variant="outlined"
                  error={error.length > 0}
                  helperText={error}
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
        </div>
      </Paper>
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
          groupIds: yup.array().of(
            yup.object().shape({
              count: yup.number(),
              id: yup.number(),
              title: yup.string()
            })
          )
        })}
        // initialValues={{ groupIds: [] }}
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
        <Form.Field name="groupIds" as={CiviCRMLoaderField}></Form.Field>
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
        Your source should be a CiviCRM group with contacts you wish to upload.
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

CiviCRMLoaderField.propTypes = {
  onChange: type.func
};
