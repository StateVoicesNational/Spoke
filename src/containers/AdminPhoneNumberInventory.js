import PropTypes from "prop-types";
import React from "react";
import gql from "graphql-tag";
import * as yup from "yup";
import Form from "react-formal";

import MUIDataTable from "mui-datatables";
import CircularProgress from "@material-ui/core/CircularProgress";
import AddIcon from "@material-ui/icons/Add";
import DeleteIcon from "@material-ui/icons/Delete";
import Fab from "@material-ui/core/Fab";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import Paper from "@material-ui/core/Paper";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";

import GSForm from "../components/forms/GSForm";
import GSSubmitButton from "../components/forms/GSSubmitButton";
import GSTextField from "../components/forms/GSTextField";
import theme from "../styles/theme";
import { dataTest } from "../lib/attributes";
import loadData from "./hoc/load-data";

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

  handleStateFilterChange = e => {
    this.setState(({ filters }) => ({
      filters: { ...filters, state: e.target.value }
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
        name: "areaCode",
        label: "Area Code"
      },
      {
        name: "state",
        label: "State"
      },
      {
        name: "allocatedCount",
        label: "Allocated",
        options: {
          sort: false
        }
      },
      {
        name: "availableCount",
        label: "Available",
        options: {
          sort: false
        }
      },
      {
        name: "deleteButton",
        label: " ",
        options: {
          sort: false,
          customBodyRender: (value, tableMeta) =>
            this.props.params.ownerPerms && (
              <IconButton onClick={() => this.handleDeleteNumbersOpen(row)}>
                <DeleteIcon />
              </IconButton>
            )
        }
      },
      // TODO: display additional information here about pending and past jobs
      {
        name: "pendingJobs",
        label: " ",
        options: {
          sort: false,
          customBodyRender: (value, tableMeta) =>
            pendingPhoneNumberJobs.some(
              j => j.areaCode === tableMeta.rowData[0]
            ) && <CircularProgress size={25} />
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
        elevation={3}
      >
        <FormControl>
          <InputLabel>Filter by state</InputLabel>
          <Select
            value={filters.state || ""}
            onChange={this.handleStateFilterChange}
            style={{ width: 300 }}
          >
            <MenuItem value="">None</MenuItem>
            {states.map(state => (
              <MenuItem key={state} value={state}>
                {state}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
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
            as={GSTextField}
            label="Area Code"
            name="areaCode"
            {...dataTest("areaCode")}
          />
          <Form.Field
            as={GSTextField}
            label="Limit"
            name="limit"
            {...dataTest("limit")}
          />
          {this.props.data.organization.twilioMessageServiceSid &&
            !this.props.data.organization.campaignPhoneNumbersEnabled && (
              <Form.Field
                name="addToOrganizationMessagingService"
                as={props => (
                  <FormControlLabel
                    {...props}
                    checked={props.value}
                    label="Add to this organization's Messaging Service"
                    control={<Switch color="primary" />}
                  />
                )}
                style={{
                  marginTop: 30
                }}
                onToggle={(_, toggled) => {
                  this.handleFormChange({
                    addToOrganizationMessagingService: toggled
                  });
                }}
              />
            )}
        </div>
        <div style={inlineStyles.dialogActions}>
          <Button
            variant="outlined"
            type="button"
            onClick={this.handleBuyNumbersCancel}
            style={inlineStyles.cancelButton}
          >
            Cancel
          </Button>
          <Form.Submit as={GSSubmitButton} label="Submit" />
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

    const options = {
      filterType: "checkbox",
      selectableRows: this.props.selectMultiple ? "multiple" : "none",
      elevation: 0,
      download: false,
      print: false,
      searchable: false,
      filter: false,
      sort: true,
      search: false,
      viewColumns: false,
      page: 1,
      serverSide: true,
      onTableChange: (action, tableState) => {
        switch (action) {
          case "sort":
            handleSortOrderChange(
              tableState.sortOrder.name,
              tableState.sortOrder.direction
            );
            break;
          default:
            break;
        }
      }
    };

    return (
      <div>
        {this.renderFilters()}

        <MUIDataTable
          data={tableData}
          columns={this.tableColumns()}
          options={options}
        />

        {this.props.params.ownerPerms ? (
          <Fab
            {...dataTest("buyPhoneNumbers")}
            color="primary"
            style={theme.components.floatingButton}
            onClick={this.handleBuyNumbersOpen}
          >
            <AddIcon />
          </Fab>
        ) : null}

        <Dialog
          open={this.state.buyNumbersDialogOpen}
          onClose={this.handleBuyNumbersCancel}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Buy Numbers</DialogTitle>
          <DialogContent>{this.renderBuyNumbersForm()}</DialogContent>
        </Dialog>
        <Dialog
          fullWidth
          maxWidth="sm"
          open={this.state.deleteNumbersDialogOpen}
          onClose={this.handleDeleteNumbersCancel}
        >
          <DialogTitle>Delete Numbers</DialogTitle>
          <DialogContent>
            Do you want to delete availale numbers for the&nbsp;
            <b>{this.state.deleteNumbersAreaCode}</b> area code? This will
            permanently remove numbers not allocated to a campaign/messaging
            service from both Spoke and your Twilio account.
          </DialogContent>
          <DialogActions>
            <Button
              variant="outlined"
              style={inlineStyles.cancelButton}
              onClick={this.handleDeleteNumbersCancel}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={this.handleDeletePhoneNumbersSubmit}
            >
              Delete {this.state.deleteNumbersCount} Numbers
            </Button>
          </DialogActions>
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
          theme
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
