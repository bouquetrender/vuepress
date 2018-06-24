const path = require('path')
const fs = require('fs-extra')
const resolveOptions = require('./resolveOptions')
const { genRoutesFile, genComponentRegistrationFile } = require('./codegen')
const { writeTemp, writeEnhanceTemp } = require('./util')

module.exports = async function prepare (sourceDir) {
  // 1. load options
  const options = await resolveOptions(sourceDir)

  // 2. generate routes & user components registration code
  const { routesCode, rssItems } = await genRoutesFile(options)
  const componentCode = await genComponentRegistrationFile(options)
  options.rssItems = rssItems

  await writeTemp('routes.js', [
    componentCode,
    routesCode
  ].join('\n'))

  // 3. generate siteData
  options.siteData.pages.forEach(p => {
    if (p.path) {
      p.path = p.path.replace(/.html$/g, '')
    }
    if (p.path !== '/' && p.path.endsWith('/')) {
      p.path = p.path.slice(0, -1)
    }
  })
  const dataCode = `export const siteData = ${JSON.stringify(options.siteData, null, 2)}`
  await writeTemp('siteData.js', dataCode)

  // 4. handle user override
  const overridePath = path.resolve(sourceDir, '.vuepress/override.styl')
  const hasUserOverride = fs.existsSync(overridePath)
  await writeTemp(`override.styl`, hasUserOverride ? `@import(${JSON.stringify(overridePath)})` : ``)

  // 5. handle enhanceApp.js
  const enhanceAppPath = path.resolve(sourceDir, '.vuepress/enhanceApp.js')
  await writeEnhanceTemp('enhanceApp.js', enhanceAppPath)

  // 6. handle the theme enhanceApp.js
  await writeEnhanceTemp('themeEnhanceApp.js', options.themeEnhanceAppPath)

  return options
}
