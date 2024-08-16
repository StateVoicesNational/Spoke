import PropTypes from "prop-types";
import React, { useState } from "react";
import { Link as RouterLink } from "react-router";
import moment from "moment";

import Empty from "../Empty";
import { SORTS, TIMEZONE_SORT } from "./SortBy";

import MUIDataTable from "mui-datatables";
import WarningIcon from "@material-ui/icons/Warning";
import ArchiveIcon from "@material-ui/icons/Archive";
import UnarchiveIcon from "@material-ui/icons/Unarchive";
import SpeakerNotesIcon from "@material-ui/icons/SpeakerNotes";
import IconButton from "@material-ui/core/IconButton";
import CircularProgress from "@material-ui/core/CircularProgress";
import Link from "@material-ui/core/Link";

const inlineStyles = {
  campaignInfo: {
    whiteSpace: "nowrap"
  }
};

export function CampaignTable({
  data,
  campaignsToArchive,
  campaignsWithChangingStatus,
  currentSortBy,
  onNextPageClick,
  onPreviousPageClick,
  onRowSizeChange,
  adminPerms,
  selectMultiple,
  organizationId,
  handleChecked,
  archiveCampaign,
  unarchiveCampaign
}) {

  const [campaigns, setCampaigns] = useState(data.organization.campaigns.campaigns.map((campaign) => ({...campaign})));
  // Needed to refresh datatable
  const [state, setState] = useState({
    dataTableKey: "initial"
  });

  const { limit, offset, total } = data.organization.campaigns.pageInfo;
  const displayPage = Math.floor(offset / limit) + 1;
  let rowSizeList = [10, 20, 50, 100];

  const statusIsChanging = campaign => {
    return campaignsWithChangingStatus.includes(campaign.id);
  };

  const  renderArchiveIcon = campaign => {
    if (statusIsChanging(campaign)) {
      return <CircularProgress size={25} />;
    }
    if (campaign.isArchived) {
      if (campaign.isArchivedPermanently) {
        return null;
      }
      return (
        <IconButton
          tooltip="Unarchive"
          onClick={async () => await unarchiveCampaign(campaign.id)}
        >
          <UnarchiveIcon />
        </IconButton>
      );
    }
    return (
      <IconButton
        tooltip="Archive"
        onClick={async () => await archiveCampaign(campaign.id)}
      >
        <ArchiveIcon />
      </IconButton>
    );
  }

  const sortFunc = key => {
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

  const prepareTableColumns = (organization, campaigns) => {
    const extraRows = [];
    const needsResponseCol = campaigns.some(
      c => c.completionStats.needsResponseCount
    );
    if (needsResponseCol) {
      extraRows.push({
        label: "Needs Response",
        name: "needs_response",
        options: {
          customBodyRender: (value, tableMeta) => {
            const campaign = campaigns.find(c => c.id === tableMeta.rowData[0]);
            return campaign.completionStats.needsResponseCount || "";
          }
        },
        style: {
          width: "5em"
        }
      });
    }
    if (adminPerms) {
      extraRows.push({
        label: "Archive",
        name: "archive",
        options: {
          customBodyRender: (value, tableMeta) => {
            const campaign = campaigns.find(c => c.id === tableMeta.rowData[0]);
            return renderArchiveIcon(campaign);
          },
          sort: false
        },
        style: {
          width: "5em"
        }
      });
    }

    const timezoneColumn = [];
    // only show the timezone column when we're currently sorting by timezone
    if (currentSortBy === TIMEZONE_SORT.value) {
      timezoneColumn.push({
        key: "timezone",
        name: "timezone",
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
        name: "id",
        label: "id",
        sortable: true,
        style: {
          width: "5em"
        },
        options: {
          customBodyRender: (value, tableMeta) => {
            const campaign = campaigns.find(c => c.id === tableMeta.rowData[0]);
            let org = "";
            if (organizationId != campaign.organization.id) {
              org = ` (${campaign.organization.id})`;
            }
            return `${campaign.id}${org}`;
          }
        }
      },
      ...timezoneColumn,
      {
        key: "title",
        name: "title",
        label: "Campaign",
        sortable: true,
        style: {
          whiteSpace: "normal"
        },
        options: {
          customBodyRender: (value, tableMeta) => {
            const campaign = campaigns.find(c => c.id === tableMeta.rowData[0]);
            const editLink = campaign.isStarted ? "" : "/edit";
            return (
              <div style={{ margin: "6px 0" }}>
                <Link
                  component={RouterLink}
                  to={`/admin/${campaign.organization.id}/campaigns/${campaign.id}${editLink}`}
                >
                  {campaign.title}
                </Link>
                {campaign.creator && (
                  <span style={inlineStyles.campaignInfo}>
                    {" "}
                    &mdash; Created by {campaign.creator.displayName}
                  </span>
                )}
                <div style={inlineStyles.campaignInfo}>
                  {campaign.dueBy && (
                    <span key={`due${campaign.id}`}>
                      Due by: {moment(campaign.dueBy).format("MMM D, YYYY")}
                    </span>
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
                    campaign.completionStats.errorCount > 50 && (
                      <span>
                        {" "}
                        Errors: {campaign.completionStats.errorCount}{" "}
                      </span>
                    )}
                </div>
              </div>
            );
          }
        }
      },
      {
        key: "unassigned",
        name: "unassigned",
        label: "Unassigned",
        sortable: true,
        style: {
          width: "7em"
        },
        options: {
          customBodyRender: (value, tableMeta) => {
            const campaign = campaigns.find(c => c.id === tableMeta.rowData[0]);
            return organization.cacheable > 1 &&
              campaign.completionStats.assignedCount !== null ? (
              <RouterLink
                to={`/admin/${campaign.organization.id}/campaigns/${campaign.id}/edit`}
              >
                {campaign.completionStats.contactsCount -
                  campaign.completionStats.assignedCount}
              </RouterLink>
            ) : campaign.hasUnassignedContacts ? (
              <IconButton
                tooltip="Has unassigned contacts"
                href={`/admin/${campaign.organization.id}/campaigns/${campaign.id}/edit`}
              >
                <WarningIcon color="primary" />
              </IconButton>
            ) : null;
          }
        }
      },
      {
        key: "messaging",
        name: "messaging",
        label: organization.cacheable > 1 ? "Unmessaged" : "Messaging",
        sortable: true,
        style: {
          whiteSpace: "normal",
          width: "10em"
        },
        options: {
          customBodyRender: (value, tableMeta) => {
            const campaign = campaigns.find(c => c.id === tableMeta.rowData[0]);
            return organization.cacheable > 1 &&
              campaign.completionStats.messagedCount !== null
              ? campaign.completionStats.contactsCount -
                  campaign.completionStats.messagedCount || ""
              : !campaign.isStarted
              ? "Not started"
              : campaign.hasUnsentInitialMessages
              ? "Unsent initial messages"
              : "";
          }
        }
      },
      ...extraRows
    ];
  }

  const getSelectedRowIndexes = () => {
    const campaignIds = data.organization.campaigns.campaigns.map(
      c => c.id
    );
    const indexes = campaignsToArchive.map(campaignId =>
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

  const clearCampaignSelection = () => {
    handleChecked([]);
    // Terrible hack around buggy DataTables: we have to force the component
    // to remount if we want clear the "select all" status
    setState({
      dataTableKey: new Date().getTime()
    });
  };

  const options = {
    filterType: "checkbox",
    selectableRows: "multiple", // selectMultiple ? "multiple" : "none",
    elevation: 0,
    download: false,
    print: false,
    searchable: false,
    filter: false,
    sort: true,
    search: false,
    viewColumns: false,
    page: displayPage - 1,
    count: total,
    rowsPerPage: limit,
    rowsPerPageOptions: rowSizeList,
    serverSide: true,
    rowsSelected: getSelectedRowIndexes(),
    customToolbarSelect: () => null,
    onColumnSortChange: (changedColumn, direction) => {
      //console.log("HERE", changedColumn, direction);
    },
    onTableChange: (action, tableState) => {
      console.log(action);
      switch (action) {
        case "changePage":
          if (tableState.page > displayPage - 1) {
            clearCampaignSelection();
            onNextPageClick();
          } else {
            clearCampaignSelection();
            onPreviousPageClick();
          }
          break;
        case "changeRowsPerPage":
          clearCampaignSelection();
          const _ = undefined;
          onRowSizeChange(_, tableState.rowsPerPage);
          break;
        case "sort":
          clearCampaignSelection();
          setCampaigns(campaigns.sort((sortFunc(tableState.sortOrder.name))));
          if (tableState.sortOrder.direction === "desc") {
            setCampaigns(campaigns.reverse())
          }
          console.log(campaigns)
          break;
        case "rowSelectionChange":
          const ids = tableState.selectedRows.data.map(({ index }) => {
            return campaigns[index].id;
          });
          handleChecked(ids);
          break;
        case "propsUpdate":
          break;
        default:
          break;
      }
    }
  };

  return campaigns.length === 0 ? (
    <Empty title="No campaigns" icon={<SpeakerNotesIcon />} />
  ) : (
    <div>
      <br />
      <br />
      <MUIDataTable
        data={campaigns}
        columns={prepareTableColumns(
          data.organization,
          campaigns
        )}
        options={options}
      />
      {/* make space for Floating Action Button */}
      <br />
      <br />
      <br />
    </div>
  );
}


CampaignTable.propTypes = {
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

export default CampaignTable;
