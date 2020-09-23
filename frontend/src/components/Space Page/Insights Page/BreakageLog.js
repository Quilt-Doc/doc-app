import React from 'react';
import styled from 'styled-components';

import chroma from 'chroma-js';

import {RiSlackLine, RiFlag2Line, RiGitCommitLine, RiFileList2Fill, RiFileList2Line} from 'react-icons/ri';
import {FiFileText} from 'react-icons/fi';


import BreakageCard from './BreakageCard';

class BreakageLog extends React.Component {

    render(){
        return(
            <BreakageContainer>
                        <Header>  
                            Breakage
                            {
                                /*
                                 <Current>
                                 <b>3</b>&nbsp; documents broken
                                </Current>
                            
                                /*Document, 
                                broken references,  
                                commit date*/
                            }
                        </Header>
                        <ListView>
                           <BreakageCard/>
                           <BreakageCard/>
                           <BreakageCard warning = {true}/>
                           <BreakageCard/>
                           
                        </ListView>
                    </BreakageContainer>
        )
    }
}

export default BreakageLog;
/*
<ListItem active = {true}>
<Document>
    <RiFileList2Line style = {{fontSize: "1.5rem", marginRight: "1rem", marginTop: "-0.05rem"}}/>
    Tensor Manipulation
</Document>
<Commit>
    <RiGitCommitLine
        style = {{
            fontSize: "2.1rem",
            marginRight: "0.7rem"
        }}
    />
    b30e5c3
</Commit>
<Date>
    August, 12, 2021
</Date>
</ListItem>
<ListItem>
<Document>
    <RiFileList2Line style = {{fontSize: "1.5rem", marginRight: "1rem", marginTop: "-0.05rem"}}/>
    Function Behavior
</Document>
<Commit>
    <RiGitCommitLine
        style = {{
            fontSize: "2.1rem",
            marginRight: "0.7rem"
        }}
    />
    b30e5c3
</Commit>
<Date>
    August, 12, 2021
</Date>
</ListItem>
<ListItem active = {true}>
<Document>
    <RiFileList2Line style = {{fontSize: "1.5rem",marginRight: "1rem", marginTop: "-0.05rem"}}/>
    Probability Distributions
</Document>
<Commit>
    <RiGitCommitLine
        style = {{
            fontSize: "2.1rem",
            marginRight: "0.7rem"
        }}
    />
    b30e5c3
</Commit>
<Date>
    August, 12, 2021
</Date>
</ListItem>*/

const Header = styled.div`
    height: 4.5rem;
    display: flex;
    align-items: center;
    font-size: 1.7rem;
    font-weight: 600;
    margin-bottom: 1rem;
    padding-left: 4rem;
    padding-right: 4rem;
`

const ListView = styled.div`
    display: flex;
    padding-bottom: 1rem;
    /*background-color: ${chroma('#ff4757').alpha(0.07)};*/
    height: 100%;
    overflow-x: scroll;
    width: calc(100vw - 32rem - 25rem);
`

const BreakageContainer = styled.div`
    width: 100%;
    /*
    background-color: white;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    */
    display: flex;
    flex-direction: column;
`
