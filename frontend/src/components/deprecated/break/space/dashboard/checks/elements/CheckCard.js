import React from 'react';

//styles
import styled from 'styled-components';
import chroma from 'chroma-js';

//components
import { IoMdCheckmarkCircle, IoMdCheckmarkCircleOutline, IoMdCloseCircle, IoMdCloseCircleOutline } from 'react-icons/io';
import { AiOutlineClockCircle, AiOutlineCloseCircle } from 'react-icons/ai';
import { FiGitCommit } from 'react-icons/fi';


const CheckCard = ({check, setCheck, active, pusher, color}) => {
    const {sha, brokenDocuments, brokenSnippets, commitMessage, created} = check;
    let selectedColor = selectColor(color);
    return (
        <Check active = {active}  onClick = {() => setCheck()}>
           
            <CheckContent active = {active}>
                <AboveDetail>
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
                    <Status active = {(brokenDocuments.length === 0 && brokenSnippets.length === 0)}>
                        {renderStatus(brokenDocuments, brokenSnippets)}
                    </Status>
                </AboveDetail>
                <Title>{commitMessage}</Title>
                <Detail>
                    <Bottom>
                        <Creator color = {selectedColor}>{pusher.charAt(0)}</Creator>
                        <CreationDate> 
                            <AiOutlineClockCircle
                                style = {{marginTop: "0.09rem", marginRight: "0.5rem"}}
                            />
                            {getDateItem(created)}
                        </CreationDate>
                    </Bottom>
                </Detail>
            </CheckContent>
        </Check>
    )   
}

const renderStatus = (brokenDocuments, brokenSnippets) => {
    return (brokenDocuments.length === 0 && brokenSnippets.length === 0) ?
        <IoMdCheckmarkCircleOutline/> :
        <AiOutlineCloseCircle/>
}

const selectColor = (index) => {
    let colors = ['#5352ed', '#ff4757', '#20bf6b','#1e90ff', '#ff6348', 
        '#e84393', '#1e3799', '#b71540', '#079992'];

    return index < colors.length ? colors[index] : 
        colors[index - Math.floor(index/colors.length) * colors.length];
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
    border-radius: 0.5rem;
    background-color: ${props => props.active ? chroma("#6762df").alpha(0.1) : 'white'};
    border: 1px solid ${props => props.active ? chroma("#6762df").alpha(0.4) : 'transparent'};
    margin-bottom: 1.5rem;
    display: flex;
    &:hover {
        background-color: ${chroma("#6762df").alpha(0.1)};
    }
    cursor: pointer;
    transition: background-color 0.1s ease-in;
    box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 5px 10px -5px;
`

const CheckContent = styled.div`
    width: 100%;
    /*
    border-top: 1px solid  ${props => props.active ? "#373a49": "#E0E4E7"};
    border-right: 1px solid ${props => props.active ? "#373a49" : "#E0E4E7"};
    border-bottom: 1px solid ${props => props.active ? "#373a49" : "#E0E4E7"};
    */
    border-top-right-radius: 0.8rem;
    border-bottom-right-radius: 0.8rem;
    padding: 1rem 1.8rem;
    padding-top: 0.5rem;
    display: flex;
    flex-direction: column;
`

const Title = styled.div`
    font-weight: 500;
    font-size: 1.3rem;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    width: 20rem;
`

const AboveDetail = styled.div`
    display: flex;
    align-items: center;
`

const Status = styled.div`
    color: ${props => props.active ? '#19e5be' : '#ff4757'};
    font-size: 2rem;
    margin-left: auto;
    margin-top: 0.45rem;
`

const Commit = styled.div`
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    opacity: 0.7;
    font-weight: 500;
`

//3 Faraz TODO: add a border on this guy
const Creator = styled.div`
    height: 2.5rem;
    width: 2.5rem;
   /* background-color: ${chroma('#1e90ff').alpha(0.2)};
    color:#1e90ff;*/
    background-color: ${props => chroma(props.color).alpha(0.2)};
    color: ${props => props.color};
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
    align-items: flex-end;
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
    height: 1.5rem;
    font-weight:500;
    border-radius: 0.3rem;
    color: #8996A8;
    margin-left: auto;
`

