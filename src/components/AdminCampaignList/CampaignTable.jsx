import SpeakerNotesIcon from "material-ui/svg-icons/action/speaker-notes";
import PropTypes from "prop-types";
import React from "react";
import { Link } from "react-router";
import moment from "moment";
import WarningIcon from "material-ui/svg-icons/alert/warning";
import ArchiveIcon from "material-ui/svg-icons/content/archive";
import UnarchiveIcon from "material-ui/svg-icons/content/unarchive";
import IconButton from "material-ui/IconButton";
import theme from "../../styles/theme";
import Empty from "../Empty";
import DataTables from "material-ui-datatables";
import { CircularProgress } from "material-ui";
import { SORTS, TIMEZONE_SORT } from "./SortBy";

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
    color: theme.colors.darkBlue
  },
  changing: {
    color: theme.colors.gray
  },
  campaignInfo: {
    whiteSpace: "nowrap"
  },
  campaignLink: {
    fontSize: 16,
    lineHeight: "16px",
    textDecoration: "none"
  },
  tableMovePaginationOnTop: {
    position: "absolute",
    top: "20px",
    right: 0
  },
  tableSpaceForPaginationOnTop: {
    paddingTop: "70px"
  },
  spaceForCreateButton: {
    height: "60px"
  }
};

export class CampaignTable extends React.Component {
  static propTypes = {
    adminPerms: PropTypes.bool,
    selectMultiple: PropTypes.bool,
    organizationId: PropTypes.string,
    data: PropTypes.object,
    handleChecked: PropTypes.func,
    archiveCampaign: PropTypes.func,
    unarchiveCampaign: PropTypes.func,
    onNextPageClick: PropTypes.func,
    onPreviousPageClick: PropTypes.func,
    onRowSizeChange: PropTypes.func,
    campaignsToArchive: PropTypes.array,
    campaignsWithChangingStatus: PropTypes.array,
    currentSortBy: PropTypes.oneOf(SORTS.map(s => s.value))
  };

  state = {
    dataTableKey: "initial"
  };

  statusIsChanging = campaign => {
    return this.props.campaignsWithChangingStatus.includes(campaign.id);
  };

