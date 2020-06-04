
parseCode = (file_name, res) => {
    var extension = file_name.slice(file_name.lastIndexOf('.')+1);
    console.log('Parse code got extension: ', extension);
    
    const { execFile } = require('child_process');
    const child = execFile('ls', ['-la'], (error, stdout, stderr) => {
    if (error) {
        return res.json({success: false, error: 'parseCode error: ' + error});
    }
    return res.json({success: true});
});

    console.log('End of parse code');
}

module.exports = {
    parseCode
}