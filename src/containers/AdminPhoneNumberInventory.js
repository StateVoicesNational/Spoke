import PropTypes from "prop-types";
import React from "react";
import gql from "graphql-tag";

import ContentAdd from "material-ui/svg-icons/content/add";
import DeleteIcon from "material-ui/svg-icons/action/delete-forever";
import DataTables from "material-ui-datatables";
import Dialog from "material-ui/Dialog";
import Paper from "material-ui/Paper";
import DropDownMenu from "material-ui/DropDownMenu";
import { MenuItem } from "material-ui/Menu";
import FloatingActionButton from "material-ui/FloatingActionButton";
import yup from "yup";
import GSForm from "../components/forms/GSForm";
import Form from "react-formal";

import theme from "../styles/theme";
import { dataTest } from "../lib/attributes";
import loadData from "./hoc/load-data";
import {
  CircularProgress,
  FlatButton,
  RaisedButton,
  Toggle
} from "material-ui";

const inlineStyles = {
  column: {
    textOverflow: "ellipsis",
    overflow: "hidden",
    whiteSpace: "pre-line"
  },
  dialogFields: {
    display: "flex",
    flexDirection: "column"
  },
  dialogActions: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-end"
  },
  cancelButton: {
    marginTop: 15,
    marginRight: 5
  }
};

class AdminPhoneNumberInventory extends React.Component {
  static propTypes = {
    data: PropTypes.object,
    params: PropTypes.object,
    mutations: PropTypes.object
  };

  constructor(props) {
    super(props);

    this.state = {
      buyNumbersDialogOpen: false,
      buyNumbersFormValues: {
        addToOrganizationMessagingService: false
      },
      sortCol: "state",
      sortOrder: "asc",
      filters: {},
      deleteNumbersDialogOpen: false
    };
  }

  buyNumbersFormSchema() {
    return yup.object({
      areaCode: yup
        .string()
        .required()
        .length(3)
        .matches(/[0-9]+/),
      limit: yup
        .number()
        .required()
        .max(window.MAX_NUMBERS_PER_BUY_JOB)
        .min(1),
      addToOrganizationMessagingService: yup.bool()
    });
  }

  handleStateFilterChange = (e, i, state) => {
    this.setState(({ filters }) => ({
      filters: { ...filters, state }
    }));
  };

  handleBuyNumbersOpen = () => {
    this.setState({
      buyNumbersDialogOpen: true
    });
  };

  handleBuyNumbersCancel = () => {
    this.setState({
      buyNumbersDialogOpen: false
    });
  };

  handleFormChange = formValues => {
    this.setState({
      buyNumbersFormValues: {
        ...this.state.buyNumbersFormValues,
        ...formValues
      }
    });
  };

  handleBuyNumbersSubmit = async () => {
    const {
      areaCode,
      limit,
      addToOrganizationMessagingService
    } = this.state.buyNumbersFormValues;
    await this.props.mutations.buyPhoneNumbers(
      areaCode,
      limit,
      addToOrganizationMessagingService
    );

    this.setState({
      buyNumbersDialogOpen: false,
      buyNumbersFormValues: {
        areaCode: null,
        limit: null,
        addToOrganizationMessagingService: false
      }
    });
  };

  handleDeleteNumbersOpen = row => {
    this.setState({
      deleteNumbersDialogOpen: true,
      deleteNumbersAreaCode: row.areaCode,
      deleteNumbersCount: row.availableCount
    });
  };

  handleDeleteNumbersCancel = () => {
    this.setState({
      deleteNumbersDialogOpen: false,
      deleteNumbersAreaCode: null,
      deleteNumbersCount: 0
    });
  };

  handleDeletePhoneNumbersSubmit = async () => {
    await this.props.mutations.deletePhoneNumbers(
      this.state.deleteNumbersAreaCode
    );
    this.setState({
      deleteNumbersDialogOpen: false,
      deleteNumbersAreaCode: null
    });
  };

