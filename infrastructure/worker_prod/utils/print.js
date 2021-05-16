const printExecTime = (end, label) => {
    console.log(`${label} - Execution completed in %ds %dms`, end[0], end[1]/1000000);
}

module.exports = {
    printExecTime
}