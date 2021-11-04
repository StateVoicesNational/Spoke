/**
 * @jest-environment jsdom
 */
import React from "react";
import { mount } from "enzyme";
import { StyleSheetTestUtils } from "aphrodite";
import * as yup from "yup";
import Form from "react-formal";

import Autocomplete from "@material-ui/lab/Autocomplete";
import TextField from "@material-ui/core/TextField";

import { GSAutoComplete, GSForm } from "../../../src/components/forms";
import App from "../../../src/components/App";

describe("GSAutoComplete", () => {
  let colors;
  let options;
  beforeEach(async () => {
    StyleSheetTestUtils.suppressStyleInjection();
    colors = [
      {
        label: "Red",
        value: "#FF0000"
      },
      {
        label: "Purple",
        value: "#800080"
      },
      {
        label: "RebeccaPurple",
        value: "#663399"
      }
    ];

    options = [
      expect.objectContaining({
        value: "#FF0000",
        label: "Red"
      }),
      expect.objectContaining({
        value: "#800080",
        label: "Purple"
      }),
      expect.objectContaining({
        value: "#663399",
        label: "RebeccaPurple"
      })
    ];
  });

  describe("when we test GSAutoComplete in isolation", () => {
    let appWrapper;
    let autoCompleteWrapper;
    let autoCompleteInstance;
    let gsAutoCompleteWrapper;
    let fakeOnChange;
    beforeEach(async () => {
      fakeOnChange = jest.fn();
      appWrapper = mount(
        <App>
          <GSAutoComplete
            options={colors}
            value={colors[0]}
            placeholder={"What's your favorite color?"}
            label={"Favorite color"}
            onChange={fakeOnChange}
          />
        </App>
      );
      autoCompleteWrapper = appWrapper.find(Autocomplete);
      gsAutoCompleteWrapper = appWrapper.find("GSAutoComplete");
      autoCompleteInstance = autoCompleteWrapper.instance();
      // expect(autoCompleteInstance).toBeTruthy();
      expect(autoCompleteWrapper.length).toBe(1);
    });

    it("sets its properties", async () => {
      expect(autoCompleteWrapper.props()).toEqual(
        expect.objectContaining({
          value: expect.objectContaining({
            value: "#FF0000",
            label: "Red"
          }),
          options,
          onChange: expect.any(Function),
          getOptionLabel: expect.any(Function)
        })
      );
    });
  });

  describe("when it's the child of a GSForm", () => {
    let formSchema;
    let formWrapper;
    let autoCompleteWrapper;
    let gsAutoCompleteWrapper;
    let autoCompleteTextField;

    beforeEach(async () => {
      StyleSheetTestUtils.suppressStyleInjection();

      formSchema = yup.object({
        colors: yup.string()
      });

      formWrapper = mount(
        <App>
          <GSForm
            schema={formSchema}
            value={{ colors: colors[1] }}
            onChange={() => {}}
          >
            <Form.Field
              name="colors"
              as={GSAutoComplete}
              options={colors}
              placeholder="What's your favorite color?"
            />
          </GSForm>
        </App>
      );

      gsAutoCompleteWrapper = formWrapper.find(GSAutoComplete);
      autoCompleteWrapper = gsAutoCompleteWrapper.find(Autocomplete);
      autoCompleteTextField = autoCompleteWrapper.find(TextField);
    });

    it("the GSForm creates it and sets its properties", async () => {
      expect(autoCompleteWrapper.prop("value").label).toEqual(colors[1].label);
      expect(autoCompleteTextField.prop("placeholder")).toEqual(
        "What's your favorite color?"
      );
      expect(autoCompleteWrapper.prop("options")).toEqual([
        expect.objectContaining({
          label: "Red",
          value: "#FF0000"
        }),
        expect.objectContaining({
          label: "Purple",
          value: "#800080"
        }),
        expect.objectContaining({
          label: "RebeccaPurple",
          value: "#663399"
        })
      ]);
    });
  });
});
