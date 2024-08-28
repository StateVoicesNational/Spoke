/**
 * @jest-environment jsdom
 */

import * as React from 'react';
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { StyleSheetTestUtils } from "aphrodite";

import Downtime from "../../src/components/Downtime";

// https://github.com/Khan/aphrodite/issues/62#issuecomment-267026726
beforeEach(() => {
    StyleSheetTestUtils.suppressStyleInjection();
  });
afterEach(() => {
    StyleSheetTestUtils.clearBufferAndResumeStyleInjection();
});

describe('Downtime', () => {
    it('contains logo and alt text', () => {
        render(<Downtime />);
        const image = screen.getByRole('img');
        expect(image.src).toBe(
            `https://s3-us-west-1.amazonaws.com/spoke-public/spoke_logo.svg?downtime`
        );
        expect(image.alt).toBe('Spoke Logo');
    });

    it('contains developer message when visited without DOWNTIME being set', () => {
        const { container } = render(<Downtime />);
        expect(container).toHaveTextContent(
            `This page is where Spoke users are brought ` +
            `to when the system is set to DOWNTIME=true for maintenance, etc.`
        );
    });

    it('contains message to user when DOWNTIME=true', () => {
        global.DOWNTIME = true;
        const { container } = render(<Downtime />);
        expect(container).toHaveTextContent(
            `Spoke is not currently available. ` +
            `Please talk to your campaign manager or system administrator.`
        );
    });
});