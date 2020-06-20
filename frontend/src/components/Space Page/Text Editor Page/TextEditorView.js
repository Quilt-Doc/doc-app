import React from 'react'

//components
import HoveringMenuExample2 from './HoveringMenuExample2';

//styles 
import styled from "styled-components";

//axios
import axios from 'axios';

/*
export const createComment = (formValues) => async (dispatch) => {
    const response = await api.post('/comments/create', formValues );
    dispatch({ type: CREATE_COMMENT, payload: response.data });
}
*/

class TextEditorView extends React.Component {

    constructor(props) {
        super(props)
    }

    componentDidMount(){
        const initialValue = [
            {
                type: 'paragraph',
                children: [
                    {
                        text: 'Click here to start writing'
                    }
                ]
            }
        ]
        /*
        axios.get('https://api.github.com/repos/cewing/fizzbuzz/branches').then((response)=>{
                console.log(response.data)
            }
        );
        */
       axios.get('https://api.github.com/repos/pytorch/pytorch/commits').then((response)=>{
           let treeSHA = response.data[0].commit.tree.sha
           axios.get(`https://api.github.com/repos/pytorch/pytorch/git/trees/${treeSHA}?recursive=true`).then((response) =>
            console.log("GITHUB RESPONSE", response.data)
           )
       })
        console.log(typeof JSON.stringify(initialValue))
    }

    render(){
        return(
            <EditorContainer>
                <TextContainer>
                    <Title placeholder = {'Document Title'}/>
                    <HoveringMenuExample2/>
                </TextContainer>
                <InfoBar>
                    <InfoBlock>
                        <InfoHeader>Authors</InfoHeader>
                        <ReferenceContainer>
                            <Author>FS</Author>
                            <Author>KG</Author>
                        </ReferenceContainer>
                    </InfoBlock>
                    <InfoBlock>
                        <InfoHeader>Relevant Files and Folders</InfoHeader>
                        <ReferenceContainer>
                            <Reference>file_copy_test.java</Reference>
                            <Reference>move_track</Reference>
                            <Reference>post_commit.py</Reference>
                            <Reference>snippet_val.py</Reference>
                        </ReferenceContainer>
                    </InfoBlock>
                    
                </InfoBar>
                
            </EditorContainer>
        )
    }
}

export default TextEditorView

const EditorContainer = styled.div`
    display: flex;
    overflow-y: scroll;
    margin-top: 1.5vh;
`
const InfoBar = styled.div`
    width: 38rem;
    padding-left: 1rem;
    
`

const InfoHeader = styled.div`
    font-weight: 400;
    font-size: 1.4rem;
    color: #172A4E;
`

const InfoBlock = styled.div`
    margin-bottom: 1rem;
`

const ReferenceContainer = styled.div`
    margin-top: 1rem;

`

const Reference = styled.div`
    font-size: 1.25rem;
    color: #172A4E;
    border: 1px solid #1BE5BE;
    padding: 0.4rem 0.8rem;
    background-color: white;
    display: inline-block;
    border-radius: 4px;
    margin-right: 1rem;
    margin-bottom: 1rem;
`

const Author = styled.div`
    font-size: 1.25rem;
    color: #172A4E;
    border: 1px solid #172A4E;
    padding: 0.5rem 0.8rem;
    background-color: white;
    display: inline-block;
    border-radius: 4px;
    margin-right: 1rem;
    margin-bottom: 1rem;
`

const TextContainer = styled.div`
    display: flex;
    flex-direction: column;
    overflow-y: scroll;
`

const Title = styled.input`
    font-size: 4rem;
    font-weight: 300;
    letter-spacing: 1.78px;
    line-height: 1;
    color: #262626;
    margin-left:6rem;
    margin-right: 6rem;
    outline: none;
    border: none;
    &::placeholder {
        color: #262626;
        opacity: 0.3;
    }
`

/*#1BE5BE*/