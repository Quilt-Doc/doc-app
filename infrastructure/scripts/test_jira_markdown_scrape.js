function flatten(items) {
    const flat = [];
    items.map(item => {
      flat.push(item)
      if (Array.isArray(item.content) && item.content.length > 0) {
        flat.push(...flatten(item.content));
        delete item.content
      }
      delete item.content
    });
    return flat;
}


var sampleDescriptionObject =  {"description": {
    "version": 1,
    "type": "doc",
    "content": [
        {
            "type": "paragraph",
            "content": [
                {
                    "type": "inlineCard",
                    "attrs": {
                        "url": "https://github.com/Quilt-Doc/doc-app"
                    }
                },
                {
                    "type": "text",
                    "text": " "
                }
            ]
        },
        {
            "type": "paragraph",
            "content": []
        },
        {
            "type": "paragraph",
            "content": [
                {
                    "type": "inlineCard",
                    "attrs": {
                        "url": "https://github.com/Quilt-Doc/doc-app"
                    }
                },
                {
                    "type": "text",
                    "text": " "
                }
            ]
        },
        {
            "type": "paragraph",
            "content": [
                {
                    "type": "text",
                    "text": "https://google.rit.edu/",
                    "marks": [
                        {
                            "type": "link",
                            "attrs": {
                                "href": "https://google.rit.edu/"
                            }
                        }
                    ]
                }
            ]
        },
        {
            "type": "paragraph",
            "content": [
                {
                    "type": "text",
                    "text": "Links!!!",
                    "marks": [
                        {
                            "type": "strong"
                        }
                    ]
                }
            ]
        }
    ]
}
}

var temp = flatten(sampleDescriptionObject.description.content);
console.log('\n\n\n');
console.log(temp);