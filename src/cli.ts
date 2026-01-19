import { Command } from 'commander'
import { clientGeneratorApi, hooksApi } from './clients/api'
import { clientGeneratorTemplate, hooksTemplate } from './clients/template'
import orval from 'orval'
import config from './config'

const program = new Command()

const template = async (filePage: string, outputDir: string) => {
  orval({
    input: { target: filePage },
    output: {
      mode: 'tags-split',
      target: outputDir + '/' + config.dir,
      fileExtension: `.${config.template.extension}.ts`,
      prettier: true,
      client: clientGeneratorTemplate,
      override: {
        header: false,
      },
    },
    hooks: hooksTemplate,
  })
}

const api = async (filePage: string, outputDir: string) => {
  orval({
    input: { target: filePage },
    output: {
      mode: 'tags-split',
      target: outputDir + '/' + config.dir,
      fileExtension: `.${config.api.extension}.ts`,
      client: clientGeneratorApi,
      override: {
        header: false,
      },
    },
    hooks: hooksApi,
  })
}

program
  .argument('<filePath>')
  .argument('<outputDir>')
  .action(async (filePage, outputDir) => {
    await template(filePage, outputDir)
    await api(filePage, outputDir)
  })

program.parse()
