import DeleteIcon from "@material-ui/icons/Delete";
import Avatar from "@material-ui/core/Avatar";
import FolderIcon from "@material-ui/icons/Folder";
import TextField from "@material-ui/core/TextField";
import Autocomplete from "@material-ui/lab/Autocomplete";
import LoadingIndicator from "../../../components/LoadingIndicator";
import * as _ from "lodash";
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
import { CIVICRM_BASE_ENDPOINT, CIVICRM_MINQUERY_SIZE } from "./util";
import CircularProgress from "@material-ui/core/CircularProgress";

function sleep(delay = 0) {
  return new Promise(resolve => {
    setTimeout(resolve, delay);
  });
}

export default function CiviCRMLoaderField(props) {
  const [open, setOpen] = React.useState(false);
  const [searchCrit, setSearchCrit] = React.useState("");
  const [options, setOptions] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [loadValues, setLoadValues] = React.useState([]);

  React.useEffect(() => {
    setLoading(true);
    let active = true;

    (async () => {
      const response = await fetch(
        `${CIVICRM_BASE_ENDPOINT}?query=${searchCrit}`
      );
      const json = await response.json();
      console.log(json.groups);

      if (active) {
        setOptions(json.groups);
      }
    })();
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

  return (
    <div style={{ display: "flex" }}>
      <Paper elevation={2} style={{ flexBasis: "50%" }}>
        <div style={{ padding: "5px" }}>
          <div style={{ display: "flex" }}>
            <List style={{ flexBasis: "50%" }}>
              <ListSubheader inset={true}>Selected groups</ListSubheader>
              {loadValues.map(value => (
                <ListItem key={value.id}>
                  <ListItemAvatar>
                    <Avatar>
                      <FolderIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={value.title} />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      //         onClick={this.remove.bind(this, value.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </div>
          <div style={{ display: "flex" }}>
            <Autocomplete
              id="asynchronous-demo"
              style={{ width: 300 }}
              open={open}
              onOpen={() => {
                setOpen(true);
              }}
              onClose={() => {
                setOpen(false);
              }}
              getOptionSelected={(option, value) =>
                option.title === value.title
              }
              getOptionLabel={option => option.title}
              options={options}
              loading={loading}
              onInputChange={(event, text) => {
                setSearchCrit(text);
              }}
              onChange={function(event, el) {
                if (el) {
                  const newLoadValues = loadValues.concat([el]);
                  props.onChange(newLoadValues);
                  setLoadValues(newLoadValues);
                } else {
                  setLoadValues([]);
                }
              }}
              renderInput={params => (
                <TextField
                  {...params}
                  label="CiviCRM Groups"
                  variant="outlined"
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

class MultiAutoCompleteSelect extends React.Component {
  state = {
    error: null,
    list: null,
    value: [],
    searchText: "",
    result: []
  };

  refreshList(query) {
    if (query.length < CIVICRM_MINQUERY_SIZE) {
      this.setState({ result: [] });
      return;
    }

    this.setState({ loading: true });
    fetch(`${CIVICRM_BASE_ENDPOINT}?query=${query}`, {
      credentials: "same-origin"
    })
      .then(res => res.json())
      .then(res => {
        if (res.error) {
          this.setError(res.error);
        } else {
          this.setState({ result: res.groups, loading: false, error: null });
        }
      })
      .catch(error => {
        console.error(error);
        this.setError(error);
      });
  }

  setError(error) {
    this.setState({ loading: false, error });
  }

  componentWillReceiveProps(props) {
    this.setState({ value: props.value });
  }

  // The above is unsafe, but seems to be used. We need to do something about that.
  // static getDerivedStateFromProps(nextProps, prevState) {
  //   if (nextProps.value !== prevState.value) {
  //     return { value: nextProps.value };
  //   }
  //   else return null; // Triggers no change in the state
  // }

  remove(id) {
    this.setState(old => ({
      value: _.remove(old.value, item => item.id === id)
    }));
  }

  render() {
    const self = this;

    return (
      <div style={{ display: "flex" }}>
        <Paper elevation={2} style={{ flexBasis: "50%" }}>
          <div style={{ padding: "5px" }}>
            <div style={{ display: "flex" }}>
              <List style={{ flexBasis: "50%" }}>
                <ListSubheader inset={true}>Selected groups</ListSubheader>
                {(this.props.value || []).map(value => (
                  <ListItem key={value.id}>
                    <ListItemAvatar>
                      <Avatar>
                        <FolderIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={value.title} />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={this.remove.bind(this, value.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </div>

            <div style={{ display: "flex" }}>
              <Autocomplete
                style={{ flexBasis: "33.33%" }}
                options={this.state.result}
                label="CiviCRM list"
                name="groupId"
                as="select"
                filter={Autocomplete.noFilter}
                onChange={function(event, el) {
                  if (el) {
                    self.setState(old => {
                      const newValue = old.value.concat([el]);
                      self.props.onChange(newValue);
                      return { value: newValue, searchText: "" };
                    });
                  } else {
                    self.setState({ value: [], searchText: "" });
                  }
                }}
                onInputChange={(event, text) => {
                  this.refreshList(text);
                  this.setState({ searchText: text });
                }}
                renderInput={params => (
                  <TextField
                    {...params}
                    label="CiviCRM Groups"
                    variant="outlined"
                  />
                )}
                getOptionLabel={option => option.title || ""}
              />
              {this.state.loading && <LoadingIndicator />}
            </div>
          </div>
        </Paper>
      </div>
    );
  }
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
        resultMessage = message ? message : `Loaded ${finalCount} contacts`;
      } catch (err) {
        resultMessage = err.message;
      }
    } else if (this.state.error) {
      resultMessage = "Error: " + JSON.stringify(this.state.error);
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
