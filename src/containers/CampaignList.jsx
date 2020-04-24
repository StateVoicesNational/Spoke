import gql from "graphql-tag";
import SpeakerNotesIcon from "material-ui/svg-icons/action/speaker-notes";
import PropTypes from "prop-types";
import React from "react";
import { Link, withRouter } from "react-router";
import { List, ListItem } from "material-ui/List";
import moment from "moment";
import WarningIcon from "material-ui/svg-icons/alert/warning";
import ArchiveIcon from "material-ui/svg-icons/content/archive";
import UnarchiveIcon from "material-ui/svg-icons/content/unarchive";
import IconButton from "material-ui/IconButton";
import Checkbox from "material-ui/Checkbox";
import theme from "../styles/theme";
import Chip from "../components/Chip";
import loadData from "./hoc/load-data";
import wrapMutations from "./hoc/wrap-mutations";
import Empty from "../components/Empty";
import { dataTest } from "../lib/attributes";
import DataTables from "material-ui-datatables";

const campaignInfoFragment = `
  id
  title
  isStarted
  isArchived
  hasUnassignedContacts
  hasUnsentInitialMessages
  description
  dueBy
  creator {
    displayName
  }
  ingestMethod {
    success
    contactsCount
  }
  completionStats {
    contactsCount
    assignedCount
    messagedCount
  }
`;

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

export class CampaignList extends React.Component {
  renderArchiveIcon(campaign) {
    if (campaign.isArchived) {
      return (
        <IconButton
          tooltip="Unarchive"
          onTouchTap={async () =>
            await this.props.mutations.unarchiveCampaign(campaign.id)
          }
        >
          <UnarchiveIcon />
        </IconButton>
      );
    }
    return (
      <IconButton
        tooltip="Archive"
        onTouchTap={async () =>
          await this.props.mutations.archiveCampaign(campaign.id)
        }
      >
        <ArchiveIcon />
      </IconButton>
    );
  }

  sortFunc(key) {
    const sorts = {
      id: (a, b) => b.id - a.id,
      title: (a, b) => (b.title > a.title ? 1 : -1),
      unassigned: (a, b) =>
        (b.completionStats.contactsCount - b.completionStats.assignedCount ||
          b.hasUnassignedContacts) -
        (a.completionStats.contactsCount - a.completionStats.assignedCount ||
          a.hasUnassignedContacts),
      messaging: (a, b) =>
        (b.completionStats.contactsCount - b.completionStats.messagedCount ||
          b.isStarted * 2 + b.hasUnsentInitialMessages) -
        (a.completionStats.contactsCount - a.completionStats.messagedCount ||
          a.isStarted * 2 + a.hasUnsentInitialMessages)
    };
    return sorts[key];
  }

