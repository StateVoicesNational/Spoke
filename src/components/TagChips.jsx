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

const TagChips = ({ tags, tagIds, onRequestDelete, extraProps }) => (
  <div className={css(styles.tagChips)}>
    {tagIds.map((id, i) => {
      const listedTag = tags.find(t => t.id === id);
      return (
        listedTag && (
          <TagChip
            key={id}
            text={listedTag.name}
            onDelete={onRequestDelete && (() => onRequestDelete(listedTag))}
            deleteIconStyle={{
              marginBottom: "4px"
            }}
            {...(extraProps ? extraProps(listedTag, i) : {})}
          />
        )
      );
    })}
  </div>
);

TagChips.propTypes = {
  tags: type.array,
  tagIds: type.array,
  extraProps: type.func,
  onRequestDelete: type.func
};

export default TagChips;
