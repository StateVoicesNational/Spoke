# What we want to test

- Component behavior
- Proper Component loading
-

# React Tests

We want to test component behavior, make sure components load based on the full range of
properties they can be passed, make sure the data from properties and state successfully
renders.

For networked components (i.e. containers) that get properties based on GraphQL calls,
we want the queries included in components to be tested, but those tests should be in
**test**/server/api/ directory (rather than in the components/containers test dirs)

## Setup

## Standard changes to a container for testability

- export the underlying class and then
  `import { Foo } from "../../src/containers/foo"` (underlying component) vs
  `import Foo from "../../src/containers/foo"` loaded component
- export the `` gql`...` `` with `export const dataQuery = gql...`
  Name it explicitly `dataQuery` unless there are multiple queries that need to be exported

## Shallow copy testing

Prefer shallow copy testing when possible.

```
import React from "react";
import { shallow } from "enzyme";
import { StyleSheetTestUtils } from "aphrodite";
...
it("does something", async () => {
  StyleSheetTestUtils.suppressStyleInjection(); // stupid, but always include this
  const wrapper = shallow(<Foo prop1={"value"} ... />);
  const component = wrapper.instance();
});
```

### Things you can do on a wrapper object

- `wrapper.find("ElementName")` or `wrapper.find("#idofobj")` or `wrapper.find(ImportedElement)`
- `wrapper.props()` or `wrapper.prop("propertyName")`
- `wrapper.text().includes("Created by")` (truthy)

### Things you can do on a component object

- `component.methodOnComponent()`
- `component.state.someStateValue`

## Mounted

When do we need `mount()` vs `shallow()`?!?!?! TKTK

- Always include at the top of a file with mounted tests (cannot be mixed with server/node tests):

```
/**
 * @jest-environment jsdom
 */
import React from "react";
import { mount } from "enzyme";
import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";
```

- In your test, you'll instantiate like so:

```
    const wrapper = mount(
      <MuiThemeProvider>
        <ComponentToTest data={data} />
      </MuiThemeProvider>
    ).find(ComponentToTest);

```

The MuiThemeProvider is dumb, but necessary for this pattern with `mount`

## React Testing Gotchas

- `ShallowWrapper {}` from a console.log doesn't mean it's empty! -- there's likely content in that object, and it's just not being printed

# Server Tests

- runGql and runComponentGql
- test_helpers.js library
- When you run await on a call that dispatches work without awaiting within the method, use `sleep` (TBD- where should we put sleep in a library, TKTK)
- Don't keep filling backend.test.js -- put it in a parallel directory as the file being tested in src/

# General Gotchas

- Do not disable tests with `describe.only` -- there seems to be a bug where this can disable other
  tests in the same file.
- If you're trying to `console.log` in a test and it's not printing include (unintuitively) `--verbose=false` in the `yarn test` command
- Longer tests (and TravisCI running things more slowly) -- where max timeout is
- getConfig() vs. process.env vs. global. (jest.test.js or beforeEach and restoral in afterEach..)
