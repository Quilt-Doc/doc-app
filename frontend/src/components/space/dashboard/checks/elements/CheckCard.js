import React from 'react';

//styles
import styled from 'styled-components';
import chroma from 'chroma-js';

//components
import { IoMdCheckmarkCircleOutline } from 'react-icons/io';
import { AiOutlineClockCircle } from 'react-icons/ai';
import { FiGitCommit } from 'react-icons/fi';


const CheckCard = ({check, setCheck, active}) => {
    const {sha, brokenDocuments, brokenSnippets, commitMessage, pusher, created} = check;
    return (
        <Check active = {active}  onClick = {() => setCheck()}>
            <Status active = {(brokenDocuments.length === 0 && brokenSnippets.length === 0)}>
                <IoMdCheckmarkCircleOutline/>
            </Status>
            <CheckContent active = {active}>
                <Commit>
                        <FiGitCommit
                            style = {{
                                fontSize: "1.2rem",
                                marginTop: "0.1rem",
                                marginRight: "0.2rem",
                            }}
                        />
                        {sha.slice(0, 7)}
                </Commit>
                <Title>{commitMessage}</Title>
                <Detail>
                    <Bottom>
                        <Creator>{pusher.charAt(0)}</Creator>
                        <CreationDate> 
                            <AiOutlineClockCircle
                                style = {{marginTop: "0.08rem", marginRight: "0.5rem"}}
                            />
                            {getDateItem(created)}
                        </CreationDate>
                    </Bottom>
                </Detail>
            </CheckContent>
        </Check>
    )   
}

const getDateItem = (created) => {
    let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    let item =  new Date(created)
    let dateString = `${months[item.getMonth()]} ${item.getDate()}, ${item.getFullYear()}`;
    return dateString
}

export default CheckCard;

const Check = styled.div`
    height: 11rem;
    width: 100%;
    border-radius: 0.7rem;
    background-color: ${props => props.active ? chroma("#5B75E6").alpha(0.1) : 'white'};
    margin-bottom: 1.5rem;
    display: flex;
    &:hover {
        background-color: ${chroma("#5B75E6").alpha(0.1)};
    }
    cursor: pointer;
    transition: background-color 0.1s ease-in;
`

const CheckContent = styled.div`
    width: 100%;
    border-top: 1px solid  ${props => props.active ? "": "#E0E4E7"};
    border-right: 1px solid ${props => props.active ? "" : "#E0E4E7"};
    border-bottom: 1px solid ${props => props.active ? "" : "#E0E4E7"};
    border-top-right-radius: 0.8rem;
    border-bottom-right-radius: 0.8rem;
    padding: 1rem 1.8rem;
    display: flex;
    flex-direction: column;
`

const Title = styled.div`
    font-weight: 500;
    font-size: 1.3rem;
    
`

const Status = styled.div`
    color: ${props => props.active ? '#19e5be' : '#6f7390'};
    font-size: 2.7rem;
    padding: 1rem;
    background-color:#373a49;
    border-top-left-radius: 0.8rem;
    border-bottom-left-radius: 0.8rem;

`

const Commit = styled.div`
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    opacity: 0.7;
    font-weight: 500;
    margin-bottom: 0.7rem;
`

//3 Faraz TODO: add a border on this guy
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
`

const Bottom = styled.div`
    display: flex;
    width: 100%;
`   

const Detail = styled.div`
    display: flex;
    font-size: 1.1rem;
    align-items: center;
    margin-top: auto;
`

const CreationDate = styled.div`
    display: inline-flex;
    align-items: center;
    height: 2.3rem;
    
    font-weight:500;
    border-radius: 0.3rem;
    color: #8996A8;
    margin-left: auto;
`

