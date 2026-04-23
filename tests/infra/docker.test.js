const fs = require('fs');
const path = require('path');

describe('INFRA: Project structure and deployment verification', () => {
  it('INFRA-S1: Dockerfile exists at project root', () => {
    // GIVEN the project root
    // WHEN checking for Dockerfile
    // THEN Dockerfile exists
    const dockerfilePath = path.join(__dirname, '../../Dockerfile');
    expect(fs.existsSync(dockerfilePath)).toBe(true);
  });

  it('INFRA-S2: package.json exists with test script', () => {
    // GIVEN the project root
    // WHEN reading package.json
    // THEN test script is defined
    const pkg = require('../../package.json');
    expect(pkg.scripts).toHaveProperty('test');
  });

  it('INFRA-S3: CI workflow exists', () => {
    // GIVEN the project root
    // WHEN checking for CI workflow
    // THEN ci.yml exists
    const ciPath = path.join(__dirname, '../../.github/workflows/ci.yml');
    expect(fs.existsSync(ciPath)).toBe(true);
  });

  it('INFRA-S4: src directory contains all bounded contexts', () => {
    // GIVEN the src directory
    // WHEN checking for bounded context folders
    // THEN all 4 contexts exist
    const srcPath = path.join(__dirname, '../../src');
    expect(fs.existsSync(path.join(srcPath, 'users'))).toBe(true);
    expect(fs.existsSync(path.join(srcPath, 'catalog'))).toBe(true);
    expect(fs.existsSync(path.join(srcPath, 'orders'))).toBe(true);
    expect(fs.existsSync(path.join(srcPath, 'payment'))).toBe(true);
  });
});
