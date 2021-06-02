import React from "react";
import type from "prop-types";

import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";
import Divider from "@material-ui/core/Divider";
import ListSubheader from "@material-ui/core/ListSubheader";
import InputLabel from "@material-ui/core/InputLabel";
import Input from "@material-ui/core/Input";

const NO_TAG = { id: -1, name: "NO TAG" };
const ANY_TAG = { id: -2, name: "ANY TAG" };
const IGNORE_TAGS = { id: -3, name: "IGNORE TAGS" };

const TAG_META_FILTERS = {};
TAG_META_FILTERS[IGNORE_TAGS.id] = IGNORE_TAGS;
TAG_META_FILTERS[ANY_TAG.id] = ANY_TAG;
TAG_META_FILTERS[NO_TAG.id] = NO_TAG;

const makeTagMetafilter = (ignoreTags, anyTag, noTag, tagItem) => {
  const filter = {
    ignoreTags,
    anyTag,
    noTag,
    selectedTags: {},
    suppressedTags: {}
  };

  if (tagItem) {
    filter.selectedTags[tagItem.key] = tagItem;
  }

  return filter;
};

// tag: id, name

const IGNORE_TAGS_FILTER = makeTagMetafilter(true, false, false, IGNORE_TAGS);
const ANY_TAG_FILTER = makeTagMetafilter(false, true, false, ANY_TAG);
const NO_TAG_FILTER = makeTagMetafilter(false, false, true, NO_TAG);
const EMPTY_TAG_FILTER = makeTagMetafilter(false, false, false, null);

export class TagsSelector extends React.Component {
  constructor(props) {
    super(props);

    const tags = {};
    props.tags.forEach(tag => {
      tags[tag.id] = tag;
    });

    this.state = {
      tags
    };
    this.state.tagFilter = this.cloneTagFilter() || EMPTY_TAG_FILTER;
  }

  cloneTagFilter = () => {
    const selectedTags = {};

    if (Object.keys(this.props.tagsFilter.selectedTags || {}).length > 0) {
      Object.keys(this.props.tagsFilter.selectedTags).forEach(key => {
        if (key > 0) {
          selectedTags[key] = this.state.tags[key] || TAG_META_FILTERS[key];
        }
      });
    }

    const suppressedTags = {};

    if (Object.keys(this.props.tagsFilter.suppressedTags || {}).length > 0) {
      Object.keys(this.props.tagsFilter.suppressedTags).forEach(key => {
        if (key) {
          suppressedTags[key] = this.state.tags[key] || TAG_META_FILTERS[key];
        }
      });
    }

    return {
      ignoreTags: this.props.tagsFilter.ignoreTags,
      anyTag: this.props.tagsFilter.anyTag,
      noTag: this.props.tagsFilter.noTag,
      selectedTags,
      suppressedTags
    };
  };

  handleClick = itemClicked => {
    console.log("handleClick", itemClicked);
    let tagFilter = this.state.tagFilter;
    switch (itemClicked.id) {
      case IGNORE_TAGS.id:
        tagFilter = IGNORE_TAGS_FILTER;
        break;
      case NO_TAG.id:
        tagFilter = NO_TAG_FILTER;
        break;
      case ANY_TAG.id:
        tagFilter = ANY_TAG_FILTER;
        break;
      default:
        if (tagFilter.ignoreTags || tagFilter.anyTag || tagFilter.noTag) {
          tagFilter = makeTagMetafilter(false, false, false, null);
        }

        if (itemClicked.id in tagFilter.selectedTags) {
          delete tagFilter.selectedTags[itemClicked.id];
        } else if (itemClicked.id in tagFilter.suppressedTags) {
          delete tagFilter.suppressedTags[itemClicked.id];
        } else if (String(itemClicked.id).startsWith("s_")) {
          tagFilter.suppressedTags[itemClicked.id] = itemClicked;
          delete tagFilter.selectedTags[itemClicked.id.replace("s_", "")];
        } else {
          tagFilter.selectedTags[itemClicked.id] = itemClicked;
          delete tagFilter.suppressedTags[`s_${itemClicked.id}`];
        }
    }
    console.log("SET STATE", tagFilter);
    this.setState({ tagFilter });
    this.props.onChange(tagFilter);
  };

  createMenuItem = tagFilter => {
    console.log("createMenuItem", tagFilter.id);
    return (
      <MenuItem
        key={tagFilter.id}
        value={tagFilter.id}
        onClick={() => this.handleClick(tagFilter)}
      >
        {tagFilter.name}
      </MenuItem>
    );
  };

  createMetaFilterMenuItems = metadataTagFilters => {
    const menuItems = metadataTagFilters.map(tagFilter => {
      return this.createMenuItem(tagFilter);
    });
    return menuItems;
  };

  createTagMenuItems = tagFilters => {
    return tagFilters
      .sort((left, right) => {
        if (left.name === right.name) {
          return 0;
        }

        return left.name < right.name ? 0 : 1;
      })
      .map(tagFilter => {
        return this.createMenuItem(tagFilter);
      });
  };

  determineSelectFieldValue = () => {
    const tagFilter = this.state.tagFilter;
    if (tagFilter.noTag) {
      return [NO_TAG.id];
    }

    if (tagFilter.anyTag) {
      return [ANY_TAG.id];
    }

    if (tagFilter.ignoreTags) {
      return [IGNORE_TAGS.id];
    }

    return [
      ...Object.values(tagFilter.selectedTags),
      ...Object.values(tagFilter.suppressedTags)
    ].map(obj => obj.id);
  };

  render = () => {
    return (
      <FormControl fullWidth>
        <InputLabel id="tagsSelector">Tags</InputLabel>
        <Select
          multiple
          labelId="tagsSelector"
          value={this.determineSelectFieldValue()}
          input={<Input placeholder={this.props.hintText} />}
        >
          {this.createMetaFilterMenuItems(Object.values(TAG_META_FILTERS))}

          <Divider variant="inset" />
          <ListSubheader>FILTER BY TAGS</ListSubheader>

          {this.createTagMenuItems(
            Object.values(this.state.tags).map(tag => ({
              ...tag,
              id: tag.id.replace("s_", "")
            }))
          )}

          <Divider variant="inset" />
          <ListSubheader>SUPPRESS TAGS</ListSubheader>

          {this.createTagMenuItems(
            Object.values(this.state.tags).map(tag => ({
              ...tag,
              id: `s_${tag.id.replace("s_", "")}`
            }))
          )}
        </Select>
      </FormControl>
    );
  };
}

TagsSelector.propTypes = {
  onChange: type.func.isRequired,
  tagsFilter: type.object.isRequired,
  hintText: type.string,
  tags: type.arrayOf(type.object)
};

export default TagsSelector;
