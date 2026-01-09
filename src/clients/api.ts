import {
  camel,
  ClientGeneratorsBuilder,
  generateVerbImports,
  GeneratorOptions,
  GeneratorVerbOptions,
  kebab,
  pascal,
  snake,
} from "orval";
import { functionArguments, getDependencies } from "./helpers";
import fs from "fs-extra";
import path from 'path';
import config from "../config";

export function clientGeneratorApi(): ClientGeneratorsBuilder {
  return {
    dependencies: getDependencies,
    client: (verbOptions: GeneratorVerbOptions, options: GeneratorOptions) => {
      return {
        implementation: generateImplementationApi(verbOptions, options),
        imports: generateVerbImports(verbOptions),
      };
    },
    header: ({ tag }): string => {
      return `import * as template from './${tag}.template.ts'\n\n`;
    },
  };
}

export const hooksApi = {
  afterAllFilesWrite: [
    (filePaths: string[]) => {
      const apiFiles = filePaths.filter(p => !p.includes('.schemas.'));

      const imports: string[] = [];
      const entries = apiFiles.map((filePath) => {
        const fileName = path.basename(filePath, '.ts');
        const tagName = fileName.replace(`.${config.api.extension}`, '')
        imports.push(`import * as ${camel(tagName)} from './${tagName}/${fileName}';`);
        return camel(tagName)
      }).map(tag => `  ${tag}`).join(',\n');

      const indexContent = [
        ...imports,
        '',
        `export const api = {`,
        entries,
        `};`
      ].join('\n');

      fs.writeFileSync("./api/index.api.ts", indexContent);
    },
  ],
}

export function generateImplementationApi(
  {
    headers,
    queryParams,
    operationName,
    response,
    body,
    props,
    verb,
    pathRoute,
    tags,
    summary,
    deprecated,
  }: GeneratorVerbOptions,
  { route, context }: GeneratorOptions,
) {
  const prefix = pascal(tags[0]!);
  let url = `${pathRoute}`;
  if (queryParams) url += "+`?${new URLSearchParams(params).toString()}`";

  const args = functionArguments(props);
  const argsParse = (obj: {
    queryVar?: string[];
    queryParam?: string;
    body?: string;
  }) => {
    let argsString: string[] = [];
    if (obj.queryVar && obj.queryVar.length > 0)
      argsString.push(`queryVar: { ${obj.queryVar.join(", ")} }`);
    if (obj.queryParam) argsString.push(obj.queryParam);
    if (obj.body) argsString.push(obj.body);
    return argsString.join(",\n    ");
  };
  const aa = argsParse(args);
  let implementation = `export function ${operationName}(
    session: HttpSession, ${aa ? "\n    " + aa + "," : ""}
    option?: Partial<HttpOption>
): Result<${response.definition.success}> {
    const response = session
        .executor(
            RequestBuilder.init(template.${prefix}Api${pascal(operationName)})
`;
  implementation +=
    args.queryVar.length > 0
      ? "                .url(queryVar)\n"
      : "                .url()\n";
  implementation += args.queryParam
    ? "                .urlParam(queryParam)\n"
    : "";
  implementation += args.body ? "                .body(body)\n" : "";
  implementation += "                .build()\n";
  implementation += "        ).run(option?.retry).check().response;\n";
  implementation += "    return { response";
  implementation +=
    response.contentTypes[0]?.toLocaleLowerCase() === "application/json"
      ? `, data: response.json() as ${response.definition.success} }\n\n`
      : ` }\n\n`;
  implementation += "}\n\n";
  return implementation;
}
