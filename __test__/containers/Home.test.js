/**
 * @jest-environment jsdom
 */

import * as React from 'react';
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { ApolloProvider } from "@apollo/client";
import ApolloClientSingleton from "../../src/network/apollo-client-singleton";

import { StyleSheetTestUtils } from "aphrodite";
import { muiTheme } from "../test_helpers";

import Home from "../../src/containers/Home";

// https://github.com/Khan/aphrodite/issues/62#issuecomment-267026726
beforeEach(() => {
    StyleSheetTestUtils.suppressStyleInjection();
  });
afterEach(() => {
    StyleSheetTestUtils.clearBufferAndResumeStyleInjection();
});

describe('Home', () => {
    // REMOVE SKIP
    it.skip('contains logo', () => {
        render(
            <ApolloClientSingleton client={ApolloClientSingleton}>
                <Home
                    data=""
                    router=""
                    mutations=""
                />
            </ApolloClientSingleton>
        );
        const image = screen.getByRole('img');
        expect(image.src).toBe(
            `https://s3-us-west-1.amazonaws.com/spoke-public/spoke_logo.svg`
        )
        expect(image.alt).toBe('Spoke Logo')
    })
})