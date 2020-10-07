import React from 'react';
import styled from 'styled-components';

// Fight Deprecation

// Empower developer teams

// Built to break silos
//so developers know 

// Enhance your workflow

//Keep your knowledge productive
//Quilt allows you to  
//Empower developer teams 

class SecondBlock extends React.Component {
    render(){
        return(
            <BlockContainer>
                    
                    <GifBox/>
            </BlockContainer>
        )
    }
}

export default SecondBlock


const BlockContainer = styled.div`
    height: 90rem;
    padding: 3.5rem 12rem;
    background-color: #f7f9fb;
    color: white;
    display: flex;
    flex-direction: column;
    justify-content: center;
    margin-top: -30rem;
`

const GifBox = styled.div`
    width: 100%;
    background-color: white;
    border-radius: 0.2rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2); 
    height: 70rem;
    z-index: 1;
`


const Content = styled.div`
    display: flex;
`   

const ContentText = styled.div`
    width: 40%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    color: ${props => props.color};
    margin-left: auto;
`

const ContentCollage = styled.div`
    width: 60%;
 
`

const ContentHeader = styled.div`
    font-size: 3rem;
    font-weight: 500;
    margin-top: -3rem;
    margin-bottom: 3.5rem;
    width: 40rem;
`

const ContentSubHeader = styled.div`
    font-size: 1.8rem;
    font-weight: 300;
    line-height: 2.8rem;
    color: ${props => props.active ?  "#737a96" : ""};
`