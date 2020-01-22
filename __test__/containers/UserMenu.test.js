/**
 * @jest-environment jsdom
 */
import React from "react";
import { shallow, mount } from "enzyme";
import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import Store from "../../src/store";
import { createMemoryHistory } from "react-router";
import ApolloClientSingleton from "../../src/network/apollo-client-singleton";
import { ApolloProvider } from "react-apollo";
import UserMenu from "../../src/containers/UserMenu";
import { r } from "../../src/server/models/";
import { createUser, setupTest, cleanupTest, runGql } from "../test_helpers";
import { assignmentId, testTexterUser } from "../server/texter.test/common";
import gql from "graphql-tag";

describe("UserMenu", () => {
  let store;
  let testUser;

  beforeEach(async () => {
    await setupTest();
    testUser = await createUser();
  }, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

  store = new Store(createMemoryHistory("/")).data;
  it("becomes active when the user icon is clicked", async () => {
    const getCurrentUserForMenuQuery = gql`
      query getCurrentUserForMenu {
        currentUser {
          id
          displayName
          email
          organizations {
            id
            name
          }
        }
      }
    `;

    const userResult = await runGql(getCurrentUserForMenuQuery, {}, testUser);

    console.log("userResult", userResult);

    const wrapper = mount(
      <ApolloProvider store={store} client={ApolloClientSingleton}>
        <MuiThemeProvider>
          <UserMenu />
        </MuiThemeProvider>
      </ApolloProvider>
    );
    // const userMenuButton = document.querySelector(
    //   "[data-test=userMenuButton]"
    // );
  });

  afterEach(async () => {
    await cleanupTest();
    if (r.redis) r.redis.flushdb();
  }, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);
});
