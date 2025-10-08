const config = {
  root: true,
  extends: ['next/core-web-vitals'],
  rules: {
    'react-hooks/exhaustive-deps': 'warn'
  }
};

try {
  require.resolve('eslint-config-prettier');
  config.extends.push('prettier');
} catch (error) {
  // eslint-config-prettier is optional; ignore if it's not installed.
}

module.exports = config;
