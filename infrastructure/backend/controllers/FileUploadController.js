const AWS = require('aws-sdk');
const fs = require('fs');

const Document = require('../models/Document');
const Workspace = require('../models/Workspace');

//setting the credentials
//The region should be the region of the bucket that you created
//Visit this if you have any confusion - https://docs.aws.amazon.com/general/latest/gr/rande.html
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_DEFAULT_REGION,
});

// Creating a new instance of S3:
const s3 = new AWS.S3();

const logger = require('../logging/index').logger;

checkValid = (item) => {
    if (item !== undefined && item !== null) {
        return true
    }
    return false
}


// POST method route for uploading file
const postFile = async (req, res) => {
    //Multer middleware adds file(in case of single file ) or files(multiple files) object to the request object.
    // req.file is the attachment

    const { workspaceId, documentId } = req.body;

    if (!checkValid(workspaceId)) return res.json({success: false, error: 'file upload no workspaceId provided'});
    if (!checkValid(documentId)) return res.json({success: false, error: 'file upload no documentId provided'});

    if (!req.file) return res.json({success: false, error: 'No file upload found'});

    await logger.info({source: 'backend-api',
                        message: `Beginning to upload file - req.file.path, req.file.filename: ${req.file.path}, ${req.file.filename}`,
                        function: 'postFile'});

    var source = req.file.path;
    var targetName = `${workspaceId}/${documentId}/${req.file.filename}`;

    // Read from disk where multer stored the file
    var fileData;
    try {
        fileData = await fs.promises.readFile(source);
    }
    catch (err) {
        await logger.error({source: 'backend-api',
                            message: `Error reading file from disk - source: ${source}`,
                            function: 'postFile'});
        return res.json({success: false, error: `Error reading file from disk - source: ${source}`});
    }

    // Upload to S3
    const putParams = {
        Bucket      : process.env.AWS_S3_ATTACHMENTS_BUCKET,
        Key         : targetName,
        Body        : fileData
    };

    try {
        var data = await s3.putObject(putParams).promise();
    }
    catch (err) {
        await logger.error({source: 'backend-api',
                            message: `Error uploading file to S3 - Bucket, Key: ${process.env.AWS_S3_ATTACHMENTS_BUCKET}, ${targetName}`,
                            function: 'postFile'});
        return res.json({success: false, error: `Error uploading file to S3`});
    }

    // Deleting the file from uploads folder.
    try {
        await fs.promises.unlink(source);
    }
    catch (err) {
        await logger.error({source: 'backend-api',
                            message: `Error unlinking file on disk - source: ${source}`,
                            function: 'postFile'});
        return res.json({success: false, error: `Error unlinking file on disk - source: ${source}`});
    }

    // Add file key to 'attachments' field of Document model
    var document;
    try {
        document = await Document.findByIdAndUpdate(documentId, { $push: { attachments: targetName } }, { new: true }).select('_id attachments').lean().exec();
    }
    catch (err) {
        await logger.error({source: 'backend-api',
                            message: `Error pushing to Document 'attachments' - documentId, targetName: ${documentId}, ${targetName}`,
                            function: 'postFile'});

        return res.json({success: false, error: `Error pushing to Document 'attachments'`});
    }

    return res.json({success: true, result: document});
};

// '/get_file/:file_name'
const getFile = async (req, res) => {

    const { fileName } = req.params;

    if (!checkValid(fileName)) return res.json({success: false, error: 'file upload no fileName provided'});


    console.log(`fileName: ${fileName}`);

    const getParams = {
        Bucket: process.env.AWS_S3_ATTACHMENTS_BUCKET,
        Key: fileName
    };

    var data;
    try {
        data = await s3.getObject(getParams).promise();
    }
    catch (err) {
        console.log('S3 Error: ');
        console.log(err);
        await logger.error({source: 'backend-api',
                            message: `Error getting file from S3 - Bucket, Key: ${process.env.AWS_S3_ATTACHMENTS_BUCKET}, ${fileName}`,
                            function: 'postFile'});
        return res.json({success: false, error: `Error getting file from S3`});
    }

    var downloadName = fileName.split('/').slice(-1);

    // Set Content-Disposition header so file will be downloaded
    res.set(
        'Content-Disposition',
        `attachment; filename=${downloadName}`
    );
    

    // request(url_to_file).pipe(res);

    console.log('Returning: ');
    console.log(data.Body);

    return res.send(data.Body);
};

module.exports = {
    postFile,
    getFile,
}