  tableColumns() {
    const { pendingPhoneNumberJobs } = this.props.data.organization;
    return [
      {
        key: "areaCode",
        label: "Area Code",
        style: inlineStyles.column,
        sortable: true
      },
      {
        key: "state",
        label: "State",
        style: inlineStyles.column,
        sortable: true
      },
      {
        key: "allocatedCount",
        label: "Allocated",
        style: {
          ...inlineStyles.column,
          fontSize: 16,
          textAlign: "center"
        }
      },
      {
        key: "availableCount",
        label: "Available",
        style: {
          ...inlineStyles.column,
          fontSize: 16,
          textAlign: "center"
        }
      },
      {
        key: "deleteButton",
        label: "",
        style: inlineStyles.column,
        render: (columnKey, row) =>
          this.props.params.ownerPerms ? (
            <FlatButton
              icon={<DeleteIcon />}
              onTouchTap={() => this.handleDeleteNumbersOpen(row)}
            />
          ) : null
      },
      // TODO: display additional information here about pending and past jobs
      {
        key: "pendingJobs",
        label: "",
        style: inlineStyles.column,
        render: (columnKey, row) => {
          if (pendingPhoneNumberJobs.some(j => j.areaCode === row.areaCode)) {
            return <CircularProgress size={25} />;
          }
        }
      }
    ];
  }

  sortTable(table, key, order) {
    table.sort((a, b) => {
      if (order == "desc") {
        return a[key] < b[key] ? 1 : -1;
      }
      if (order == "asc") {
        return a[key] > b[key] ? 1 : -1;
      }
    });
  }

  renderFilters() {
    const { phoneNumberCounts } = this.props.data.organization;

    const { filters } = this.state;

    const states = phoneNumberCounts
      .reduce(
        (arr, { state }) => (!arr.includes(state) ? [...arr, state] : arr),
        []
      )
      .sort();

    return (
      <Paper
        style={{
          display: "flex",
          flexDirection: "row",
          marginBottom: 40,
          padding: "10px 20px 30px",
          width: "100%"
        }}
        zDepth={3}
      >
        <DropDownMenu
          value={filters.state}
          onChange={this.handleStateFilterChange}
          style={{ width: 300 }}
        >
          {!filters.state ? (
            <MenuItem value={filters.state} primaryText="Filter by state" />
          ) : (
            <MenuItem value={null} primaryText="None" />
          )}
          {states.map(state => (
            <MenuItem value={state} primaryText={state} />
          ))}
          {}
        </DropDownMenu>
      </Paper>
    );
  }

  renderBuyNumbersForm() {
    return (
      <GSForm
        schema={this.buyNumbersFormSchema()}
        onSubmit={this.handleBuyNumbersSubmit}
        value={this.state.buyNumbersFormValues}
        onChange={this.handleFormChange}
        {...dataTest("buyNumbersForm")}
      >
        <div style={inlineStyles.dialogFields}>
          <Form.Field
            label="Area Code"
            name="areaCode"
            {...dataTest("areaCode")}
          />
          <Form.Field label="Limit" name="limit" {...dataTest("limit")} />
          {this.props.data.organization.twilioMessageServiceSid &&
          !this.props.data.organization.campaignPhoneNumbersEnabled ? (
            <Form.Field
              label="Add to this organization's Messaging Service"
              name="addToOrganizationMessagingService"
              type={Toggle}
              style={{
                marginTop: 30
              }}
              onToggle={(_, toggled) => {
                this.handleFormChange({
                  addToOrganizationMessagingService: toggled
                });
              }}
            />
          ) : null}
        </div>
        <div style={inlineStyles.dialogActions}>
          <FlatButton
            type="button"
            onClick={this.handleBuyNumbersCancel}
            style={inlineStyles.cancelButton}
            label="Cancel"
          />
          <Form.Button type="submit" label="Submit" />
        </div>
      </GSForm>
    );
  }

