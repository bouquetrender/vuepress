const preWrapper = require('./preWrapper.js')
const imgWrapper = require('./imgWrapper.js')
const lineNumbers = require('./lineNumbers')
const component = require('./component')
const hoistScriptStyle = require('./hoist')
const containers = require('./containers')
const snippet = require('./snippet')
const emoji = require('markdown-it-emoji')
const anchor = require('markdown-it-anchor')
const toc = require('markdown-it-table-of-contents')
const _slugify = require('./slugify')
const { parseHeaders, removeTailHtml } = require('../util/parseHeaders')
const { compose } = require('../util/shared')

module.exports = ({ markdown = {}} = {}, highlighter) => {
  // allow user config slugify
  const slugify = markdown.slugify || compose(removeTailHtml, _slugify)

  const md = require('markdown-it')({
    html: true,
    highlight: (str, lang) => {
      return highlighter.codeToHtml(str, lang)
    }
  })
    // custom plugins
    .use(component)
    .use(preWrapper)
    .use(imgWrapper)
    .use(snippet)
    .use(hoistScriptStyle)
    .use(containers)

    // 3rd party plugins
    .use(emoji)
    .use(anchor, Object.assign({
      slugify,
      permalink: true,
      permalinkBefore: true,
      permalinkSymbol: '#'
    }, markdown.anchor))
    .use(toc, Object.assign({
      slugify,
      includeLevel: [2, 3],
      format: parseHeaders
    }, markdown.toc))

  // apply user config
  if (markdown.config) {
    markdown.config(md)
  }

  if (markdown.lineNumbers) {
    md.use(lineNumbers)
  }

  module.exports.dataReturnable(md)

  // expose slugify
  md.slugify = slugify

  return md
}

module.exports.dataReturnable = function dataReturnable (md) {
  // override render to allow custom plugins return data
  const render = md.render
  md.render = (...args) => {
    md.__data = {}
    const html = render.call(md, ...args)
    return {
      html,
      data: md.__data
    }
  }
}
