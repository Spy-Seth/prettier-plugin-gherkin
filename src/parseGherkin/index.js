const os = require("os");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const readJsonLinesSync = require("read-json-lines-sync").default;
const npmRunPath = require("npm-run-path");
const GherkinSyntaxError = require("./GherkinSyntaxError");

const parseGherkinDocument = (text) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "gherkin-parser"));
  const tmpFilePath = path.join(tmpDir, "tmp.feature");

  fs.writeFileSync(tmpFilePath, text, {
    encoding: "utf-8",
  });

  const { status, output, error } = spawnSync(
    `gherkin-javascript`,
    [/*"--no-source" , "--no-pickles", */ tmpFilePath],
    {
      encoding: "utf-8",
      env: npmRunPath.env(),
    },
  );

  fs.unlinkSync(tmpFilePath);

  if (error) {
    throw error;
  }

  if (status > 0) {
    throw new Error(
      "Failed to parse the feature file (without an explicit error message)",
    );
  }

  return output;
};

const buildGherkinDocument = (text) => {
  const output = parseGherkinDocument(text);
  const cleanedOutput = output.filter((oneLine) => !!oneLine).toString();
  const resultDocuments = readJsonLinesSync(cleanedOutput);

  const attachementDocument = resultDocuments.find(
    (oneDocument) => !!oneDocument.attachment,
  );

  const gherkinDocument = resultDocuments.find(
    (oneDocument) => !!oneDocument.gherkinDocument,
  );

  if (!gherkinDocument && attachementDocument) {
    throw new GherkinSyntaxError(attachementDocument.attachment.data, text);
  }

  return gherkinDocument.gherkinDocument;
};

const buildAstTree = (gherkinDocument) => {
  const simplifiedAst = { ...gherkinDocument };
  delete simplifiedAst.uri;

  return simplifiedAst;
};

const isStepKeyword = (keyword) => {
  return ["given", "when", "then", "and", "but"].includes(
    keyword.toLowerCase().trim(),
  );
};

const flattenAst = (nodes, oneNode) => {
  let result = [...nodes];

  if (oneNode.comments) {
    const comments = oneNode.comments;

    comments.forEach((oneComment) => {
      result.push({
        type: "comment",
        text: oneComment.text,
        location: oneComment.location,
      });
    });
  }

  if (oneNode.feature) {
    const feature = oneNode.feature;

    result.push({
      type: "feature",
      keyword: feature.keyword,
      name: feature.name || null,
      description: feature.description || null,
      tags: feature.tags
        ? feature.tags.map((oneNodeTag) => ({
            name: oneNodeTag.name,
            location: oneNodeTag.location,
          }))
        : [],
      language: feature.language,
      location: feature.location,
    });

    if (feature.children && feature.children.length > 0) {
      result = result.concat(...feature.children.reduce(flattenAst, []));
    }
  } else if (oneNode.scenario) {
    const scenario = oneNode.scenario;

    result.push({
      type: "scenario",
      keyword: scenario.keyword,
      name: scenario.name || null,
      description: scenario.description || null,
      tags: scenario.tags
        ? scenario.tags.map((oneNodeTag) => ({
            name: oneNodeTag.name,
            location: oneNodeTag.location,
          }))
        : [],
      location: scenario.location,
    });

    if (scenario.steps && scenario.steps.length > 0) {
      result = result.concat(...scenario.steps.reduce(flattenAst, []));
    }
  } else if (oneNode.keyword && isStepKeyword(oneNode.keyword)) {
    result.push({
      type: "step",
      keyword: oneNode.keyword,
      text: oneNode.text || null,
      location: oneNode.location,
    });
  } else {
    result.push({
      type: "unknown",
      ...oneNode,
    });
  }

  return result;
};

const sortFlatAstByLocation = (nodeA, nodeB) => {
  if (nodeA.location.line < nodeB.location.line) {
    return -1;
  } else if (nodeA.location.line > nodeB.location.line) {
    return 1;
  } else if (nodeA.location.line === nodeB.location.line) {
    if (nodeA.location.column < nodeB.location.column) {
      return -1;
    } else if (nodeA.location.column > nodeB.location.column) {
      return 1;
    }
  }

  return 0;
};

const parseGherkin = (text /*, parsers, options*/) => {
  const gherkinDocument = buildGherkinDocument(text);
  const astTree = buildAstTree(gherkinDocument);
  const flatAst = [astTree].reduce(flattenAst, []).sort(sortFlatAstByLocation);

  return flatAst;
};

module.exports = parseGherkin;
