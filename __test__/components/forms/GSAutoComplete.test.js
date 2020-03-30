/**
 * @jest-environment jsdom
 */
import React from "react";
import { mount } from "enzyme";
import { StyleSheetTestUtils } from "aphrodite";

import yup from "yup";

import Form from "react-formal";
import GSForm from "../../../src/components/forms/GSForm";
import App from "../../../src/components/App";

describe("GSAutoComplete", () => {
  let colors;
  beforeEach(async () => {
    colors = [
      {
        label: "Red",
        value: "#FF0000"
      },
      {
        label: "Purple",
        value: "#FF00FF"
      }
    ];
  });

  describe("when the child of a GSForm", () => {
    let formSchema;
    let formWrapper;
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
              type="autocomplete"
              choices={colors}
              hintText="What's your favorite color?"
            />
          </GSForm>
        </App>
      );
    });

    it("the GSForm creates it and sets its properties", async () => {
      const gsAutoCompleteWrapper = formWrapper.find("GSAutoComplete");
      expect(gsAutoCompleteWrapper.exists()).toEqual(true);

      const autoCompleteWrapper = gsAutoCompleteWrapper.find("AutoComplete");
      expect(autoCompleteWrapper.exists()).toEqual(true);

      expect(autoCompleteWrapper.prop("searchText")).toEqual(colors[1].label);
      expect(autoCompleteWrapper.prop("hintText")).toEqual(
        "What's your favorite color?"
      );
      expect(autoCompleteWrapper.prop("dataSource")).toEqual([
        expect.objectContaining({
          text: "Red",
          rawValue: "#FF0000"
        }),
        expect.objectContaining({
          text: "Purple",
          rawValue: "#FF00FF"
        })
      ]);
    });
  });
});
