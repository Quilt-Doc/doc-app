import Prism from 'prismjs'
import React from 'react';


//styles
import styled from "styled-components";

// eslint-disable-next-line
Prism.languages.python={comment:{pattern:/(^|[^\\])#.*/,lookbehind:!0},"string-interpolation":{pattern:/(?:f|rf|fr)(?:("""|''')[\s\S]*?\1|("|')(?:\\.|(?!\2)[^\\\r\n])*\2)/i,greedy:!0,inside:{interpolation:{pattern:/((?:^|[^{])(?:{{)*){(?!{)(?:[^{}]|{(?!{)(?:[^{}]|{(?!{)(?:[^{}])+})+})+}/,lookbehind:!0,inside:{"format-spec":{pattern:/(:)[^:(){}]+(?=}$)/,lookbehind:!0},"conversion-option":{pattern:/![sra](?=[:}]$)/,alias:"punctuation"},rest:null}},string:/[\s\S]+/}},"triple-quoted-string":{pattern:/(?:[rub]|rb|br)?("""|''')[\s\S]*?\1/i,greedy:!0,alias:"string"},string:{pattern:/(?:[rub]|rb|br)?("|')(?:\\.|(?!\1)[^\\\r\n])*\1/i,greedy:!0},function:{pattern:/((?:^|\s)def[ \t]+)[a-zA-Z_]\w*(?=\s*\()/g,lookbehind:!0},"class-name":{pattern:/(\bclass\s+)\w+/i,lookbehind:!0},decorator:{pattern:/(^\s*)@\w+(?:\.\w+)*/im,lookbehind:!0,alias:["annotation","punctuation"],inside:{punctuation:/\./}},keyword:/\b(?:and|as|assert|async|await|break|class|continue|def|del|elif|else|except|exec|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|print|raise|return|try|while|with|yield)\b/,builtin:/\b(?:__import__|abs|all|any|apply|ascii|basestring|bin|bool|buffer|bytearray|bytes|callable|chr|classmethod|cmp|coerce|compile|complex|delattr|dict|dir|divmod|enumerate|eval|execfile|file|filter|float|format|frozenset|getattr|globals|hasattr|hash|help|hex|id|input|int|intern|isinstance|issubclass|iter|len|list|locals|long|map|max|memoryview|min|next|object|oct|open|ord|pow|property|range|raw_input|reduce|reload|repr|reversed|round|set|setattr|slice|sorted|staticmethod|str|sum|super|tuple|type|unichr|unicode|vars|xrange|zip)\b/,boolean:/\b(?:True|False|None)\b/,number:/(?:\b(?=\d)|\B(?=\.))(?:0[bo])?(?:(?:\d|0x[\da-f])[\da-f]*\.?\d*|\.\d+)(?:e[+-]?\d+)?j?\b/i,operator:/[-+%=]=?|!=|\*\*?=?|\/\/?=?|<[<=>]?|>[=>]?|[&|^~]/,punctuation:/[{}[\];(),.:]/},Prism.languages.python["string-interpolation"].inside.interpolation.inside.rest=Prism.languages.python,Prism.languages.py=Prism.languages.python;

class Test extends React.Component {
   
    componentDidMount() {
        const grammar = Prism.languages["js"]
        const grammar2 = Prism.languages["python"]
        console.log(grammar)
        console.log(grammar2)
        let string = `
        import pprint
        import glob, os, argparse

        import torch
        from torch import nn

        try:
            import tqdm
        except:
            print("Install tqdm to use --log-format=tqdm")

        from fairseq.models.wav2vec import Wav2VecModel

        import tqdm
        import soundfile as sf
        from torch.utils.data import DataLoader
        import os.path as osp


        class FilesDataset:
            def __init__(self, files, labels):
                self.files = files
                if labels and osp.exists(labels):
                    with open(labels, 'r') as lbl_f:
                        self.labels = [line.rstrip() for line in lbl_f]
                else:
                    self.labels = labels

            def __len__(self):
                return len(self.files)

            def __getitem__(self, index):
                fname = self.files[index]

                wav, sr = sf.read(fname)
                assert sr == 16000

                wav = torch.from_numpy(wav).float()
                lbls = None
                if self.labels:
                    if isinstance(self.labels, str):
                        lbl_file = osp.splitext(fname)[0] + "." + self.labels
                        with open(lbl_file, 'r') as lblf:
                            lbls = lblf.readline()
                            assert lbls is not None
                    else:
                        lbls = self.labels[index]
                return wav, lbls

            def collate(self, batch):
                return batch`
        console.log(string.split(" ").length)
        const tokens = Prism.tokenize(string, grammar2)
        let total = 0
        for (let i = 0; i < tokens.length; i++) {
            total += tokens[i].length
        }
        console.log(total)
        console.log(string.length)
    }
    render() {
        return(
            <div>RAT</div>
        )
    }
    
}

export default Test;