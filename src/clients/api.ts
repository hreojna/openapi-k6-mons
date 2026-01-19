import {
  camel,
  ClientGeneratorsBuilder,
  generateVerbImports,
  GeneratorOptions,
  GeneratorVerbOptions,
  kebab,
  pascal,
  snake,
  toObjectString,
} from 'orval'
import {
  builerMethodOfRequest,
  functionArguments,
  getDependencies,
  isJson,
} from './helpers'
import fs from 'fs-extra'
import path from 'path'
import config from '../config'

export function clientGeneratorApi(): ClientGeneratorsBuilder {
  return {
    dependencies: getDependencies,
    client: (verbOptions: GeneratorVerbOptions, options: GeneratorOptions) => {
      return {
        implementation: generateImplementationApi(verbOptions, options),
        imports: generateVerbImports(verbOptions),
      }
    },
    header: ({ tag }): string => {
      return `import * as template from './${tag}.template.ts'\n\n`
    },
  }
}

export const generateIndexApi = async (outputDir: string) => [
  (filePaths: string[]) => {
    const apiFiles = filePaths.filter((p) => !p.includes('.schemas.'))

    const imports: string[] = []
    const entries = apiFiles
      .map((filePath) => {
        const fileName = path.basename(filePath, '.ts')
        const tagName = fileName.replace(`.${config.api.extension}`, '')
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
      `export const api = {`,
      entries,
      `};`,
    ].join('\n')

    fs.writeFileSync(`${outputDir + '/' + config.dir}/index.api.ts`, indexContent)
  },
]

export const hooksApi = {
  afterAllFilesWrite: [
    (filePaths: string[]) => {
      const apiFiles = filePaths.filter((p) => !p.includes('.schemas.'))

      const imports: string[] = []
      const entries = apiFiles
        .map((filePath) => {
          const fileName = path.basename(filePath, '.ts')
          const tagName = fileName.replace(`.${config.api.extension}`, '')
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
        `export const api = {`,
        entries,
        `};`,
      ].join('\n')

      fs.writeFileSync(`${config.dir}/index.api.ts`, indexContent)
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
  { route, context }: GeneratorOptions
) {
  const prefix = pascal(tags[0]!)
  const args = functionArguments(props)

  let implementation = `export function ${operationName}(
    session: HttpSession, ${args && args.length > 0 ? `\n    ${args.join(',\n    ')},` : ''}
    option?: ExecuteOptions
): Result${isJson(response) ? `<${response.definition.success}>` : ''} {
    const response = session
        .executor(
            RequestBuilder.init(template.${prefix}Api${pascal(operationName)})
                .params(option?.params)${builerMethodOfRequest(props)}
        ).run(option?.retry).check(option?.checks).response;
    return { response`
  implementation += isJson(response)
    ? `, data: response.json() }\n\n`
    : ` }\n\n`
  implementation += '}\n\n'
  if (pathRoute === '/api/doughs') {
    console.log(response.contentTypes[0]?.toLocaleLowerCase())
    console.log(args)
    console.log(JSON.stringify(response.types.success[0]))
  }
  return implementation
}
