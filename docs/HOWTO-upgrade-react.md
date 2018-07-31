# Upgrading to React v16

## Upgrade Plan

Upgrading to React v16 requires upgrading the following dependencies at the same time due to breaking internal API changes: `material-ui`, `webpack` + `react-hot-loader`, `react-apollo`, and `react-router`. The plan is to:

1. Make changes common to each dependency upgrade.
2. For each dependency, open a PR getting it the first ~90% of the way there (the last ~10% requiring updates from another dependency)
3. Merge these dependency-specific PRs, resolving (hopefully minimal) conflicts
4. Disable all routes and get application to compile and run.
5. Open additional PRs to enable functionality route by route

## Dependency Notes

### `react`

Replace `onTouchTap` with `onClick` and drop the [now-deprecated](https://github.com/zilverline/react-tap-event-plugin#deprecated) `react-tap-event-plugin`.

### `webpack` + `react-hot-loader`

`react-hot-loader` upgrade is a mix of instructions from:

- https://github.com/gaearon/react-hot-loader#getting-started
- http://gaearon.github.io/react-hot-loader/getstarted/

Ex. the use of the `hot` HOC is listed as preferred in the repo's readme but not mentioned at all in the official documentation.

### `material-ui`

v1.2.0 adds longer term support, better layout support, and more functionality to `Table` components, which would be helpful for MoveOnOrg/Spoke#579 and addresses MoveOnOrg/Spoke#480.

**Gotchas**:

- Functionality for `AutoComplete` has been removed in favor of one of three 3rd party choices (98f6484)
- `DatePicker` does not have a working implementation in v1.2.0 (40604ae)
- Remove `react-addons-css-transition-group` (it's not being used anywhere) (70113cd)
- Update Toggle --> Switch (401da20)
- Update DropDownMenu --> List + Menu (d294314)
- Confirm that the [`material-ui-color-picker` package](https://www.npmjs.com/package/material-ui-color-picker) works with v1.2.0

### `react-router`

Update `react-router` [from v2.5 to v4.3](https://github.com/ReactTraining/react-router/blob/master/packages/react-router/docs/guides/migrating.md).
Switch from deprecated `react-router-redux` to [`connected-react-router`](https://github.com/supasate/connected-react-router).

### `react-apollo`

Update `react-apollo` from v0.3 to v2.1. Inspired by [MoveOnOrg/Spoke#418](https://github.com/MoveOnOrg/Spoke/pull/418).

* v2.x [drops `redux`](https://www.apollographql.com/docs/react/recipes/2.0-migration.html#redux) for its store
