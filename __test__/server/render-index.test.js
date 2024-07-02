import renderIndex from "../../src/server/middleware/render-index";

const fakeArguments = {
  html: "",
  css: {
    content: "",
    renderedClassNames: ""
  },
  assetMap: {
    "bundle.js": ""
  },
  store: {
    getState: () => ""
  }
};

describe("renderIndex", () => {
  it("returns html markup that contains a tag link for the favicon", () => {
    const { html, css, assetMap, store } = fakeArguments;
    const htmlMarkup = renderIndex(html, css, assetMap, store);
    expect(htmlMarkup).toContain(
      '<link rel=\"icon\" href=\"https://datastorespokevvn.blob.core.windows.net/assets/dispatch_logo_favicon.svg\"/>'
    );
  });
});
