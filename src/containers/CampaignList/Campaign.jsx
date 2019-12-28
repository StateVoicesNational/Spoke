import PropTypes from "prop-types";
import React from "react";
import { ListItem } from "material-ui/List";
import moment from "moment";
import WarningIcon from "material-ui/svg-icons/alert/warning";
import ArchiveIcon from "material-ui/svg-icons/content/archive";
import UnarchiveIcon from "material-ui/svg-icons/content/unarchive";
import IconButton from "material-ui/IconButton";
import Checkbox from "material-ui/Checkbox";
import theme from "../../styles/theme";
import Chip from "../../components/Chip";
import { dataTest } from "../../lib/attributes";

const inlineStyles = {
  past: {
    opacity: 0.6
  },
  warn: {
    color: theme.colors.orange
  },
  good: {
    color: theme.colors.green
  },
  warnUnsent: {
    color: theme.colors.blue
  }
};

const renderRightIcon = (campaign, archiveCampaign, unarchiveCampaign) => {
  if (campaign.isArchived) {
    return (
      <IconButton
        tooltip="Unarchive"
        onTouchTap={async () => unarchiveCampaign(campaign.id)}
      >
        <UnarchiveIcon />
      </IconButton>
    );
  }
  return (
    <IconButton
      tooltip="Archive"
      onTouchTap={async () => archiveCampaign(campaign.id)}
    >
      <ArchiveIcon />
    </IconButton>
  );
};

const Campaign = props => {
  const {
    campaign,
    adminPerms,
    selectMultiple,
    archiveCampaign,
    unarchiveCampaign
  } = props;

  const {
    isStarted,
    isArchived,
    hasUnassignedContacts,
    hasUnsentInitialMessages
  } = campaign;

  let listItemStyle = {};
  let leftIcon = "";
  if (isArchived) {
    listItemStyle = inlineStyles.past;
  } else if (!isStarted || hasUnassignedContacts) {
    listItemStyle = inlineStyles.warn;
    leftIcon = <WarningIcon />;
  } else if (hasUnsentInitialMessages) {
    listItemStyle = inlineStyles.warnUnsent;
  } else {
    listItemStyle = inlineStyles.good;
  }

  const dueByMoment = moment(campaign.dueBy);
  const creatorName = campaign.creator ? campaign.creator.displayName : null;
  const tags = [];
  if (!isStarted) {
    tags.push("Not started");
  }

  if (hasUnassignedContacts) {
    tags.push("Unassigned contacts");
  }

  if (isStarted && hasUnsentInitialMessages) {
    tags.push("Unsent initial messages");
  }

  const primaryText = (
    <div>
      {campaign.title}
      {tags.map(tag => (
        <Chip key={tag} text={tag} />
      ))}
    </div>
  );
  const secondaryText = (
    <span>
      <span>
        Campaign ID: {campaign.id}
        <br />
        {campaign.description}
        {creatorName ? <span> &mdash; Created by {creatorName}</span> : null}
        <br />
        {dueByMoment.isValid()
          ? dueByMoment.format("MMM D, YYYY")
          : "No due date set"}
      </span>
    </span>
  );

  const campaignUrl = `/admin/${props.organizationId}/campaigns/${campaign.id}`;
  return (
    <ListItem
      {...dataTest("campaignRow")}
      style={listItemStyle}
      key={campaign.id}
      primaryText={primaryText}
      onTouchTap={({
        currentTarget: {
          firstElementChild: {
            firstElementChild: { checked }
          }
        }
      }) => {
        if (selectMultiple) {
          return props.handleChecked({ campaignId: campaign.id, checked });
        }

        return !isStarted
          ? props.router.push(`${campaignUrl}/edit`)
          : props.router.push(campaignUrl);
      }}
      secondaryText={secondaryText}
      leftIcon={!selectMultiple ? leftIcon : null}
      rightIconButton={
        !selectMultiple && adminPerms
          ? renderRightIcon(campaign, archiveCampaign, unarchiveCampaign)
          : null
      }
      leftCheckbox={selectMultiple ? <Checkbox /> : null}
    />
  );
};

Campaign.propTypes = {
  campaign: PropTypes.object,
  adminPerms: PropTypes.bool,
  selectMultiple: PropTypes.bool,
  router: PropTypes.object,
  handleChecked: PropTypes.func,
  organizationId: PropTypes.string,
  archiveCampaign: PropTypes.func,
  unarchiveCampaign: PropTypes.func
};

export default Campaign;
