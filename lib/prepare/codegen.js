const path = require('path')
const { fileToComponentName, resolveComponents } = require('./util')

exports.genRoutesFile = async function ({
  siteData: { pages },
  sourceDir,
  pageFiles
}) {
  const rssItems = []

  function genRoute ({ path: pagePath, key: componentName, frontmatter }, index) {
    const file = pageFiles[index]
    const filePath = path.resolve(sourceDir, file)

    let cleanPagePath = pagePath.replace(/.html/g, '')
    if (cleanPagePath !== '/' && cleanPagePath.endsWith('/')) {
      cleanPagePath = cleanPagePath.slice(0, -1)
    }
    let code = `
  {
    name: ${JSON.stringify(componentName)},
    path: ${JSON.stringify(cleanPagePath)},
    component: ThemeLayout,
    beforeEnter: (to, from, next) => {
      import(${JSON.stringify(filePath)}).then(comp => {
        Vue.component(${JSON.stringify(componentName)}, comp.default)
        next()
      })
    }
  }`

    if (!frontmatter.top_page) {
      rssItems.push({
        title: frontmatter.title,
        path: cleanPagePath,
        date: frontmatter.date
      })
    }

    const dncodedPath = decodeURIComponent(pagePath)
    if (dncodedPath !== pagePath) {
      code += `,
  {
    path: ${JSON.stringify(dncodedPath)},
    redirect: ${JSON.stringify(cleanPagePath)}
  }`
    }

    if (/\/$/.test(pagePath)) {
      code += `,
  {
    path: ${JSON.stringify(pagePath + 'index.html')},
    redirect: ${JSON.stringify(cleanPagePath)}
  }`
    }

    return code
  }

  const notFoundRoute = `,
  {
    path: '*',
    component: ThemeNotFound
  }`

  const generatedRoutes = pages.map(genRoute)

  const routesCode = (
    `import ThemeLayout from '@themeLayout'\n` +
    `import ThemeNotFound from '@themeNotFound'\n` +
    `import { injectMixins } from '@app/util'\n` +
    `import rootMixins from '@app/root-mixins'\n\n` +
    `injectMixins(ThemeLayout, rootMixins)\n` +
    `injectMixins(ThemeNotFound, rootMixins)\n\n` +
    `export const routes = [${generatedRoutes.join(',')}${notFoundRoute}\n]`
  )

  return {
    routesCode,
    rssItems
  }
}

exports.genComponentRegistrationFile = async function ({ sourceDir }) {
  function genImport (file) {
    const name = fileToComponentName(file)
    const baseDir = path.resolve(sourceDir, '.vuepress/components')
    const absolutePath = path.resolve(baseDir, file)
    const code = `Vue.component(${JSON.stringify(name)}, () => import(${JSON.stringify(absolutePath)}))`
    return code
  }

  const components = (await resolveComponents(sourceDir)) || []
  return `import Vue from 'vue'\n` + components.map(genImport).join('\n')
}

