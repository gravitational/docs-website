// Bundler loader for highlightjs-terraform. The package starts with a browser
// shim, `var module = module ? module : {};`, which declares its own `module`
// variable. The bundler then doesn't treat the file as CommonJS and the
// package's exports are lost, so this removes the shim line.
module.exports = function stripHljsTerraformShim(source) {
  return source.replace(/^var module = module \? module : \{\};.*$/m, "");
};
