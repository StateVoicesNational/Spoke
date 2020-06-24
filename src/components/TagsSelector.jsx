import React from "react";
import type from "prop-types";
import SelectField from "material-ui/SelectField";
import MenuItem from "material-ui/MenuItem";
import Divider from "material-ui/Divider";
import Humps from "humps";

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
    selectedTags: {}
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
    this.props.tags.forEach(tag => {
      tags[tag.id] = tag;
    });

    const tagFilter = this.cloneTagFilter(this) || EMPTY_TAG_FILTER;

    this.state = {
      tags,
      tagFilter
    };
  }

  componentWillReceiveProps = props => {
    const tagFilter = this.cloneTagFilter(props);
    if (tagFilter) {
      this.setState({ tagFilter });
    }
  };

  cloneTagFilter = () => {
    const selectedTags = {};
    if (Object.keys(this.props.tagsFilter.selectedTags || {}).length > 0) {
      Object.keys(this.props.tagsFilter.selectedTags).forEach(key => {
        if (key > 0) {
          selectedTags[key] = this.state.tags[key] || TAG_META_FILTERS[key];
        }
      });
    }

    return {
      ignoreTags: this.props.tagsFilter.ignoreTags,
      anyTag: this.props.tagsFilter.anyTag,
      noTag: this.props.tagsFilter.noTag,
      selectedTags
    };
  };

  handleClick = itemClicked => {
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
        } else {
          tagFilter.selectedTags[itemClicked.id] = itemClicked;
        }
    }

    this.setState({ tagFilter });
    this.props.onChange(tagFilter);
  };

  createMenuItem = (tagFilter, isChecked) => {
    return (
      <MenuItem
        key={tagFilter.id}
        value={tagFilter}
        primaryText={tagFilter.name}
        insetChildren
        checked={isChecked}
        onClick={() => this.handleClick(tagFilter)}
      />
    );
  };

  createMetaFilterMenuItems = metadataTagFilters => {
    const menuItems = metadataTagFilters.map(tagFilter => {
      const isChecked = !!(this.state.tagFilter || {})[
        Humps.camelize(tagFilter.name.toLowerCase())
      ];
      return this.createMenuItem(tagFilter, isChecked);
    });
    return [...menuItems, <Divider key={-9999} inset />];
  };

  createMenuItems = tagFilters => {
    return tagFilters
      .sort((left, right) => {
        if (left.name === right.name) {
          return 0;
        }

        return left.name < right.name ? 0 : 1;
      })
      .map(tagFilter => {
        const isChecked =
          tagFilter.id in (this.state.tagFilter.selectedTags || []);
        return this.createMenuItem(tagFilter, isChecked);
      });
  };

  determineSelectFieldValue = () => {
    const tagFilter = this.state.tagFilter;
    if (tagFilter.noTag) {
      return [NO_TAG];
    }

    if (tagFilter.anyTag) {
      return [ANY_TAG];
    }

    if (tagFilter.ignoreTags) {
      return [IGNORE_TAGS];
    }

    return Object.values(tagFilter.selectedTags);
  };

  render = () => (
    <SelectField
      multiple
      value={this.determineSelectFieldValue()}
      hintText={this.props.hintText}
      floatingLabelText={"Tags"}
      floatingLabelFixed
    >
      {this.createMetaFilterMenuItems(Object.values(TAG_META_FILTERS))}
      {this.createMenuItems(Object.values(this.state.tags))}
    </SelectField>
  );
}

TagsSelector.propTypes = {
  onChange: type.func.isRequired,
  tagsFilter: type.object.isRequired,
  hintText: type.string,
  tags: type.arrayOf(type.object)
};

export default TagsSelector;
