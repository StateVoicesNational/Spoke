import React, { Component } from "react";
import type from "prop-types";
import Toggle from "material-ui/Toggle";

import _ from "lodash";
import { Card, CardHeader, CardText } from "material-ui/Card";
import AutoComplete from "material-ui/AutoComplete";
import SelectField from "material-ui/SelectField";
import TextField from "material-ui/TextField";
import MenuItem from "material-ui/MenuItem";
import theme from "../styles/theme";
import { dataSourceItem } from "./utils";
import SelectedCampaigns from "./SelectedCampaigns";
import TagsSelector from "./TagsSelector";

import { StyleSheet, css } from "aphrodite";

const styles = StyleSheet.create({
  container: {
    ...theme.layouts.multiColumn.container,
    alignContent: "flex-start",
    justifyContent: "flex-start",
    flexWrap: "wrap",
    alignItems: "center"
  },
  flexColumn: {
    width: "30%"
  },
  toggleFlexColumn: {
    width: "30%"
  },
  spacer: {
    marginRight: "30px"
  }
});

export const MESSAGE_STATUSES = {
  all: {
    name: "All",
    children: ["needsResponse", "needsMessage", "convo", "messaged"]
  },
  needsResponse: {
    name: "Needs Texter Response",
    children: []
  },
  needsMessage: {
    name: "Needs First Message",
    children: []
  },
  convo: {
    name: "Active Conversation",
    children: []
  },
  messaged: {
    name: "First Message Sent",
    children: []
  },
  closed: {
    name: "Closed",
    children: []
  }
};

export const ALL_CAMPAIGNS = -1;

export const CAMPAIGN_TYPE_FILTERS = [[ALL_CAMPAIGNS, "All Campaigns"]];

export const ALL_TEXTERS = -1;

export const TEXTER_FILTERS = [[ALL_TEXTERS, "All Texters"]];

