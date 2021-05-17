// TODO: Figure out why we can't do 'mongoose.connect()' in the async function before we run pollQueue

var mongoose = require("mongoose");

const cluster = require("cluster");

const { serializeError, deserializeError } = require("serialize-error");

require("dotenv").config();

const password = process.env.EXTERNAL_DB_PASS;
const user = process.env.EXTERNAL_DB_USER;
var dbRoute = `mongodb+srv://${user}:${password}@docapp-cluster-hnftq.mongodb.net/test?retryWrites=true&w=majority`;

mongoose.connect(dbRoute, { useNewUrlParser: true });

var _ = require("underscore");

if (!process.env.PORT) {
  throw new Error("process.env.PORT not set");
}

console.log(`PORT IS ${process.env.PORT}`);

var CLUSTER_ENV_VARS = {};

/**
 * fork one process per cpu
 */
function fork(options) {
  // Count the machine's CPUs
  var cpuCount = require("os").cpus().length;

  // only allow up to 'process.env.MAX_WORKER_NUM' worker processes
  cpuCount =
    cpuCount > process.env.MAX_WORKER_NUM
      ? process.env.MAX_WORKER_NUM
      : cpuCount;

  for (var i = 0; i < cpuCount; i++) {
    var envClone = _.clone(process.env);

    envClone.WORKER_PORT = parseInt(process.env.PORT) + i;

    if (options.local && options.local != null) {
      envClone.RUNNING_LOCALLY = options.local;
    }

    if (options.noGhIssues && options.noGhIssues != null) {
      envClone.NO_GITHUB_ISSUES = options.noGhIssues;
    }

    if (options.noGhProjects && options.noGhProjects != null) {
      envClone.NO_GITHUB_PROJECTS = options.noGhProjects;
    }

    var worker = cluster.fork(envClone);
    CLUSTER_ENV_VARS[worker.id] = envClone;
  }

  cluster.on("exit", function(worker, code, signal) {
    var new_worker = cluster.fork(CLUSTER_ENV_VARS[worker.id]);
    CLUSTER_ENV_VARS[new_worker.id] = CLUSTER_ENV_VARS[worker.id];
  });
}

if (cluster.isMaster) {
  const optionDefinitions = [
    { name: "local", alias: "l", type: Boolean, defaultOption: false },
    { name: "noGhIssues", alias: "i", type: Boolean },
    { name: "noGhProjects", alias: "p", type: Boolean }
  ];

  const commandLineArgs = require("command-line-args");
  const options = commandLineArgs(optionDefinitions);

  console.log(`Master ${process.pid} is running`);

  console.log(`MongoDB Connection String: ${dbRoute}`);

  fork(options);

  /*
  setupESConnection().then(async () => {
    fork(options);
  });
  */

  cluster.on("message", (sendingWorker, message, handle) => {
    if (message.action == "log") {
      if (message.info.level == "error") {
        message.info.message = deserializeError(message.info.message);
      }
      console.log(message.info);
    }
  });

  cluster.on(`disconnect`, worker => {
    console.log(`The worker #${worker.id} has disconnected`);
  });
} else {
  require("./app");
}
