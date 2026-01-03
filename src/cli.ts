import { Command } from "commander";
import {
  clientGeneratorApi,
} from "./clients/api";
import {
  clientGeneratorTemplate,
} from "./clients/template"
import orval from "orval";

const program = new Command();
const hooks = {
  afterAllFilesWrite: {
    command: "npx prettier --write .",
    injectGeneratedDirsAndFiles: false,
  },
};
const template = async (filePage: string) => {
  orval({
    input: { target: filePage },
    output: {
      mode: "tags-split",
      target: "./api",
      fileExtension: ".template.ts",
      prettier: true,
      client: clientGeneratorTemplate,
      override: {
        header: false
      },
    },
    hooks: hooks,
  });
};
const api = async (filePage: string) => {
  orval({
    input: { target: filePage },
    output: {
      mode: "tags-split",
      target: "./api",
      fileExtension: ".api.ts",
      client: clientGeneratorApi,
      override: {
        header: false,
      },
    },
    hooks: hooks,
  });
};
program.argument("<filePath>").action(async (filePage) => {
  await template(filePage);
  await api(filePage);
});
program.parse();
