import ActionDelete from "material-ui/svg-icons/action/delete";
import Subheader from "material-ui/Subheader";
import Avatar from "material-ui/Avatar";
import FileFolder from "material-ui/svg-icons/file/folder";
import type from "prop-types";
import React from "react";
import GSForm from "../../../components/forms/GSForm";
import Form from "react-formal";
import { ListItem, List } from "material-ui/List";
import yup from "yup";
import AutoComplete from "material-ui/AutoComplete";
import LoadingIndicator from "../../../components/LoadingIndicator";
import * as _ from "lodash";
import Paper from "material-ui/Paper";

class MultiAutoCompleteSelect extends React.Component {
  state = {
    error: null,
    list: null,
    value: [],
    searchText: "",
    result: []
  };

  refreshList(query) {
    if (query.length < 3) {
      this.setState({ result: [] });
      return;
    }

    this.setState({ loading: true });
    fetch("/integration/civicrm/groupsearch?query=" + query, {
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

  remove(id) {
    this.setState(old => ({
      value: _.remove(old.value, item => item.id === id)
    }));
  }

  render() {
    const self = this;

    console.log(this.props);
    return (
      <div style={{ display: "flex" }}>
        <Paper zDepth={2} style={{ flexBasis: "50%" }}>
          <div style={{ padding: "5px" }}>
            <div style={{ display: "flex" }}>
              <List style={{ flexBasis: "33.33%" }}>
                <Subheader inset={true}>Selected groups</Subheader>
                {(this.props.value || []).map(value => (
                  <ListItem
                    leftAvatar={<Avatar icon={<FileFolder />} />}
                    rightIcon={
                      <ActionDelete
                        onClick={this.remove.bind(this, value.id)}
                      />
                    }
                    key={value.id}
                    primaryText={value.title}
                  />
                ))}
              </List>
            </div>

            <div style={{ display: "flex" }}>
              <AutoComplete
                style={{ flexBasis: "33.33%" }}
                label="CiviCRM list"
                name="groupId"
                as="select"
                searchText={this.state.searchText}
                filter={AutoComplete.noFilter}
                dataSource={this.state.result}
                onNewRequest={function(el) {
                  self.setState(old => {
                    const newValue = old.value.concat([el]);
                    self.props.onChange(newValue);
                    return { value: newValue, searchText: "" };
                  });
                }}
                onUpdateInput={text => {
                  this.refreshList(text);
                  this.setState({ searchText: text });
                }}
                dataSourceConfig={{
                  text: "title",
                  value: "id"
                }}
                hintText="Choose CiviCRM list"
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

  render() {
    const { lastResult } = this.props,
      props = this.props;
    let resultMessage = "";
    if (lastResult && lastResult.result) {
      const { message, finalCount } = JSON.parse(lastResult.result);
      resultMessage = message ? message : `Loaded ${finalCount} contacts`;
    } else if (this.state.error) {
      resultMessage = "Error: " + JSON.stringify(this.state.error);
    }

    return (
      <GSForm
        schema={yup.object({
          groupIds: yup
            .array()
            .of(
              yup
                .object()
                .shape({
                  count: yup.number(),
                  id: yup.number(),
                  title: yup.string()
                })
            )
        })}
        initialValues={{ groupIds: [] }}
        onChange={formValues => {
          this.setState({ ...formValues });
          props.onChange(JSON.stringify(formValues));
        }}
        onSubmit={formValues => {
          // sets values locally
          this.setState({ ...formValues });
          // triggers the parent to update values
          props.onChange(JSON.stringify(formValues));
          // and now do whatever happens when clicking 'Next'
          props.onSubmit();
        }}
      >
        <Form.Field name="groupIds" type={MultiAutoCompleteSelect}></Form.Field>

        <List>
          {resultMessage ? (
            <ListItem
              primaryText={resultMessage}
              leftIcon={props.icons.warning}
            />
          ) : null}
        </List>

        <Form.Button
          type="submit"
          disabled={props.saveDisabled}
          label={props.saveLabel}
        />
      </GSForm>
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
