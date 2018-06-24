module.exports = md => {
  const defaultRenderer = md.renderer.rules.image

  md.renderer.rules.image = (tokens, idx, options, env, self) => {
    return `<figure>${defaultRenderer(tokens, idx, options, env, self)}</figure>`
  }
}
