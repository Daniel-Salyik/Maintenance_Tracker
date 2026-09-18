module.exports = {
  default: {
    require: ['testing/bdd/steps/*.steps.ts', 'testing/bdd/hooks/**/*.ts'],
    paths: ['testing/bdd/features/auth.feature', 'testing/bdd/features/bikes.feature'],
    tags: 'not @phase2',
    format: ['pretty']
  }
};