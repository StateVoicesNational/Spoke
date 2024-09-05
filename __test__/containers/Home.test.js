/**
 * @jest-environment jsdom
 */

/**
 * UNDER CONSTRUCTION @engelhartrueben 9/5/2024
 */

import * as React from 'react';
import { act } from 'react-dom/test-utils';
import "@testing-library/jest-dom";

import { render, screen, cleanup, within } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";

import { StyleSheetTestUtils } from "aphrodite";

import Home, { queries, mutations } from "../../src/containers/Home";

// https://github.com/Khan/aphrodite/issues/62#issuecomment-267026726
beforeEach(() => {
    StyleSheetTestUtils.suppressStyleInjection();
  });
afterEach(() => {
    StyleSheetTestUtils.clearBufferAndResumeStyleInjection();
    cleanup
});

describe('Home', () => {
    // const data = {
    //   currentUser: '1'
    // }

    // const mocks = [
    //   {
    //     request: {
    //       query: queries.data.query,
    //       variables: { id: '1' }
    //     },
    //     result: {
    //       data: {
    //         currentUser: {
    //           id: '1',
    //           organizations: [{id: '1'}],
    //           ownerOrganization: [{id: '1'}],
    //           superVolOrganization: [{id: '1'}],
    //           texterOrganization: [{id: '1'}],
    //         }
    //       }
    //     },
    //     maxUsageCount: Number.POSITIVE_INFINITY
    //   }
    // ];

    const firstMock = [
      {
        request: {
          query: queries.data.query,
          variables: {}
        },
        result: {
          data: {
            currentUser: null
          }
        }
      }
    ];
    // Will probably need this for later testing
    // global.SUPPRESS_SELF_INVITE = false;

    it('loads welcome screen', async () => {
      render(
        <MockedProvider mocks={firstMock} addTypename={false}>
          <Home 
            // do not need router
            data = {{}}
            mutations = {mutations}
          />
        </MockedProvider>
      );

      // required to get past loadData
      // ALSO a solution to get rid this error:
      // An update to Query inside a test was not wrapped in act(...).
      await act(async () => await new Promise((r) => setTimeout(r, 5)));

      const image = screen.getByRole('img');
      expect(image.src).toBe(
          `https://s3-us-west-1.amazonaws.com/spoke-public/spoke_logo.svg`
      )
      expect(image.alt).toBe('Spoke Logo');

      const login = screen.getByRole('link');
      expect(login.id).toBe('login')
      expect(login.href).toBe('http://localhost:3000/login');
    })
})
