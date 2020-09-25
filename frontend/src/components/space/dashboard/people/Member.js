import React from 'react';

// styles
import styled from 'styled-components';
import chroma from 'chroma-js';

// icons
import { RiFileList2Fill, RiFlagFill } from 'react-icons/ri';

// individual item in People
const Member = () => {
    return (
        <MemberContainer>
            <PersonIcon color = {'#1e90ff'}>F</PersonIcon>
            <Name >Faraz Sanal</Name>
            <Metrics>
                <Metric>
                    <RiFileList2Fill
                        style = {{
                                marginTop: "0rem", 
                                marginRight: "0.7rem",
                                fontSize: "1.8rem",
                                color: '#2684FF'
                            }}
                    />
                    <Number>0</Number>
                </Metric>
                <Metric>
                    <RiFlagFill style = {{
                        marginRight: "0.7rem",
                        fontSize: "1.8rem",
                        color: '#ff4757'
                    }}/>
                    <Number>8</Number>
                </Metric>
            </Metrics>
        </MemberContainer>
    )
}

export default Member;

const PersonIcon = styled.div`
    min-height: 3rem;
    min-width: 3rem;
    background-color: ${props => chroma(props.color).alpha(0.2)};
    color:${props => props.color};
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.3rem;
    font-size: 1.5rem;
    margin-right: 1.5rem;
`

const Metric =styled.div`
    font-size: 1.35rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    &:last-of-type {
        margin-left: 0.5rem;
    }
`

const Metrics = styled.div`
    display: flex;
    align-items: center;
    margin-left: auto;
`

const Number = styled.div`
    width: 2rem;
`

const MemberContainer = styled.div`
    display: flex;
    align-items: center;
    height: 5rem;
    font-size: 1.3rem;
    /*border-bottom: 1px solid #E0e4e7;*/
`

const Name = styled.div`
    font-size: 1.3rem;
    font-weight: 500;
    width: 13rem;
    margin-right: 1rem;
`