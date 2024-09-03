/**
 * @jest-environment jsdom
 */

import * as React from 'react';
import { act } from 'react-dom/test-utils';
import ReactDOM from 'react-dom/client';
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { ApolloProvider } from "@apollo/client";
import ApolloClientSingleton from "../../src/network/apollo-client-singleton";

import { StyleSheetTestUtils } from "aphrodite";

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
    const data = {
        currentUser: 1
    }

    it('contains logo', () => {
        // need router, data, mutations
        act(() => {
            ReactDOM.createRoot(container).render(
                <ApolloProvider client={ApolloClientSingleton}>
                    <Home
                        data = {data}
                        mutations=""
                    />
                </ApolloProvider>     
            );            
        })
        const image = container.getByRole('img');
        expect(image.src).toBe(
            `https://s3-us-west-1.amazonaws.com/spoke-public/spoke_logo.svg`
        )
        expect(image.alt).toBe('Spoke Logo')
    })
})