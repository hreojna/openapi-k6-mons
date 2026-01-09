import {
  ClientDependenciesBuilder,
  GeneratorDependency,
  GeneratorSchema,
  GetterBody,
  GetterProp,
  GetterResponse,
} from "orval";
import config from "../config";

export const getDependencies: ClientDependenciesBuilder =
  (): GeneratorDependency[] => [
    {
      exports: [
        {
          name: "http",
          default: true,
          values: true,
          syntheticDefaultImport: true,
        },
        { name: "Response" },
        { name: "ResponseBody" },
        { name: "Params" },
      ],
      dependency: "k6/http",
    },
    {
      exports: [
        { name: "makeRequestTemplate", isConstant: true, values: true },
        { name: "statusIs", isConstant: true, values: true },
        { name: "HttpSession", isConstant: true, values: true },
        { name: "RequestBuilder", isConstant: true, values: true },
        { name: "Method", isConstant: true, values: true },
        { name: "Result", isConstant: true, values: true },
        { name: "Request", isConstant: true, values: true },
        { name: "HttpOption", isConstant: true, values: true },
      ],
      dependency: config.mons,
    },
  ];

export const getRequestTemplateParamsValue = ({
  response,
  queryParams,
  headers,
  body,
}: {
  response: GetterResponse;
  body: GetterBody;
  queryParams?: GeneratorSchema;
  headers?: GeneratorSchema;
}) => {
  if (!queryParams && !headers && !response.isBlob && !body.contentType) {
    return "{}";
  }

  let value = "";

  if (response.isBlob) {
    value += `\n        responseType: 'binary',`;
  } else {
    value += `\n        responseType: 'text',`;
  }
  if (body.contentType || headers) {
    let headersValue = `\n        headers: {`;
    if (body.contentType) {
      if (body.formData) {
        headersValue += `\n            'Content-Type': '${body.contentType}; boundary=' + formData.boundary,`;
      } else {
        headersValue += `\n            'Content-Type': '${body.contentType}',`;
      }
    }
    headersValue += `\n        },`;
    value += headersValue;
  }

  return `{${value}\n    }`;
};

export function functionArguments(props: GetterProp[]) {
  let queryVar: string[] = [];
  let queryParam = "";
  let body = "";

  props.forEach((prop: GetterProp) => {
    switch (prop.type) {
      case "queryParam":
        queryParam = prop.implementation.replace(
          new RegExp(`^${prop.name}(.+)`),
          `queryParam$1`,
        );
        break;
      case "param":
        queryVar.push(prop.implementation);
        break;
      case "body":
        body = prop.implementation.replace(
          new RegExp(`^${prop.name}(.+)`),
          `body$1`,
        );
        break;
    }
  });
  return { queryVar, queryParam, body };
}

export function successStatus(response: GetterResponse) {
  const successCodes = response.types.success
    .map((r) => parseInt(r.key))
    .filter((code) => code >= 200 && code < 300);
  return successCodes.length > 0 ? successCodes : [200];
}
