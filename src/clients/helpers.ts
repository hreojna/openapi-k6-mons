import {
  ClientDependenciesBuilder,
  GeneratorDependency,
  GeneratorSchema,
  GetterBody,
  GetterProp,
  GetterResponse,
} from 'orval'
import config from '../config'

export const getDependencies: ClientDependenciesBuilder =
  (): GeneratorDependency[] => [
    {
      exports: [
        {
          name: 'http',
          default: true,
          values: true,
          syntheticDefaultImport: true,
        },
        { name: 'Response' },
        { name: 'ResponseBody' },
        { name: 'Params' },
      ],
      dependency: 'k6/http',
    },
    {
      exports: [
        { name: 'makeRequestTemplate', isConstant: true, values: true },
        { name: 'statusIs', isConstant: true, values: true },
        { name: 'HttpSession', isConstant: true, values: true },
        { name: 'RequestBuilder', isConstant: true, values: true },
        { name: 'Method', isConstant: true, values: true },
        { name: 'Result', isConstant: true, values: true },
        { name: 'Request', isConstant: true, values: true },
        { name: 'HttpOption', isConstant: true, values: true },
        { name: 'ExecuteOptions', isConstant: true, values: true },
      ],
      dependency: config.mons,
    },
  ]

export const getRequestTemplateParamsValue = ({
  response,
  queryParams,
  headers,
  body,
}: {
  response: GetterResponse
  body: GetterBody
  queryParams?: GeneratorSchema
  headers?: GeneratorSchema
}) => {
  if (!queryParams && !headers && !response.isBlob && !body.contentType) {
    return '{}'
  }

  let value = ''

  if (response.isBlob) {
    value += `\n        responseType: 'none',`
  } else {
    value += `\n        responseType: 'text',`
  }
  if (body.contentType || headers) {
    let headersValue = `\n        headers: {`
    if (body.contentType) {
      if (body.formData) {
        headersValue += `\n            'Content-Type': '${body.contentType}; boundary=' + formData.boundary,`
      } else {
        headersValue += `\n            'Content-Type': '${body.contentType}',`
      }
    }
    headersValue += `\n        },`
    value += headersValue
  }

  return `{${value}\n    }`
}

export function functionArguments(props: GetterProp[]) {
  const queryVar: string[] = []

  const args: string[] = []
  props.forEach((prop: GetterProp) => {
    switch (prop.type) {
      case 'queryParam':
        args.push(
          prop.implementation.replace(
            new RegExp(`^${prop.name}(.+)`),
            `queryParam$1`
          )
        )
        break
      case 'param':
        queryVar.push(prop.implementation)
        break
      case 'body':
        args.push(
          prop.implementation.replace(new RegExp(`^${prop.name}(.+)`), `body$1`)
        )
        break
    }
  })
  if (queryVar.length > 0) args.unshift(`queryVar: { ${queryVar.join(', ')} }`)
  return args
}

export function builerMethodOfRequest(props: GetterProp[]) {
  let implementation = ''
  implementation += props.some((e) => e.type === 'param')
    ? '.url(queryVar)'
    : '.url()'
  if (props.some((e) => e.type === 'queryParam'))
    implementation += '.urlParam(queryParam)'
  if (props.some((e) => e.type === 'body')) implementation += '.body(body)'
  implementation += '.build()'
  return implementation
}

export function successStatus(response: GetterResponse) {
  const successCodes = response.types.success
    .map((r) => parseInt(r.key))
    .filter((code) => code >= 200 && code < 300)
  return successCodes.length > 0 ? successCodes : [200]
}

export const isJson = (response: GetterResponse) => {
  return response.contentTypes[0]?.toLocaleLowerCase() === 'application/json' && response.types.success.length > 0
}