
/*
const initialValue = [
	{
		type: 'heading-one',
		children: [
			{
				text:
					'TORCH.UTILS.DATA',
			},
		],
	},
	{
		type: 'paragraph',
		children: [
			{text: ''}
		],
	},
	{
		type: 'heading-three',
		children: [
			{
				text:
					'Iterable-styled datasets',
			},
		],
	},
	{
		type: 'paragraph',
		children: [
			{
				text:
					'An iterable-style dataset is an instance of a subclass of IterableDataset that implements the __iter__() protocol, and represents an iterable over data samples. This type of datasets is particularly suitable for cases where random reads are expensive or even improbable, and where the batch size depends on the fetched data.',
			},
		],
	},
	{
		type: 'paragraph',
		children: [
			{
				text:
				''
			}
		],
	},
	{
		type: 'code-block',
		children: [
			{
				type: 'code-line',
				children: [{ text: 'import numpy as np' }]
			},
			{
				type: 'code-line',
				children: [{ text: '       ' }]
			},
			{
				type: 'code-line',
				children: [{ text: '  def pingu(x: int):' }]
			}],
	},
	{
		type: 'heading-three',
		children: [
			{
				text:
					'Map-styled datasets',
			},
		],
	},
	{
		type: 'paragraph',
		children: [
			{
				text:
					'An iterable-style dataset is an instance of a subclass of IterableDataset that implements the __iter__() protocol, and represents an iterable over data samples. This type of datasets is particularly suitable for cases where random reads are expensive or even improbable, and where the batch size depends on the fetched data.',
			},
		],
	}
]
*/



const toggleFormat = (editor, format) => {
	const isActive = isFormatActive(editor, format)
	Transforms.setNodes(
		editor,
		{ [format]: isActive ? null : true },
		{ match: Text.isText, split: true }
	)
}

const isFormatActive = (editor, format) => {
	const [match] = Editor.nodes(editor, {
		match: n => n[format] === true,
		mode: 'all',
	})
	return !!match
}