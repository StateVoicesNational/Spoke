import gql from "graphql-tag";
import PropTypes from "prop-types";
import React from "react";
import { withRouter } from "react-router";
import loadData from "./hoc/load-data";
import CampaignTable from "../components/AdminCampaignList/CampaignTable";
import LoadingIndicator from "../components/LoadingIndicator";

// TODO[matteo]: use fragments?
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

const ROW_SIZES = [50, 10, 25, 100];
const INITIAL_ROW_SIZE = ROW_SIZES[0];
ROW_SIZES.sort((a, b) => a - b);

export class CampaignList extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      page: 0,
      pageSize: INITIAL_ROW_SIZE
    };
  }

  changePage = (pageDelta, pageSize) => {
    const {
      limit,
      offset,
      total
    } = this.props.data.organization.campaigns.pageInfo;
    const currentPage = Math.floor(offset / limit);
    const pageSizeAdjustedCurrentPage = Math.floor(
      (currentPage * limit) / pageSize
    );
    const maxPage = Math.floor(total / pageSize);
    const newPage = Math.min(maxPage, pageSizeAdjustedCurrentPage + pageDelta);
    this.props.data.fetchMore({
      variables: {
        cursor: {
          offset: newPage * pageSize,
          limit: pageSize
        }
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        const returnValue = {
          organization: {
            campaigns: {
              campaigns: []
            }
          }
        };

        if (fetchMoreResult) {
          returnValue.organization = fetchMoreResult.data.organization;
        }
        return returnValue;
      }
    });
    this.setState({
      cursor: {
        offset: newPage * pageSize,
        limit: pageSize
      }
    });
  };
  handleNextPageClick = () => {
    this.changePage(1, this.state.pageSize);
  };

  handlePreviousPageClick = () => {
    this.changePage(-1, this.state.pageSize);
  };

  handleRowSizeChanged = (index, value) => {
    console.log("rowsizechanged", index, value); // eslint-disable-line no-console
    this.changePage(0, value);
    this.setState({ pageSize: value });
  };

  handleArchiveCampaign = async campaignId => {
    await this.props.mutations.archiveCampaign(campaignId);
    this.props.data.refetch();
  };

  handleUnarchiveCampaign = async campaignId => {
    await this.props.mutations.unarchiveCampaign(campaignId);
    this.props.data.refetch();
  };

  render() {
    if (this.props.data.loading || !this.props.data.organization) {
      return <LoadingIndicator />;
    }
    return (
      <CampaignTable
        data={this.props.data}
        onNextPageClick={this.handleNextPageClick}
        onPreviousPageClick={this.handlePreviousPageClick}
        onRowSizeChange={this.handleRowSizeChanged}
        adminPerms={this.props.adminPerms}
        selectMultiple={this.props.selectMultiple}
        organizationId={this.props.organizationId}
        handleChecked={this.props.handleChecked}
        archiveCampaign={this.handleArchiveCampaign}
        unarchiveCampaign={this.handleUnarchiveCampaign}
      />
    );
  }
}

CampaignList.propTypes = {
  router: PropTypes.object,
  adminPerms: PropTypes.bool,
  selectMultiple: PropTypes.bool,
  organizationId: PropTypes.string,
  data: PropTypes.object,
  mutations: PropTypes.object,
  handleChecked: PropTypes.func,
  campaignsFilter: PropTypes.object,
  sortBy: PropTypes.string
};

const mutations = {
  archiveCampaign: ownProps => campaignId => ({
    mutation: gql`mutation archiveCampaign($campaignId: String!) {
          archiveCampaign(id: $campaignId) {
            ${campaignInfoFragment}
          }
        }`,
    variables: { campaignId }
  }),
  unarchiveCampaign: ownProps => campaignId => ({
    mutation: gql`mutation unarchiveCampaign($campaignId: String!) {
        unarchiveCampaign(id: $campaignId) {
          ${campaignInfoFragment}
        }
      }`,
    variables: { campaignId }
  })
};

const queries = {
  data: {
    query: gql`
      query adminGetCampaigns(
        $organizationId: String!,
        $campaignsFilter: CampaignsFilter,
        $cursor: OffsetLimitCursor,
        $sortBy: SortCampaignsBy) {
      organization(id: $organizationId) {
        id
        cacheable
        campaigns(campaignsFilter: $campaignsFilter, cursor: $cursor, sortBy: $sortBy) {
          ... on CampaignsList{
            campaigns{
              ${campaignInfoFragment}
            }
          }
          ... on PaginatedCampaigns{
              pageInfo {
                offset
                limit
                total
              }
              campaigns{
                ${campaignInfoFragment}
              }
            }
          }
        }
      }
    `,
    options: ownProps => ({
      variables: {
        cursor: { offset: 0, limit: INITIAL_ROW_SIZE },
        organizationId: ownProps.organizationId,
        campaignsFilter: ownProps.campaignsFilter,
        sortBy: ownProps.sortBy
      },
      fetchPolicy: "network-only"
    })
  }
};

export default loadData({ queries, mutations })(withRouter(CampaignList));
