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

  onCancelSearch = () => {
    this.handleSearchStringChanged("");
    this.props.onSearchRequested("");
  };

  render = () => (
    <SearchBar
      onRequestSearch={this.handleSearchRequested}
      onChange={this.handleSearchStringChanged}
      onCancelSearch={this.onCancelSearch}
      value={this.props.searchString}
      placeholder={this.props.hintText || this.props.placeholder}
    />
  );
}

Search.propTypes = {
  searchString: PropTypes.string,
  onSearchRequested: PropTypes.func.isRequired,
  hintText: PropTypes.string,
  placeholder: PropTypes.string
};

export default Search;
