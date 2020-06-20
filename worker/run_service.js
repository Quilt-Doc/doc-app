var Service = require('node-windows').Service;

// Create a new service object
var svc = new Service({
  name:'DocApp Backend Worker',
  description: 'DocApp worker',
  // script: 'C:\\path\\to\\helloworld.js',
  script: 'index.js',
  nodeOptions: [
    '--harmony',
    '--max_old_space_size=2048'
  ]
  , workingDirectory: 'C:\\Users\\Administrator\\Desktop\\DocApp\\doc-app\\worker'
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install',function(){
  svc.start();
});

svc.install();