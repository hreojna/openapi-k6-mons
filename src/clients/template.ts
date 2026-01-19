import {
  camel,
  ClientGeneratorsBuilder,
  generateVerbImports,
  GeneratorOptions,
  GeneratorVerbOptions,
  pascal,
} from 'orval'
import {
  builerMethodOfRequest,
  functionArguments,
  getDependencies,
  getRequestTemplateParamsValue,
  successStatus,
} from './helpers'
import fs from 'fs-extra'
import path from 'path'
import config from '../config'

export function clientGeneratorTemplate(): ClientGeneratorsBuilder {
  return {
    dependencies: getDependencies,
    client: (verbOptions: GeneratorVerbOptions, options: GeneratorOptions) => {
      return {
        implementation: generateImplementationTemplate(verbOptions, options),
        imports: generateVerbImports(verbOptions),
      }
    },
  }
}

export const hooksTemplate = {
  afterAllFilesWrite: [
    (filePaths: string[]) => {
      const templateFiles = filePaths.filter((p) => !p.includes('.schemas.'))

      const imports: string[] = []
      const entries = templateFiles
        .map((filePath) => {
          const fileName = path.basename(filePath, '.ts')
          const tagName = fileName.replace(`.${config.template.extension}`, '')
          imports.push(
            `import * as ${camel(tagName)} from './${tagName}/${fileName}';`
          )
          return camel(tagName)
        })
        .map((tag) => `  ${tag}`)
        .join(',\n')

      const indexContent = [
        ...imports,
        '',
        `export const template = {`,
        entries,
        `};`,
      ].join('\n')

      fs.writeFileSync(`${config.dir}/index.template.ts`, indexContent)
    },
  ],
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
  { route, context }: GeneratorOptions
) {
  const prefix = pascal(tags[0]!)
  operationName = `${prefix}Api${pascal(operationName)}`
  let url = `${pathRoute}`
  if (queryParams) url += '+`?${new URLSearchParams(params).toString()}`'

  let implementation: string = `export const ${operationName} = makeRequestTemplate({
    method: Method.${verb.toUpperCase()},
    url: '${pathRoute}',
    params: ${getRequestTemplateParamsValue({ response, body, headers: headers?.schema, queryParams: queryParams?.schema })},
    checks: statusIs(${successStatus(response).join(',')}),
})
`

  const args = functionArguments(props)

  implementation += `
export function get${operationName}(
   ${args && args.length > 0 ? `\n    ${args.join(',\n    ')}, params?: Params` : 'params?: Params'}
): Request {
    return RequestBuilder.init(${operationName})
      .params(params)${builerMethodOfRequest(props)}
}\n\n`

  if (pathRoute === '/api/bytes/{n}') {
    // console.log(response)
    // console.log(JSON.stringify(response.types.success[0]))
    // console.log(queryParams)
    // console.log(headers)
    // console.log(body)
    // console.log(JSON.stringify(args))
  }
  return implementation
}
