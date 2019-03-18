/*  
    One-time setup instructions (provided you don't blow away any of your node_modules directories):
        1.  Navigate into each /tests/jest_versions/jest-vx.x.x directory and execute 'npm install'.
            The package.json file in that directory will install the correct version of jest.
    
    How to run tests:
        1.  Complete the one-time setup instructions if you haven't already.
        2.  Execute 'npm run test'.
        3.  If you get an error similar to this: SecurityError: localStorage is not available for opaque origins,
            simply update your version of jest at the root level (this will not invalidate our tests).

    Need to know:
        1. DO NOT delete any of the node_modules directories in /jest_versions
        2. You may delete all contents of any node_modules directory EXCEPT /@reportportal

        This is because I force added a .gitkeep within each jest version node_modules directory to 
        preserve a specific directory structure in order to test the possible paths in jestUtils.js.
        I had to fool it into thinking it is located where it normally would be in node_modules when 
        installed with a package.
        
        /jest_versions/jest-vx.x.x/node_modules/@reportportal/reportportal-agent-jest/utils/.gitkeep 

    How to add additional jest versions for testing:
        1.  Add the new version to the jestVersions array below.
        2.  Add a new sub-directory in jest_versions following this naming convention jest-vx.x.x
        3.  Copy the package.json file from any other sibling directory into your new directory
        4.  Update the jest version in your newly copied package.json
        5.  Add the @reportportal directory structure as explained in 'Need to know'
        6.  Execute 'git add -f ./path-to-file/.gitkeep' to force add the .gitkeep file
*/

describe('jestUtils', () => {
    const jestVersions = [
        'v24.5.0',
        'v24.0.0',
        'v23.6.0'
    ];
    test.each(jestVersions)('require base_reporter from jest-%s',  (jestVersion) => {
        const load_base_reporter = require('../utils/jestUtils').load_base_reporter;
        const pathToNodeModulesLocation = `../tests/jest_versions/jest-${jestVersion}/node_modules/@reportportal/reportportal-agent-jest/utils`;
        const result = load_base_reporter(pathToNodeModulesLocation);
        expect(result).toBeDefined();
        expect(result).not.toBe(null);
    });
});