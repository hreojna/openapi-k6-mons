import { ClientGeneratorsBuilder, generateVerbImports, GeneratorOptions, GeneratorVerbOptions, pascal } from "orval";
import { functionArguments, getDependencies, getRequestTemplateParamsValue, successStatus } from "./helpers";

export function clientGeneratorTemplate(): ClientGeneratorsBuilder {
  return {
    dependencies: getDependencies,
    client: (verbOptions: GeneratorVerbOptions, options: GeneratorOptions) => {
      return {
        implementation: generateImplementationTemplate(verbOptions, options),
        imports: generateVerbImports(verbOptions),
      };
    },
  };
}

export function generateImplementationTemplate(
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
  operationName = `${prefix}Api${pascal(operationName)}`;
  let url = `${pathRoute}`;
  if (queryParams) url += "+`?${new URLSearchParams(params).toString()}`";

  let implementation: string = `export const ${operationName} = makeRequestTemplate({
    method: Method.${verb.toUpperCase()},
    url: '${pathRoute}',
    params: ${getRequestTemplateParamsValue({ response, body, headers: headers?.schema, queryParams: queryParams?.schema })},
    checks: statusIs(${successStatus(response).join(",")}),
})
`;

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

  implementation += `
export function get${operationName}(
    ${argsParse(args)}
): Request {
    return RequestBuilder.init(${operationName})
`;
  implementation +=
    args.queryVar.length > 0 ? "        .url(queryVar)\n" : "        .url()\n";
  implementation += args.queryParam ? "        .urlParam(queryParam)\n" : "";
  implementation += args.body ? "        .body(body)\n" : "";
  implementation += "        .build()\n";
  implementation += "}\n\n";
  return implementation;
}