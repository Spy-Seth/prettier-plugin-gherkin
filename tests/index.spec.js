const prettier = require("prettier");
const fs = require("fs");
const path = require("path");

const defaultOptions = {
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
};

const format = (text, options = defaultOptions) => {
  return prettier.format(text, {
    ...options,
    parser: "gherkin-parser",
    plugins: ["."],
  });
};

describe("prettier-plugin-gherkin", () => {
  it("format `basic.feature` file", () => {
    const fixtureFeatureFile = fs.readFileSync(
      path.join(__dirname, "fixtures/basic.feature"),
      { encoding: "utf-8" },
    );

    const sut = format(fixtureFeatureFile);

    expect(sut).toMatchSnapshot();
  });

  describe("Feature:", () => {
    it("should preserve a long feature title in one line", () => {
      const fixture = `Feature: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`;

      const formattedFixture = format(fixture);

      expect(formattedFixture).toMatchInlineSnapshot(
        `"Feature: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."`,
      );
    });

    it("should break in multiple line a long feature description", () => {
      const fixture = `Feature: Lorem ipsum dolor sit amet
  Placerat duis ultricies lacus sed turpis tincidunt id aliquet. Id faucibus nisl tincidunt eget nullam non. Sapien faucibus et molestie ac feugiat sed lectus vestibulum mattis. Et tortor consequat id porta nibh venenatis cras sed felis. Felis eget velit aliquet sagittis id consectetur.
`;

      const formattedFixture = format(fixture);

      expect(formattedFixture).toMatchInlineSnapshot(`
"Feature: Lorem ipsum dolor sit amet

  Placerat duis ultricies lacus sed turpis tincidunt id aliquet. Id faucibus
  nisl tincidunt eget nullam non. Sapien faucibus et molestie ac feugiat sed
  lectus vestibulum mattis. Et tortor consequat id porta nibh venenatis cras sed
  felis. Felis eget velit aliquet sagittis id consectetur."
`);
    });

    it("should introduce a blank line between the feature title and description (if any)", () => {
      const fixture = `Feature: Lorem ipsum dolor sit amet
Placerat duis ultricies
`;

      const formattedFixture = format(fixture);

      expect(formattedFixture).toMatchInlineSnapshot(`
"Feature: Lorem ipsum dolor sit amet

  Placerat duis ultricies"
`);
    });
  });

  describe("Scenario:", () => {
    it("should preserve a long scenario title in one line", () => {
      const fixture = `Feature: Some feature
  Scenario: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
`;

      const formattedFixture = format(fixture);

      expect(formattedFixture).toMatchInlineSnapshot(`
"Feature: Some feature

  Scenario: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
`);
    });

    it("should break in multiple line a long scenario description", () => {
      const fixture = `Feature: Some feature title
  Scenario: Some scenario title
    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
`;

      const formattedFixture = format(fixture);

      expect(formattedFixture).toMatchInlineSnapshot(`
"Feature: Some feature title

  Scenario: Some scenario title
    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
    tempor incididunt ut labore et dolore magna aliqua."
`);
    });

    it("should introduce a blank line between the scenario title and description (if any)", () => {
      const fixture = `Feature: Some feature title
    Scenario: Some scenario title
      Lorem ipsum dolor sit amet.
  `;

      const formattedFixture = format(fixture);

      expect(formattedFixture).toMatchInlineSnapshot(`
"Feature: Some feature title

  Scenario: Some scenario title
    Lorem ipsum dolor sit amet."
`);
    });

    it("could also be named `Example`", () => {
      const fixture = `Feature: Some feature title
  Example: Some scenario title
    Lorem ipsum dolor sit amet.
`;

      const formattedFixture = format(fixture);

      expect(formattedFixture).toMatchInlineSnapshot(`
"Feature: Some feature title

  Example: Some scenario title
    Lorem ipsum dolor sit amet."
`);
    });
  });

  describe("Steps", () => {});

  describe("Step Arguments", () => {
    describe("Doc Strings", () => {});
    describe("Data Tables", () => {});
  });

  describe("Rule:", () => {
    it.todo("should break in multiple line a long rule title");
    it.todo("should break in multiple line a long rule description");
    it.todo(
      "should introduce a blank line between the rule title and description (if any)",
    );
  });

  describe("Background:", () => {});

  describe("Scenario Outline:", () => {});

  describe("Tags", () => {
    it("can be before a Feature element", () => {
      const fixture = `  @important   @ui   
Feature: Lorem ipsum dolor sit amet
    `;

      const formattedFixture = format(fixture);

      expect(formattedFixture).toMatchInlineSnapshot(`
"@important @ui
Feature: Lorem ipsum dolor sit amet"
`);
    });

    it("can be before a Scenario element", () => {
      const fixture = `Feature: Lorem ipsum dolor sit amet
      @important   @ui   
  Scenario: Id faucibus nisl tincidunt eget nullam non 
    `;

      const formattedFixture = format(fixture);

      expect(formattedFixture).toMatchInlineSnapshot(`
"Feature: Lorem ipsum dolor sit amet

  @important @ui
  Scenario: Id faucibus nisl tincidunt eget nullam non"
`);
    });

    it.todo("can be before a Scenario Outline element");

    it.todo("can be before a Examples element");
  });
});
