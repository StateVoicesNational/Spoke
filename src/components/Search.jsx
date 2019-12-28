import PropTypes from "prop-types";
import React from "react";
import SearchBar from "material-ui-search-bar";

class Search extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      searchString: props.searchString
    };
  }

  handleSearchStringChanged = searchString => {
    const trimmedSearchString = searchString.trim();
    if (!!this.state.searchString && !trimmedSearchString) {
      this.props.onSearchRequested(undefined);
    }
    this.setState({ searchString });
  };

  handleSearchRequested = () => {
    this.props.onSearchRequested(this.state.searchString);
  };

  render = () => (
    <SearchBar
      onRequestSearch={this.handleSearchRequested}
      onChange={this.handleSearchStringChanged}
      value={this.props.searchString}
    />
  );
}

Search.propTypes = {
  searchString: PropTypes.string,
  onSearchRequested: PropTypes.func.isRequired
};

export default Search;
