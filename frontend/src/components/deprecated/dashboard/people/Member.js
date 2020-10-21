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
            <Creator>F</Creator>
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
    height: 7rem;
    font-size: 1.3rem;
    background-color: white;
    padding: 2rem;
    /*border-bottom: 1px solid #E0e4e7;*/
    border-radius: 0.6rem;
    margin-bottom: 2rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    width: 30rem;
`

const Name = styled.div`
    font-size: 1.3rem;
    font-weight: 500;
    width: 10rem;
    margin-right: 1rem;
`

const Creator = styled.div`
    height: 2.5rem;
    width: 2.5rem;
    background-color: ${chroma('#1e90ff').alpha(0.2)};
    color:#1e90ff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.4rem;
    margin-top: -0.1rem;
    border-radius: 0.3rem;
    font-weight: 500;
    margin-right: 1rem;
`
