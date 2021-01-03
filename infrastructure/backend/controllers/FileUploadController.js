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

const { checkValid } = require('../utils/utils');



// POST method route for uploading file
const postFile = async (req, res) => {
    //Multer middleware adds file(in case of single file ) or files(multiple files) object to the request object.
    // req.file is the attachment

    const { workspaceId, documentId, isImage, isVideo } = req.body;

    if (!checkValid(workspaceId)) return res.json({success: false, error: 'file upload no workspaceId provided'});
    if (!checkValid(documentId)) return res.json({success: false, error: 'file upload no documentId provided'});

    if (!req.file) return res.json({success: false, error: 'No file upload found'});

    await logger.info({source: 'backend-api',
                        message: `Beginning to upload file - req.file.path, req.file.filename: ${req.file.path}, ${req.file.filename}`,
                        function: 'postFile'});

    const source = req.file.path;

    const prefix = isImage ? "images" : isVideo ? "videos" : "attachments";

    const targetName = `${workspaceId}/${documentId}/${prefix}/${req.file.filename}`;

    // Read from disk where multer stored the file
    let fileData;
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
        await s3.putObject(putParams).promise();
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
    let document;
    try {
        const selectionQuery = `_id ${prefix}`;
        document = await Document.findByIdAndUpdate(documentId, { $push: { [prefix] : targetName } }, { new: true }).select(selectionQuery).lean().exec();
    }
    catch (err) {
        await logger.error({source: 'backend-api',
        message: `Error pushing to Document '${prefix}' - documentId, targetName: ${documentId}, ${targetName}`,
        function: 'postFile'});

        return res.json({success: false, error: `Error pushing to Document '${prefix}'`});
    }

    return res.json({success: true, result: document});
};

// '/get_file/:file_name'
const getFile = async (req, res) => {

    let { targetName, download } = req.params;
    download = download === "true" ? true : false;

    if (!checkValid(targetName)) return res.json({success: false, error: 'file upload no targetName provided'});


    const getParams = {
        Bucket: process.env.AWS_S3_ATTACHMENTS_BUCKET,
        Key: targetName
    };

    var data;
    try {
        data = await s3.getObject(getParams).promise();
    }
    catch (err) {
        console.log('S3 Error: ');
        console.log(err);
        await logger.error({source: 'backend-api',
                            message: `Error getting file from S3 - Bucket, Key: ${process.env.AWS_S3_ATTACHMENTS_BUCKET}, ${targetName}`,
                            function: 'postFile'});
        return res.json({success: false, error: `Error getting file from S3`});
    }

    if (download) {
        var downloadName = targetName.split('/').slice(-1);

        // Set Content-Disposition header so file will be downloaded
        res.set(
            'Content-Disposition',
            `attachment; filename=${downloadName}`
        );
    }

    // request(url_to_file).pipe(res);

    return res.send(data.Body);
    
};

module.exports = {
    postFile,
    getFile,
}