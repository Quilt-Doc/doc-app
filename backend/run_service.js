var Service = require('node-windows').Service;

// Create a new service object
var svc = new Service({
  name:'DocApp Backend Express Server',
  description: 'DocApp backend',
  // script: 'C:\\path\\to\\helloworld.js',
  script: 'index.js',
  nodeOptions: [
    '--harmony',
    '--max_old_space_size=2048'
  ]
  , workingDirectory: 'C:\\Users\\Administrator\\Desktop\\doxygen-test\\DocApp\\doc-app\\backend'
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install',function(){
  svc.start();
});

svc.install();