  render() {
    const {
      phoneNumberCounts,
      pendingPhoneNumberJobs
    } = this.props.data.organization;

    const { filters } = this.state;

    // Push rows for pending jobs as a simple visual indication that counts are
    // being updated.
    // In the future we may want to add a header with more data about pending
    // and past jobs including a retry button and warnings if we failed to buy
    // as many numbers as requested.
    const ownedAreaCodes = phoneNumberCounts.map(count => count.areaCode);
    const newAreaCodeRows = pendingPhoneNumberJobs
      .filter(j => ownedAreaCodes.indexOf(j.areaCode) === -1)
      .map(j => ({
        areaCode: j.areaCode,
        allocatedCount: 0,
        availableCount: 0
      }));

    let tableData = [...newAreaCodeRows, ...phoneNumberCounts];

    if (filters.state) {
      tableData = tableData.filter(data => data.state === filters.state);
    }

    this.sortTable(tableData, this.state.sortCol, this.state.sortOrder);
    const handleSortOrderChange = (key, order) => {
      this.setState({
        sortCol: key,
        sortOrder: order
      });
      this.sortTable(tableData, key, order);
    };
    return (
      <div>
        {this.renderFilters()}

        <DataTables
          data={tableData}
          columns={this.tableColumns()}
          selectable={false}
          count={tableData.length}
          showFooterToolbar={false}
          showRowHover
          initialSort={{ column: "state", order: "asc" }}
          onSortOrderChange={handleSortOrderChange}
        />
        {this.props.params.ownerPerms ? (
          <FloatingActionButton
            {...dataTest("buyPhoneNumbers")}
            style={theme.components.floatingButton}
            onTouchTap={this.handleBuyNumbersOpen}
          >
            <ContentAdd />
          </FloatingActionButton>
        ) : null}

        <Dialog
          title="Buy Numbers"
          modal={false}
          open={this.state.buyNumbersDialogOpen}
          onRequestClose={this.handleBuyNumbersCancel}
        >
          {this.renderBuyNumbersForm()}
        </Dialog>
        <Dialog
          title="Delete Numbers"
          modal={false}
          open={this.state.deleteNumbersDialogOpen}
          onRequestClose={this.handleDeleteNumbersCancel}
          actions={[
            <FlatButton
              label="Cancel"
              style={inlineStyles.cancelButton}
              onClick={this.handleDeleteNumbersCancel}
            />,
            <RaisedButton
              label={`Delete ${this.state.deleteNumbersCount} Numbers`}
              secondary
              onClick={this.handleDeletePhoneNumbersSubmit}
            />
          ]}
        >
          Do you want to delete availale numbers for the&nbsp;
          <b>{this.state.deleteNumbersAreaCode}</b> area code? This will
          permanently remove numbers not allocated to a campaign/messaging
          service from both Spoke and your Twilio account.
        </Dialog>
      </div>
    );
  }
}

const queries = {
  data: {
    query: gql`
      query getOrganizationData($organizationId: String!) {
        organization(id: $organizationId) {
          id
          twilioMessageServiceSid
          campaignPhoneNumbersEnabled
          phoneNumberCounts {
            areaCode
            state
            availableCount
            allocatedCount
          }
          pendingPhoneNumberJobs {
            id
            assigned
            status
            resultMessage
            areaCode
            limit
          }
        }
      }
    `,
    options: ownProps => ({
      variables: {
        organizationId: ownProps.params.organizationId
      },
      pollInterval: 5000,
      fetchPolicy: "network-only"
    })
  }
};

const mutations = {
  buyPhoneNumbers: ownProps => (
    areaCode,
    limit,
    addToOrganizationMessagingService
  ) => ({
    mutation: gql`
      mutation buyPhoneNumbers(
        $organizationId: ID!
        $areaCode: String!
        $limit: Int!
        $addToOrganizationMessagingService: Boolean
      ) {
        buyPhoneNumbers(
          organizationId: $organizationId
          areaCode: $areaCode
          limit: $limit
          addToOrganizationMessagingService: $addToOrganizationMessagingService
        ) {
          id
        }
      }
    `,
    variables: {
      organizationId: ownProps.params.organizationId,
      areaCode,
      limit,
      addToOrganizationMessagingService
    },
    refetchQueries: () => ["getOrganizationData"]
  }),
  deletePhoneNumbers: ownProps => areaCode => ({
    mutation: gql`
      mutation deletePhoneNumbers($organizationId: ID!, $areaCode: String!) {
        deletePhoneNumbers(
          organizationId: $organizationId
          areaCode: $areaCode
        ) {
          id
        }
      }
    `,
    variables: {
      organizationId: ownProps.params.organizationId,
      areaCode
    },
    refetchQueries: () => ["getOrganizationData"]
  })
};

export default loadData({ queries, mutations })(AdminPhoneNumberInventory);
