// This file simulates real-world error handler that makes this component observable
const errorHandler = {
  handleError: async (errorToHandle) => {
    console.error(errorToHandle);
    metricsExporter.fireMetric("error", { errorName: errorToHandle.name });
  },
};

// This simulates a typical monitoring solution that allow firing custom metrics when
// like Prometheus, DataDog, CloudWatch, etc
const metricsExporter = {
  fireMetric: async (name, labels) => {
    console.log("In real production code I will really fire metrics");
  },
};

module.exports.errorHandler = errorHandler;
module.exports.metricsExporter = metricsExporter;
