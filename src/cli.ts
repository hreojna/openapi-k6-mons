import { Command } from "commander";
import { clientGeneratorApi, hooksApi } from "./clients/api";
import { clientGeneratorTemplate } from "./clients/template";
import orval from "orval";
import config from "./config";

const program = new Command();

const template = async (filePage: string) => {
  orval({
    input: { target: filePage },
    output: {
      mode: "tags-split",
      target: config.dir,
      fileExtension: `.${config.template.extension}.ts`,
      prettier: true,
      client: clientGeneratorTemplate,
      override: {
        header: false,
      },
    },
  });
};
const api = async (filePage: string) => {
  orval({
    input: { target: filePage },
    output: {
      mode: "tags-split",
      target: config.dir,
      fileExtension: `.${config.api.extension}.ts`,
      client: clientGeneratorApi,
      override: {
        header: false,
      },
    },
    hooks: hooksApi,
  });
};
program.argument("<filePath>").action(async (filePage) => {
  await template(filePage);
  await api(filePage);
});
program.parse();
