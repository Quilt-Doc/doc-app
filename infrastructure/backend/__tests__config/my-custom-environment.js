// my-custom-environment
const NodeEnvironment = require('jest-environment-node');
const fs = require("fs");


class CustomEnvironment extends NodeEnvironment {
  constructor(config, context) {
    super(config, context);
    this.testPath = context.testPath;
    this.docblockPragmas = context.docblockPragmas;
  }

  async setup() {
    await super.setup();
    //
    if (fs.existsSync('./test_env.json')) {
        //file exists
        var data = fs.readFileSync('./test_env.json', 'utf8');
        process.env = JSON.parse(data);
    }
  }

  async teardown() {
    // 
    fs.writeFileSync('./test_env.json', JSON.stringify(process.env));
    await super.teardown();
  }

  runScript(script) {
    return super.runScript(script);
  }

  async handleTestEvent(event, state) {
    if (event.name === 'test_start') {
      // ...
    }
  }
}

module.exports = CustomEnvironment;