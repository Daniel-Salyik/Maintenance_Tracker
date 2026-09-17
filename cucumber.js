module.exports = {
  default: {
    require: ['testing/bdd/steps/auth.steps.ts', 'testing/bdd/hooks/**/*.ts'],
    paths: ['testing/bdd/features/auth.feature'],
    tags: 'not @phase2'
  }
};