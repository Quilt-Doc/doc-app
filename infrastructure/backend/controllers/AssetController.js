const logger = require('../logging/index').logger;
const path = require('path');

const { checkValid } = require('../utils/utils');



getInvalidDocumentIcon = async (req, res) => {
    return res.sendFile(path.join(__dirname, '../assets', 'invalid_document.svg'));    
}

getInvalidSnippetIcon = async (req, res) => {
    return res.sendFile(path.join(__dirname, '../assets', 'invalid_snippet.svg'));
}

getInvalidCheckIcon = async (req, res) => {
    return res.sendFile(path.join(__dirname, '../assets', 'invalid_check.svg'));
}

getDocumentIcon = async (req, res) => {
    return res.sendFile(path.join(__dirname, '../assets', 'document.svg'));
}

getSnippetIcon = async (req, res) => {
    return res.sendFile(path.join(__dirname, '../assets', 'snippet.svg'));
}



module.exports = {
    getInvalidDocumentIcon,
    getInvalidSnippetIcon,
    getInvalidCheckIcon,
    getDocumentIcon,
    getSnippetIcon, 
}