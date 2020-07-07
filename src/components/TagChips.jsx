import React from "react";
import TagChip from "./TagChip";
import type from "prop-types";
import { StyleSheet, css } from "aphrodite";

const styles = StyleSheet.create({
  tagChips: {
    display: "flex",
    flexWrap: "wrap"
  }
});

const TagChips = ({ tags, tagIds, onRequestDelete }) => (
  <div className={css(styles.tagChips)}>
    {tagIds.map(id => {
      const listedTag = tags.find(t => t.id === id);
      return (
        <TagChip
          text={listedTag.name}
          onRequestDelete={
            onRequestDelete ? () => onRequestDelete(listedTag) : null
          }
          deleteIconStyle={{
            marginBottom: "4px"
          }}
        />
      );
    })}
  </div>
);

TagChips.propTypes = {
  tags: type.array,
  tagIds: type.array,
  onRequestDelete: type.func
};

export default TagChips;