  prepareTableColumns(organization) {
    const extraRows = [];
    if (this.props.adminPerms) {
      extraRows.push({
        label: "Archive",
        render: (columnKey, row) => this.renderArchiveIcon(row),
        style: {
          width: "5em"
        }
      });
    }

    return [
      // id, title, user, contactcount, unassigned, unmessaged, due date, archive
      {
        key: "id",
        label: "id",
        sortable: true,
        style: {
          width: "5em"
        }
      },
      {
        key: "title",
        label: "Campaign",
        sortable: true,
        style: {
          whiteSpace: "normal"
        },
        render: (columnKey, campaign) => (
          <div style={{ margin: "6px 0" }}>
            <Link
              style={{
                color: theme.colors.darkBlue,
                fontSize: 16,
                lineHeight: "16px",
                textDecoration: "none"
              }}
              to={`/admin/${this.props.organizationId}/campaigns/${campaign.id}`}
            >
              {campaign.title}
            </Link>
            <div style={{ whiteSpace: "nowrap" }}>
              {campaign.dueBy
                ? `Due by: ${moment(campaign.dueBy).format("MMM D, YYYY")} `
                : ""}
              {(campaign.ingestMethod &&
                (campaign.ingestMethod.contactsCount
                  ? `Contacts: ${campaign.ingestMethod.contactsCount}`
                  : campaign.ingestMethod.success === false &&
                    "Contact loading failed")) ||
                ""}
            </div>
          </div>
        )
      },
      {
        key: "unassigned",
        label: "Unassigned",
        sortable: true,
        style: {
          width: "7em"
        },
        render: (columnKey, row) =>
          organization.cacheable > 1 &&
          row.completionStats.assignedCount !== null ? (
            row.completionStats.contactsCount -
            row.completionStats.assignedCount
          ) : row.hasUnassignedContacts ? (
            <IconButton
              tooltip="Has unassigned contacts"
              href={`/admin/${this.props.organizationId}/campaigns/${row.id}/edit`}
            >
              <WarningIcon />
            </IconButton>
          ) : null
      },
      {
        key: "messaging",
        label: organization.cacheable > 1 ? "Unmessaged" : "Messaging",
        sortable: true,
        style: {
          whiteSpace: "normal",
          width: "10em"
        },
        render: (columnKey, row) =>
          organization.cacheable > 1 &&
          row.completionStats.messagedCount !== null
            ? (row.completionStats.contactsCount -
                row.completionStats.messagedCount: "")
            : !row.isStarted
            ? "Not started"
            : row.hasUnsentInitialMessages
            ? "Unsent initial messages"
            : ""
      },
      ...extraRows
    ];
  }

  render() {
    const { campaigns } = this.props.data.organization.campaigns;
    return campaigns.length === 0 ? (
      <Empty title="No campaigns" icon={<SpeakerNotesIcon />} />
    ) : (
      <DataTables
        data={campaigns}
        columns={this.prepareTableColumns(this.props.data.organization)}
        multiSelectable={this.props.selectMultiple}
        selectable={true}
        enableSelectAll={true}
        showCheckboxes={this.props.selectMultiple}
        onRowSelection={selectedRowIndexes =>
          this.props.handleChecked({
            campaignIds: selectedRowIndexes.map(i => campaigns[i].id)
          })
        }
        page={campaigns.length}
        rowSize={campaigns.length}
        count={campaigns.length}
        onSortOrderChange={(key, direction) => {
          campaigns.sort(this.sortFunc(key));
          if (direction === "desc") {
            campaigns.reverse();
          }
        }}
      />
    );
  }
}

CampaignList.propTypes = {
  campaigns: PropTypes.arrayOf(
    PropTypes.shape({
      dueBy: PropTypes.string,
      title: PropTypes.string,
      description: PropTypes.string
    })
  ),
  router: PropTypes.object,
  adminPerms: PropTypes.bool,
  selectMultiple: PropTypes.bool,
  organizationId: PropTypes.string,
  data: PropTypes.object,
  mutations: PropTypes.object,
  handleChecked: PropTypes.func
};

const mapMutationsToProps = () => ({
  archiveCampaign: campaignId => ({
    mutation: gql`mutation archiveCampaign($campaignId: String!) {
          archiveCampaign(id: $campaignId) {
            ${campaignInfoFragment}
          }
        }`,
    variables: { campaignId }
  }),
  unarchiveCampaign: campaignId => ({
    mutation: gql`mutation unarchiveCampaign($campaignId: String!) {
        unarchiveCampaign(id: $campaignId) {
          ${campaignInfoFragment}
        }
      }`,
    variables: { campaignId }
  })
});

const mapQueriesToProps = ({ ownProps }) => ({
  data: {
    query: gql`query adminGetCampaigns($organizationId: String!, $campaignsFilter: CampaignsFilter) {
      organization(id: $organizationId) {
        id
        cacheable
        campaigns(campaignsFilter: $campaignsFilter) {
          ... on CampaignsList{
            campaigns{
              ${campaignInfoFragment}
            }
          }
        }
      }
    }`,
    variables: {
      organizationId: ownProps.organizationId,
      campaignsFilter: ownProps.campaignsFilter
    },
    forceFetch: true
  }
});

export default loadData(wrapMutations(withRouter(CampaignList)), {
  mapQueriesToProps,
  mapMutationsToProps
});
