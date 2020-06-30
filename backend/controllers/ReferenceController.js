const Reference = require('../models/Reference');
var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

createReferences = (req, res) => {
    const { ref_list } = req.body;
    if (!typeof ref_list == 'undefined' && ref_list !== null) return res.json({success: false, error: 'no reference ref_list provided'});
    console.log('ref_list');
    console.log(ref_list);
    var ref_obj_list = ref_list.map(ref => {
        var {name, kind, file, lineNum, link} = ref;
        if (!typeof name == 'undefined' && name !== null) return res.json({success: false, error: 'no reference name provided'});
        if (!typeof link == 'undefined' && link !== null) return res.json({success: false, error: 'no reference link provided'});

        let reference = new Reference({
            name: name,
            link: link

        });

        if (lineNum) reference.lineNum = lineNum;
        if (kind) reference.kind = kind;
        if (file) reference.file = file;

        return reference;
    })

    console.log('REF OBJ LIST');
    console.log(ref_obj_list);
    Reference.create( ref_obj_list, (err, reference) => {
        if (err) return res.json({ success: false, error: err });
        return res.json(reference);
    });
}

getReferences = (req, res) => {

    const { text, repoLink } = req.body;
    var text_query = text;


    if (!typeof repoLink == 'undefined' && repoLink !== null) return res.json({success: false, error: 'no reference repoLink provided'});
    if (!(text)) {
        text_query = '';
    }

    console.log('repoLink: ', repoLink);
    console.log('text: ', text);

    var re = new RegExp(text, 'i');

    Reference.find(
        {
            $and : [
                { $or: [{ name: { $regex: re } }, { kind: { $regex: re } }, { file: { $regex: re } }] },
                { link: repoLink }
            ]
        }
        ).sort('kind').exec(function(err, references) {
        console.log('results: ')
        console.log(references);
        res.json(references);
    });
}



module.exports =
{
    createReferences,
    getReferences

}