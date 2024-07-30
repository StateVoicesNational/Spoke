import React, { Component } from "react";
import { Link } from "react-router";
import type from "prop-types";
import loadData from "./hoc/load-data";
import { gql } from "@apollo/client";
import LoadingIndicator from "../components/LoadingIndicator";

import OpenInNewIcon from "@material-ui/icons/OpenInNew";
import PeopleIcon from "@material-ui/icons/People";
import Button from "@material-ui/core/Button";

import MUIDataTable from "mui-datatables";

import UserEditDialog from "../components/PeopleList/UserEditDialog";
import ResetPasswordDialog from "../components/PeopleList/ResetPasswordDialog";
import RolesDropdown from "../components/PeopleList/RolesDropdown";
import { dataTest } from "../lib/attributes";
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
      userEdit: null,
      pageSize: INITIAL_PAGE_SIZE,
      cursor: {
        offset: 0,
        limit: INITIAL_PAGE_SIZE
      },
      passwordResetHash: ""
    };
  }

  prepareTableColumns = () => {
    const { organizationId } = this.props;
    const columns = [
      /**
       * we don't show ID but need it here for the data tabel
       * to provide the ID to the row data object. Index matters
       * so this column must be first.
       */
      {
        key: "texterId",
        name: "texterId",
        label: "ID",
        options: {
          display: false
        }
      },
      {
        key: "texter",
        name: "texter",
        label: "Texter",
        options: {
          customBodyRender: (value, tableMeta, updateValue) => {
            const texterId = tableMeta.rowData[0];
            return (
              <React.Fragment>
                {value}{" "}
                <Link
                  target="_blank"
                  to={`/app/${organizationId}/todos/other/${texterId}`}
                >
                  <OpenInNewIcon
                    style={{ width: 14, height: 14 }}
                    color="primary"
                  />
                </Link>
              </React.Fragment>
            );
          }
        },
        style: {
          textOverflow: "ellipsis",
          overflow: "hidden",
          whiteSpace: "pre-line"
        }
      },
      {
        key: "email",
        name: "email",
        label: "Email",
        options: {},
        style: {
          textOverflow: "ellipsis",
          overflow: "hidden",
          whiteSpace: "pre-line"
        }
      },
      {
        key: "roles",
        name: "roles",
        label: "Role",
        options: {
          customBodyRender: this.renderRolesDropdown
        },
        style: {
          textOverflow: "ellipsis",
          overflow: "hidden",
          whiteSpace: "pre-line"
        }
      },
      {
        key: "edit",
        name: "",
        label: "",
        options: {
          customBodyRender: this.renderEditButton
        },
        style: {
          textOverflow: "ellipsis",
          overflow: "hidden",
          whiteSpace: "pre-line"
        }
      }
    ];
    if (window.PASSPORT_STRATEGY !== "slack") {
      columns.push({
        key: "password",
        name: "",
        options: {
          customBodyRender: this.renderChangePasswordButton
        },
        label: "",
        style: {
          textOverflow: "ellipsis",
          overflow: "hidden",
          whiteSpace: "pre-line"
        }
      });
    }
    return columns;
  };

  editUser = userId => {
    this.setState({
      userEdit: userId
    });
  };

  updateUser = () => {
    this.setState({
      userEdit: null
    });
    this.props.users.refetch({
      cursor: this.state.cursor
    });
  };

  resetPassword = async userId => {
    const { currentUser } = this.props;
    if (currentUser.id !== userId) {
      const res = await this.props.mutations.resetUserPassword(
        this.props.organizationId,
        userId
      );
      this.setState({ passwordResetHash: res.data.resetUserPassword });
    }
  };

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
        if (!fetchMoreResult) {
          return prev;
        }
        return fetchMoreResult;
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

  handleRowSizeChanged = value => {
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
    this.setState({ userEdit: null });
  };

  handlePasswordResetClose = () => {
    this.setState({ passwordResetHash: "" });
  };

  renderRolesDropdown = (value, tableMeta, updateValue) => {
    const texterId = tableMeta.rowData[0];
    const { currentUser } = this.props;
    return (
      <RolesDropdown
        roles={value}
        texterId={texterId}
        currentUser={currentUser}
        onChange={this.handleChange}
      />
    );
  };

  renderEditButton = (value, tableMeta) => {
    const texterId = tableMeta.rowData[0];
    return (
      <Button
        {...dataTest("editPerson")}
        onClick={() => {
          this.editUser(texterId);
        }}
      >
        Edit
      </Button>
    );
  };

  renderChangePasswordButton = (value, tableMeta) => {
    const texterId = tableMeta.rowData[0];
    const { currentUser } = this.props;
    return (
      <Button
        disabled={currentUser.id === texterId}
        onClick={() => {
          this.resetPassword(texterId);
        }}
      >
        Reset Password
      </Button>
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
    const columns = this.prepareTableColumns();

    const options = {
      filterType: "checkbox",
      selectableRows: "none",
      elevation: 0,
      download: false,
      print: false,
      searchable: false,
      filter: false,
      sort: false,
      search: false,
      viewColumns: false,
      page: displayPage - 1,
      rowsPerPage: this.state.pageSize,
      count: total,
      rowsPerPageOptions: PEOPLE_PAGE_ROW_SIZES.sort((a, b) => a - b),
      serverSide: true,
      onTableChange: (action, tableState) => {
        switch (action) {
          case "changePage":
            if (tableState.page > displayPage - 1) {
              this.handleNextPageClick();
            } else {
              this.handlePreviousPageClick();
            }
            break;
          case "changeRowsPerPage":
            this.handleRowSizeChanged(tableState.rowsPerPage);
            break;
          case "propsUpdate":
            break;
          default:
            break;
        }
      }
    };

    return (
      <React.Fragment>
        <MUIDataTable data={tableData} columns={columns} options={options} />
        {this.props.organizationId && (
          <div>
            <UserEditDialog
              open={!!this.state.userEdit}
              organizationId={organizationId}
              userId={this.state.userEdit}
              updateUser={this.updateUser}
              requestClose={this.requestUserEditClose}
              onCancel={this.requestUserEditClose}
            />
            <ResetPasswordDialog
              open={!!this.state.passwordResetHash}
              requestClose={this.handlePasswordResetClose}
              passwordResetHash={this.state.passwordResetHash}
              isAuth0={window.PASSPORT_STRATEGY === "auth0"}
            />
          </div>
        )}
      </React.Fragment>
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
  searchString: type.string
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

const queries = {
  users: {
    query: gql`
      ${getUsersGql}
    `,
    options: ownProps => ({
      variables: {
        cursor: { offset: 0, limit: INITIAL_PAGE_SIZE },
        organizationId: ownProps.organizationId,
        campaignsFilter: ownProps.campaignsFilter,
        sortBy: ownProps.sortBy || "FIRST_NAME",
        filterBy: ownProps.filterBy || "FIRST_NAME",
        filterString: ownProps.searchString,
        role: ownProps.role
      },
      fetchPolicy: "network-only"
    })
  }
};

const mutations = {
  editOrganizationRoles: ownProps => (
    organizationId,
    campaignId,
    userId,
    roles
  ) => ({
    mutation: gql`
      mutation editOrganizationRoles(
        $organizationId: String!
        $userId: String!
        $roles: [String]
        $campaignId: String
      ) {
        editOrganizationRoles(
          organizationId: $organizationId
          userId: $userId
          roles: $roles
          campaignId: $campaignId
        ) {
          id
          roles(organizationId: $organizationId)
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
  resetUserPassword: ownProps => (organizationId, userId) => ({
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
};

export default loadData({ queries, mutations })(PeopleList);
