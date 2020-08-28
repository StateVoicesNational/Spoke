/**
 * @jest-environment jsdom
 */
import React from "react";
import { mount } from "enzyme";
import { StyleSheetTestUtils } from "aphrodite";

import yup from "yup";

import Form from "react-formal";
import { GSAutoComplete, GSForm } from "../../../src/components/forms";
import App from "../../../src/components/App";

describe("GSAutoComplete", () => {
  let colors;
  let dataSource;
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

    dataSource = [
      expect.objectContaining({
        rawValue: "#FF0000",
        text: "Red"
      }),
      expect.objectContaining({
        rawValue: "#800080",
        text: "Purple"
      }),
      expect.objectContaining({
        rawValue: "#663399",
        text: "RebeccaPurple"
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
            choices={colors}
            value={colors[0]}
            hintText={"What's your favorite color?"}
            floatingLabel={"Favorite color"}
            onChange={fakeOnChange}
          />
        </App>
      );
      autoCompleteWrapper = appWrapper.find("AutoComplete");
      gsAutoCompleteWrapper = appWrapper.find("GSAutoComplete");
      autoCompleteInstance = autoCompleteWrapper.instance();
      expect(autoCompleteInstance).toBeTruthy();
    });

    it("sets its properties", async () => {
      expect(autoCompleteWrapper.props()).toEqual(
        expect.objectContaining({
          hintText: "What's your favorite color?",
          searchText: "Red",
          floatingLabel: "Favorite color",
          dataSource,
          onNewRequest: expect.any(Function),
          onUpdateInput: expect.any(Function)
        })
      );

      expect(gsAutoCompleteWrapper.instance().state).toEqual(
        expect.objectContaining({
          dataSource,
          name: "Red",
          value: colors[0]
        })
      );
    });

    describe("when search text changes", () => {
      it("clears its value in the GSForm when the updated search text doesn't match the previous search text", async () => {
        autoCompleteInstance.props.onUpdateInput("Orange");
        expect(fakeOnChange.mock.calls).toEqual([[undefined]]);
      });

      it("does not clear its value in the GSForm when the updated search text doesn't match the previous search text", async () => {
        autoCompleteInstance.props.onUpdateInput("Red");
        expect(fakeOnChange).not.toHaveBeenCalled();
      });
    });

    describe("when the user selects an item or hits enter", () => {
      describe("when the user hits enter", () => {
        describe("and the text matches one of the choices", () => {
          it("changes its value in the GSForm", async () => {
            autoCompleteInstance.props.onNewRequest("RebeccaPurple");
            expect(fakeOnChange.mock.calls).toEqual([[colors[2]]]);
          });
        });

        describe("and the text doesn't match one of the choices", () => {
          it("changes its value in the GSForm", async () => {
            autoCompleteInstance.props.onNewRequest("Cherry Red");
            expect(fakeOnChange.mock.calls).toEqual([[undefined]]);
          });
        });
      });
    });
  });

  describe("when it's the child of a GSForm", () => {
    let formSchema;
    let formWrapper;
    let autoCompleteWrapper;
    let gsAutoCompleteWrapper;

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

      gsAutoCompleteWrapper = formWrapper.find("GSAutoComplete");
      autoCompleteWrapper = gsAutoCompleteWrapper.find("AutoComplete");
    });

    it("the GSForm creates it and sets its properties", async () => {
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
          rawValue: "#800080"
        }),
        expect.objectContaining({
          text: "RebeccaPurple",
          rawValue: "#663399"
        })
      ]);
    });
  });
});