  renderArchiveIcon(campaign) {
    if (this.statusIsChanging(campaign)) {
      return <CircularProgress size={25} />;
    }
    if (campaign.isArchived) {
      return (
        <IconButton
          tooltip="Unarchive"
          onTouchTap={async () =>
            await this.props.unarchiveCampaign(campaign.id)
          }
        >
          <UnarchiveIcon />
        </IconButton>
      );
    }
    return (
      <IconButton
        tooltip="Archive"
        onTouchTap={async () => await this.props.archiveCampaign(campaign.id)}
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

  prepareTableColumns(organization, campaigns) {
    const extraRows = [];
    const needsResponseCol = campaigns.some(
      c => c.completionStats.needsResponseCount
    );
    if (needsResponseCol) {
      extraRows.push({
        label: "Needs Response",
        render: (columnKey, row) =>
          row.completionStats.needsResponseCount || "",
        style: {
          width: "5em"
        }
      });
    }
    if (this.props.adminPerms) {
      extraRows.push({
        label: "Archive",
        render: (columnKey, row) => this.renderArchiveIcon(row),
        style: {
          width: "5em"
        }
      });
    }

    const timezoneColumn = [];
    // only show the timezone column when we're currently sorting by timezone
    if (this.props.currentSortBy === TIMEZONE_SORT.value) {
      timezoneColumn.push({
        key: "timezone",
        label: "Timezone",
        sortable: false,
        style: {
          width: "5em"
        }
      });
    }

    return [
      // id, timezone (if current sort), title, user, contactcount, unassigned, unmessaged, due date, archive
      {
        key: "id",
        label: "id",
        sortable: true,
        style: {
          width: "5em"
        }
      },
      ...timezoneColumn,
      {
        key: "title",
        label: "Campaign",
        sortable: true,
        style: {
          whiteSpace: "normal"
        },
        render: (columnKey, campaign) => {
          let linkStyle = inlineStyles.good;
          if (this.statusIsChanging(campaign)) {
            linkStyle = inlineStyles.changing;
          } else if (campaign.isArchived) {
            linkStyle = inlineStyles.past;
          } else if (!campaign.isStarted || campaign.hasUnassignedContacts) {
            linkStyle = inlineStyles.warn;
          } else if (campaign.hasUnsentInitialMessages) {
            linkStyle = inlineStyles.warnUnsent;
          }
          const editLink = campaign.isStarted ? "" : "/edit";
          return (
            <div style={{ margin: "6px 0" }}>
              <Link
                style={{
                  ...inlineStyles.campaignLink,
                  ...linkStyle
                }}
                to={`/admin/${this.props.organizationId}/campaigns/${campaign.id}${editLink}`}
              >
                {campaign.title}
              </Link>
              {campaign.creator ? (
                <span style={inlineStyles.campaignInfo}>
                  {" "}
                  &mdash; Created by {campaign.creator.displayName}
                </span>
              ) : null}
              <div style={inlineStyles.campaignInfo}>
                {campaign.dueBy ? (
                  <span key={`due${campaign.id}`}>
                    Due by: {moment(campaign.dueBy).format("MMM D, YYYY")}
                  </span>
                ) : (
                  ""
                )}
                {(campaign.ingestMethod &&
                  (campaign.ingestMethod.contactsCount ? (
                    <span>
                      {" "}
                      Contacts: {campaign.ingestMethod.contactsCount}
                    </span>
                  ) : (
                    campaign.ingestMethod.success === false && (
                      <span> Contact loading failed</span>
                    )
                  ))) ||
                  ""}
                {campaign.completionStats.errorCount &&
                campaign.completionStats.errorCount > 50 ? (
                  <span> Errors: {campaign.completionStats.errorCount} </span>
                ) : (
                  ""
                )}
              </div>
            </div>
          );
        }
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
            <Link
              to={`/admin/${this.props.organizationId}/campaigns/${row.id}/edit`}
            >
              {row.completionStats.contactsCount -
                row.completionStats.assignedCount}
            </Link>
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
            ? row.completionStats.contactsCount -
                row.completionStats.messagedCount || ""
            : !row.isStarted
            ? "Not started"
            : row.hasUnsentInitialMessages
            ? "Unsent initial messages"
            : ""
      },
      ...extraRows
    ];
  }

  getSelectedRowIndexes = () => {
    const campaignIds = this.props.data.organization.campaigns.campaigns.map(
      c => c.id
    );
    const indexes = this.props.campaignsToArchive.map(campaignId =>
      campaignIds.indexOf(campaignId)
    );
    if (indexes.includes(-1)) {
      // this is a programming error unless we decide it's an experience we want to support
      console.warn(
        "Some campaigns to archive are not visible in the campaign list"
      );
      return indexes.filter(idx => idx === -1);
    }
    return indexes;
  };

  clearCampaignSelection = () => {
    this.props.handleChecked([]);
    // Terrible hack around buggy DataTables: we have to force the component
    // to remount if we want clear the "select all" status
    this.setState({
      dataTableKey: new Date().getTime()
    });
  };

  render() {
    const { campaigns, pageInfo } = this.props.data.organization.campaigns;
    const { limit, offset, total } = pageInfo;
    const displayPage = Math.floor(offset / limit) + 1;
    return campaigns.length === 0 ? (
      <Empty title="No campaigns" icon={<SpeakerNotesIcon />} />
    ) : (
      <div style={{ position: "relative" }}>
        <DataTables
          key={this.state.dataTableKey}
          data={campaigns}
          columns={this.prepareTableColumns(
            this.props.data.organization,
            campaigns
          )}
          multiSelectable={this.props.selectMultiple}
          selectable={this.props.selectMultiple}
          enableSelectAll={true}
          showCheckboxes={this.props.selectMultiple}
          selectedRows={this.getSelectedRowIndexes()}
          allRowsSelected={false}
          onRowSelection={selectedRowIndexes => {
            let ids;
            if (selectedRowIndexes === "all") {
              ids = campaigns.map(c => c.id);
            } else if (selectedRowIndexes === "none") {
              ids = [];
            } else {
              ids = selectedRowIndexes.map(i => campaigns[i].id);
            }
            this.props.handleChecked(ids);
          }}
          page={displayPage}
          rowSize={limit}
          count={total}
          footerToolbarStyle={inlineStyles.tableMovePaginationOnTop}
          tableWrapperStyle={inlineStyles.tableSpaceForPaginationOnTop}
          onNextPageClick={() => {
            this.clearCampaignSelection();
            this.props.onNextPageClick();
          }}
          onPreviousPageClick={() => {
            this.clearCampaignSelection();
            this.props.onPreviousPageClick();
          }}
          onRowSizeChange={(index, value) => {
            this.clearCampaignSelection();
            this.props.onRowSizeChange(index, value);
          }}
          onSortOrderChange={(key, direction) => {
            campaigns.sort(this.sortFunc(key));
            if (direction === "desc") {
              campaigns.reverse();
            }
          }}
        />
        <div style={inlineStyles.spaceForCreateButton}>.</div>
      </div>
    );
  }
}

export default CampaignTable;
