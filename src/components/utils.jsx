import React from 'react'
import { MenuItem } from 'material-ui/Menu'

export function dataSourceItem(name, key) {
  return {
    text: name,
    rawValue: key,
    value: (
      <MenuItem
        key={key}
        primaryText={name}
      />
    )
  }
}