class IncomingMessageFilter extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedCampaigns: [],
      messageTextFilter: "",
      tagsFilter: this.props.tagsFilter
    };
  }

  onMessageFilterSelectChanged = (event, index, values) => {
    this.setState({ messageFilter: values });
    const messageStatuses = new Set();
    values.forEach(value => {
      const children = MESSAGE_STATUSES[value].children;
      if (children.length > 0) {
        children.forEach(child => messageStatuses.add(child));
      } else {
        messageStatuses.add(value);
      }
    });

    const messageStatusesString = Array.from(messageStatuses).join(",");
    this.props.onMessageFilterChanged(messageStatusesString);
  };

  onCampaignSelected = (selection, index) => {
    let campaignId = undefined;
    if (index === -1) {
      const campaign = this.props.campaigns.find(
        cmpgn => cmpgn.title === selection
      );
      if (campaign) {
        campaignId = campaign.id;
      }
    } else {
      campaignId = selection.value.key;
    }
    if (campaignId) {
      const selectedCampaigns = this.makeSelectedCampaignsArray(
        selection.rawValue,
        selection.text
      );
      this.applySelectedCampaigns(selectedCampaigns);
    }
  };

  onTexterSelected = (selection, index) => {
    let texterUserId = undefined;
    if (index === -1) {
      const texter = this.props.texters.find(texter => {
        return texter.displayName === selection;
      });
      if (texter) {
        texterUserId = texter.id;
      }
    } else {
      texterUserId = selection.value.key;
    }
    if (texterUserId) {
      this.props.onTexterChanged(parseInt(texterUserId, 10));
    }
  };

  onTagsFilterChanged = tagsFilter => {
    this.setState({ tagsFilter });
    this.props.onTagsFilterChanged(tagsFilter);
  };

  applySelectedCampaigns = selectedCampaigns => {
    this.setState({
      selectedCampaigns,
      campaignSearchText: ""
    });

    this.fireCampaignChanged(selectedCampaigns);
  };

  handleCampaignRemoved = campaignId => {
    const selectedCampaigns = this.state.selectedCampaigns.filter(
      campaign => campaign.key !== campaignId
    );
    this.applySelectedCampaigns(selectedCampaigns);
  };

  handleClearCampaigns = () => {
    this.applySelectedCampaigns([]);
  };

  fireCampaignChanged = selectedCampaigns => {
    this.props.onCampaignChanged(this.selectedCampaignIds(selectedCampaigns));
  };

  removeAllCampaignsFromCampaignsArray = campaign =>
    campaign.key !== ALL_CAMPAIGNS;

  makeSelectedCampaignsArray = (campaignId, campaignText) => {
    const selectedCampaign = { key: campaignId, text: campaignText };
    if (campaignId === ALL_CAMPAIGNS) {
      return [];
    }
    return _.concat(
      this.state.selectedCampaigns.filter(
        this.removeAllCampaignsFromCampaignsArray
      ),
      selectedCampaign
    );
  };

  selectedCampaignIds = selectedCampaigns =>
    selectedCampaigns.map(campaign => parseInt(campaign.key, 10));

  campaignsNotAlreadySelected = campaign => {
    return !this.selectedCampaignIds(this.state.selectedCampaigns).includes(
      parseInt(campaign.id, 10)
    );
  };

  render() {
    const texterNodes = TEXTER_FILTERS.map(texterFilter =>
      dataSourceItem(texterFilter[1], texterFilter[0])
    ).concat(
      !this.props.texters
        ? []
        : this.props.texters.map(user => {
            const userId = parseInt(user.id, 10);
            return dataSourceItem(user.displayName, userId);
          })
    );
    texterNodes.sort((left, right) => {
      return left.text.localeCompare(right.text, "en", { sensitivity: "base" });
    });

    const campaignNodes = CAMPAIGN_TYPE_FILTERS.map(campaignTypeFilter =>
      dataSourceItem(campaignTypeFilter[1], campaignTypeFilter[0])
    ).concat(
      !this.props.campaigns
        ? []
        : this.props.campaigns
            .filter(this.campaignsNotAlreadySelected)
            .map(campaign => {
              const campaignId = parseInt(campaign.id, 10);
              const campaignDisplay = `${campaignId}: ${campaign.title}`;
              return dataSourceItem(campaignDisplay, campaignId);
            })
    );
    campaignNodes.sort((left, right) => {
      return left.text.localeCompare(right.text, "en", { sensitivity: "base" });
    });

    return (
      <Card>
        <CardHeader title="Message Filter" actAsExpander showExpandableButton />
        <CardText expandable>
          <div className={css(styles.container)}>
            <div className={css(styles.toggleFlexColumn)}>
              <Toggle
                label={"Active Campaigns"}
                onToggle={this.props.onActiveCampaignsToggled}
                toggled={
                  this.props.includeActiveCampaigns ||
                  !this.props.includeArchivedCampaigns
                }
              />
              <br />
              <Toggle
                label={"Archived Campaigns"}
                onToggle={this.props.onArchivedCampaignsToggled}
                toggled={this.props.includeArchivedCampaigns}
              />
            </div>
            <div className={css(styles.spacer)} />
            <div className={css(styles.toggleFlexColumn)}>
              <Toggle
                label={"Not Opted Out"}
                onToggle={this.props.onNotOptedOutConversationsToggled}
                toggled={
                  this.props.includeNotOptedOutConversations ||
                  !this.props.includeOptedOutConversations
                }
              />
              <br />
              <Toggle
                label={"Opted Out"}
                onToggle={this.props.onOptedOutConversationsToggled}
                toggled={this.props.includeOptedOutConversations}
              />
            </div>
          </div>

          <div className={css(styles.container)}>
            <div className={css(styles.flexColumn)}>
              <SelectField
                multiple
                value={this.state.messageFilter}
                hintText={"Which messages?"}
                floatingLabelText={"Contact message status"}
                floatingLabelFixed
                onChange={this.onMessageFilterSelectChanged}
              >
                {Object.keys(MESSAGE_STATUSES).map(messageStatus => {
                  const displayText = MESSAGE_STATUSES[messageStatus].name;
                  const isChecked =
                    this.state.messageFilter &&
                    this.state.messageFilter.indexOf(messageStatus) > -1;
                  return (
                    <MenuItem
                      key={messageStatus}
                      value={messageStatus}
                      primaryText={displayText}
                      insetChildren
                      checked={isChecked}
                    />
                  );
                })}
              </SelectField>
            </div>
            <div className={css(styles.spacer)} />
            <div className={css(styles.flexColumn)}>
              <AutoComplete
                filter={AutoComplete.caseInsensitiveFilter}
                maxSearchResults={8}
                onFocus={() => this.setState({ campaignSearchText: "" })}
                onUpdateInput={campaignSearchText =>
                  this.setState({ campaignSearchText })
                }
                searchText={this.state.campaignSearchText}
                dataSource={campaignNodes}
                hintText={"Search for a campaign"}
                floatingLabelText={"Select a campaign"}
                onNewRequest={this.onCampaignSelected}
              />
            </div>
            <div className={css(styles.spacer)} />
            <div className={css(styles.flexColumn)}>
              <AutoComplete
                filter={AutoComplete.caseInsensitiveFilter}
                maxSearchResults={8}
                onFocus={() => this.setState({ texterSearchText: "" })}
                onUpdateInput={texterSearchText =>
                  this.setState({ texterSearchText })
                }
                searchText={this.state.texterSearchText}
                dataSource={texterNodes}
                hintText={"Search for a texter"}
                floatingLabelText={"Texter"}
                onNewRequest={this.onTexterSelected}
              />
            </div>
            <div className={css(styles.spacer)} />
            <div className={css(styles.flexColumn)}>
              <TextField
                hintText="Search message text"
                floatingLabelText="Search message text"
                onChange={(_, messageTextFilter) => {
                  this.setState({ messageTextFilter });
                }}
                onKeyPress={evt => {
                  if (evt.key === "Enter") {
                    this.props.onMessageTextFilterChanged(
                      this.state.messageTextFilter
                    );
                  }
                }}
              />
            </div>
            <div>
              {window.EXPERIMENTAL_TAGS === true && (
                <TagsSelector
                  onChange={this.onTagsFilterChanged}
                  tagsFilter={this.state.tagsFilter}
                  tags={this.props.tags}
                />
              )}
              <SelectedCampaigns
                campaigns={this.state.selectedCampaigns}
                onDeleteRequested={this.handleCampaignRemoved}
                onClear={this.handleClearCampaigns}
              />
            </div>
          </div>
        </CardText>
      </Card>
    );
  }
}

IncomingMessageFilter.propTypes = {
  onCampaignChanged: type.func.isRequired,
  onTexterChanged: type.func.isRequired,
  onMessageTextFilterChanged: type.func.isRequired,
  onActiveCampaignsToggled: type.func.isRequired,
  onArchivedCampaignsToggled: type.func.isRequired,
  includeArchivedCampaigns: type.bool.isRequired,
  includeActiveCampaigns: type.bool.isRequired,
  onNotOptedOutConversationsToggled: type.func.isRequired,
  onOptedOutConversationsToggled: type.func.isRequired,
  includeNotOptedOutConversations: type.bool.isRequired,
  includeOptedOutConversations: type.bool.isRequired,
  campaigns: type.array.isRequired,
  texters: type.array.isRequired,
  onMessageFilterChanged: type.func.isRequired,
  assignmentsFilter: type.shape({
    texterId: type.number
  }).isRequired,
  onTagsFilterChanged: type.func.isRequired,
  tags: type.arrayOf(type.object).isRequired,
  tagsFilter: type.object.isRequired
};

export default IncomingMessageFilter;
