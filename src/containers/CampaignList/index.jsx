import gql from "graphql-tag";
import SpeakerNotesIcon from "material-ui/svg-icons/action/speaker-notes";
import PropTypes from "prop-types";
import React from "react";
import { withRouter } from "react-router";
import loadData from "../hoc/load-data";
import wrapMutations from "../hoc/wrap-mutations";
import Empty from "../../components/Empty";
import Campaign from "./Campaign";
import PaginatedList from "../../components/Paginated/PaginatedList";
import LoadingIndicator from "../../components/LoadingIndicator";

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
`;

let ROW_SIZES = [50, 10, 25, 100];
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
    this.changePage(0, value);
    this.setState({ pageSize: value });
  };

  renderRow = campaign => (
    <Campaign
      campaign={campaign}
      adminPerms={this.props.adminPerms}
      selectMultiple={this.props.selectMultiple}
      router={this.props.router}
      handleChecked={this.props.handleChecked}
      organizationId={this.props.organizationId}
      archiveCampaign={this.props.mutations.archiveCampaign}
      unarchiveCampaign={this.props.mutations.unarchiveCampaign}
    />
  );

  render() {
    if (this.props.data.loading || !this.props.data.organization) {
      return <LoadingIndicator />;
    }
    const { campaigns, pageInfo } = this.props.data.organization.campaigns;
    const { limit, offset, total } = pageInfo;
    const displayPage = Math.floor(offset / limit) + 1;

    return campaigns.length === 0 ? (
      <Empty title="No campaigns" icon={<SpeakerNotesIcon />} />
    ) : (
      <PaginatedList
        rowSizeList={ROW_SIZES}
        page={displayPage}
        rowSize={this.state.pageSize}
        count={total}
        onNextPageClick={this.handleNextPageClick}
        onPreviousPageClick={this.handlePreviousPageClick}
        onRowSizeChange={this.handleRowSizeChanged}
      >
        {campaigns.map(campaign => this.renderRow(campaign))}
      </PaginatedList>
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
  handleChecked: PropTypes.func,
  campaignsFilter: PropTypes.object,
  sortBy: PropTypes.string
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

export const getCampaignsQuery = `query adminGetCampaigns(
        $organizationId: String!,
        $campaignsFilter: CampaignsFilter,
        $cursor: OffsetLimitCursor,
        $sortBy: SortCampaignsBy) {
      organization(id: $organizationId) {
        id
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
      }`

const mapQueriesToProps = ({ ownProps }) => ({
  data: {
    query: gql`${getCampaignsQuery}`,
    variables: {
      cursor: { offset: 0, limit: INITIAL_ROW_SIZE },
      organizationId: ownProps.organizationId,
      campaignsFilter: ownProps.campaignsFilter,
      sortBy: ownProps.sortBy
    },
    forceFetch: true
  }
});

export default loadData(wrapMutations(withRouter(CampaignList)), {
  mapQueriesToProps,
  mapMutationsToProps
});
