import React, { Component } from "react";
import type from "prop-types";
import FlatButton from "material-ui/FlatButton";
import loadData from "./hoc/load-data";
import gql from "graphql-tag";
import LoadingIndicator from "../components/LoadingIndicator";
import DataTables from "material-ui-datatables";
import UserEditDialog from "../components/PeopleList/UserEditDialog";
import ResetPasswordDialog from "../components/PeopleList/ResetPasswordDialog";
import RolesDropdown from "../components/PeopleList/RolesDropdown";
import { dataTest } from "../lib/attributes";

import PeopleIcon from "material-ui/svg-icons/social/people";
import Empty from "../components/Empty";

const prepareDataTableData = users =>
  users.map(user => ({
    texterId: user.id,
    texter: user.displayName,
    email: user.email,
    roles: user.roles
  }));

const PEOPLE_PAGE_ROW_SIZES = (typeof window !== "undefined" &&
  window.PEOPLE_PAGE_ROW_SIZES &&
  JSON.parse(window.PEOPLE_PAGE_ROW_SIZES)) || [100, 200, 500, 1000];
const INITIAL_PAGE_SIZE = PEOPLE_PAGE_ROW_SIZES[0];

export class PeopleList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      open: false,
      userEdit: undefined,
      pageSize: INITIAL_PAGE_SIZE,
      cursor: {
        offset: 0,
        limit: INITIAL_PAGE_SIZE
      },
      passwordResetHash: ""
    };

    this.requestUserEditClose = this.requestUserEditClose.bind(this);
    this.updateUser = this.updateUser.bind(this);
    this.handlePasswordResetClose = this.handlePasswordResetClose.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  prepareTableColumns = () => [
    {
      key: "texter",
      label: "Texter",
      style: {
        textOverflow: "ellipsis",
        overflow: "hidden",
        whiteSpace: "pre-line"
      }
    },
    {
      key: "email",
      label: "Email",
      style: {
        textOverflow: "ellipsis",
        overflow: "scroll",
        whiteSpace: "pre-line"
      }
    },
    {
      key: "roles",
      label: "Role",
      style: {
        textOverflow: "ellipsis",
        overflow: "scroll",
        whiteSpace: "pre-line"
      },
      render: this.renderRolesDropdown
    },
    {
      key: "edit",
      label: "",
      style: {
        textOverflow: "ellipsis",
        overflow: "scroll",
        whiteSpace: "pre-line"
      },
      render: this.renderEditButton
    },
    {
      key: "password",
      label: "",
      style: {
        textOverflow: "ellipsis",
        overflow: "scroll",
        whiteSpace: "pre-line"
      },
      render: this.renderChangePasswordButton
    }
  ];

  editUser(userId) {
    this.setState({
      userEdit: userId
    });
  }

  updateUser() {
    this.setState({
      userEdit: false
    });
    this.props.users.refetch({
      cursor: this.state.cursor
    });
  }

  async resetPassword(userId) {
    const { currentUser } = this.props;
    if (currentUser.id !== userId) {
      const res = await this.props.mutations.resetUserPassword(
        this.props.organizationId,
        userId
      );
      this.setState({ passwordResetHash: res.data.resetUserPassword });
    }
  }

  changePage = (pageDelta, pageSize) => {
    const { limit, offset, total } = this.props.users.people.pageInfo;
    const currentPage = Math.floor(offset / limit);
    const pageSizeAdjustedCurrentPage = Math.floor(
      (currentPage * limit) / pageSize
    );
    const maxPage = Math.floor(total / pageSize);
    const newPage = Math.min(maxPage, pageSizeAdjustedCurrentPage + pageDelta);
    this.props.users.fetchMore({
      variables: {
        cursor: {
          offset: newPage * pageSize,
          limit: pageSize
        }
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        const returnValue = {
          people: {
            users: []
          }
        };

        if (fetchMoreResult) {
          returnValue.people.users = fetchMoreResult.data.people.users;
          returnValue.people.pageInfo = fetchMoreResult.data.people.pageInfo;
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

  componentWillReceiveProps = nextProps => {
    // this is a hack
    // without this, some graphql updates did not happen
    // until the next location pop
    // which means the list of people did not reflect what was in the URL
    // and the values of the filters and sort
    // the hack reloads the entire page if the filters or sort changed
    // and users is not loading -- the fact that it's not loading means
    // the graphql update is not happening
    const nextLocation = nextProps.location;
    const currentLocation = this.props.location;

    if (
      nextLocation.action === "POP" &&
      (nextLocation.query.searchString !== currentLocation.query.searchString ||
        nextLocation.query.campaignId !== currentLocation.query.campaignId ||
        nextLocation.query.sortBy !== currentLocation.query.sortBy ||
        nextLocation.query.role !== currentLocation.query.role) &&
      !nextProps.users.loading
    ) {
      window.location.reload();
    }
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

  handleChange = async (userId, value) => {
    this.setState({ editingOrganizationRoles: true });
    await this.props.mutations.editOrganizationRoles(
      this.props.organizationId,
      this.props.campaignsFilter.campaignId,
      userId,
      [value]
    );
    this.setState({ editingOrganizationRoles: false });
  };

  requestUserEditClose = () => {
    this.setState({ userEdit: false });
  };

  handleInviteTexterOpen() {
    this.setState({ open: true });
  }

  handleInviteTexterClose() {
    this.setState({ open: false });
  }
  handlePasswordResetClose() {
    this.setState({ passwordResetHash: "" });
  }

  renderRolesDropdown = (columnKey, row) => {
    const { roles, texterId } = row;
    const { currentUser } = this.props;
    return (
      <RolesDropdown
        roles={roles}
        texterId={texterId}
        currentUser={currentUser}
        onChange={this.handleChange}
      />
    );
  };

  renderEditButton = (columnKey, row) => {
    const { texterId } = row;
    return (
      <FlatButton
        {...dataTest("editPerson")}
        label="Edit"
        onTouchTap={() => {
          this.editUser(texterId);
        }}
      />
    );
  };

  renderChangePasswordButton = (columnKey, row) => {
    const { texterId } = row;
    const { currentUser } = this.props;
    return (
      <FlatButton
        label="Reset Password"
        disabled={currentUser.id === texterId}
        onTouchTap={() => {
          this.resetPassword(texterId);
        }}
      />
    );
  };

  render() {
    if (this.props.users.loading || this.state.editingOrganizationRoles) {
      return <LoadingIndicator />;
    }

    if (!this.props.users.people.users.length) {
      return <Empty title="No people yet" icon={<PeopleIcon />} />;
    }

    const { users, pageInfo } = this.props.users.people;
    const { organizationId } = this.props;
    const { limit, offset, total } = pageInfo;
    const displayPage = Math.floor(offset / limit) + 1;
    const tableData = prepareDataTableData(users);
    return (
      <div>
        <DataTables
          data={tableData}
          columns={this.prepareTableColumns()}
          page={displayPage}
          rowSize={this.state.pageSize}
          count={total}
          onNextPageClick={this.handleNextPageClick}
          onPreviousPageClick={this.handlePreviousPageClick}
          onRowSizeChange={this.handleRowSizeChanged}
          rowSizeList={PEOPLE_PAGE_ROW_SIZES.sort((a, b) => a - b)}
          footerToolbarStyle={{ paddingRight: "100px" }}
          tableWrapperStyle={{ marginTop: "20px" }}
        />
        {this.props.organizationId && (
          <div>
            <UserEditDialog
              open={!!this.state.userEdit}
              organizationId={organizationId}
              userId={this.state.userEdit}
              updateUser={this.updateUser}
              requestClose={this.requestUserEditClose}
            />
            <ResetPasswordDialog
              open={!!this.state.passwordResetHash}
              requestClose={this.handlePasswordResetClose}
              passwordResetHash={this.state.passwordResetHash}
            />
          </div>
        )}
      </div>
    );
  }
}

PeopleList.propTypes = {
  mutations: type.object,
  users: type.object,
  params: type.object,
  organizationId: type.string,
  campaignsFilter: type.object,
  utc: type.string,
  currentUser: type.object,
  sortBy: type.string,
  searchString: type.string,
  location: type.object
};

const organizationFragment = `
  id
  people(campaignId: $campaignId) {
    id
    displayName
    email
    roles(organizationId: $organizationId)
  }
`;

const mapMutationsToProps = () => ({
  editOrganizationRoles: (organizationId, campaignId, userId, roles) => ({
    mutation: gql`
      mutation editOrganizationRoles($organizationId: String!, $userId: String!, $roles: [String], $campaignId: String) {
        editOrganizationRoles(organizationId: $organizationId, userId: $userId, roles: $roles, campaignId: $campaignId) {
          ${organizationFragment}
        }
      }
    `,
    variables: {
      organizationId,
      userId,
      roles,
      campaignId
    }
  }),
  resetUserPassword: (organizationId, userId) => ({
    mutation: gql`
      mutation resetUserPassword($organizationId: String!, $userId: Int!) {
        resetUserPassword(organizationId: $organizationId, userId: $userId)
      }
    `,
    variables: {
      organizationId,
      userId
    }
  })
});

export const getUsersGql = `
      query getUsers(
        $organizationId: String!
        $cursor: OffsetLimitCursor
        $campaignsFilter: CampaignsFilter
        $sortBy: SortPeopleBy
        $filterString: String
        $filterBy: FilterPeopleBy
        $role: String
      ) {
        people(
          organizationId: $organizationId
          cursor: $cursor
          campaignsFilter: $campaignsFilter
          sortBy: $sortBy
          filterString: $filterString
          filterBy: $filterBy
          role: $role
        ) {
          ... on PaginatedUsers {
            pageInfo {
              offset
              limit
              total
            }
            users {
              id
              displayName
              email
              roles(organizationId: $organizationId)
            }
          }
        }
      }`;

const mapQueriesToProps = ({ ownProps }) => ({
  users: {
    query: gql`
      ${getUsersGql}
    `,
    variables: {
      cursor: { offset: 0, limit: INITIAL_PAGE_SIZE },
      organizationId: ownProps.organizationId,
      campaignsFilter: ownProps.campaignsFilter,
      sortBy: ownProps.sortBy || "FIRST_NAME",
      filterBy: ownProps.filterBy || "FIRST_NAME",
      filterString: ownProps.searchString,
      role: ownProps.role
    },
    forceFetch: true
  }
});

export default loadData(PeopleList, { mapQueriesToProps, mapMutationsToProps });
