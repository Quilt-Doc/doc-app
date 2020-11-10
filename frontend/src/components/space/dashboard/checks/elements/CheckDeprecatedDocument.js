import React from 'react';

//styles
import styled from 'styled-components';
import chroma from 'chroma-js';
import { LIGHT_SHADOW_1 } from '../../../../../styles/shadows';

//history
import history from '../../../../../history';
import { withRouter } from 'react-router-dom';

//animation
import { RiFileTextFill, RiFileTextLine } from 'react-icons/ri';


const CheckDeprecatedDocument = ({ doc }) => {
    const { _id, title, image } = doc;

    const renderPlaceholderCard = () => {
        return (
            <Placeholder>
                <RiFileTextLine/>
            </Placeholder>
        )
    }

    const renderImage = (image) => {
        const imageJSX = image ? 
            <ImageContainer2>
                <ImageContainer src = {image}/>
            </ImageContainer2>
            : renderPlaceholderCard();
        
        return imageJSX
    }

    return(
        <Card  onClick = { () => history.push(`?document=${_id}`) } key = {doc._id} >
            {renderImage(image)}
            <Bottom>
                <Title>
                    <StyledIcon>
                        <RiFileTextLine/>
                    </StyledIcon>
                    <TitleText>{title}</TitleText>
                </Title> 
            </Bottom>
        </Card>
    )
}

export default withRouter(CheckDeprecatedDocument);


const StyledIcon = styled.div`
    justify-content: center;
    align-items: center;
    display:flex;
    font-size: 1.65rem; 
    margin-right: 0.7rem;
`

const Bottom = styled.div`
    height: 4rem;
    width: 100%;
    border-bottom-left-radius: 0.5rem;
    border-bottom-right-radius: 0.5rem;
    display: flex;
    align-items: center;
`

const ImageContainer2 = styled.div`
    overflow-y: hidden;
    position: relative;
    padding-bottom: 70%;
    width: 100%;
`

const Placeholder = styled.div`
    width: 100%; 
    display: flex;
    align-items: center;
    justify-content: center;   
    font-size: 7rem;  
    height: 14rem;        
`

const ImageContainer = styled.img`
    object-fit: cover;
    position: absolute;
    top: 0; 
    left: 0;
    object-position: center top;
    width: 100%; 
    height: 100%;
    padding-left: 2rem;
    padding-right: 2rem;
    /*
    overflow-y: hidden;
    */
    /*
    display: flex;
    justify-content: center;
    */
    
`

const Status = styled.div`
    display: inline-flex;
    background-color: ${chroma('#19e5be').alpha(0.15)};
    color:#19e5be;
    border: 1px solid #19e5be;
    font-weight: 500;
    border-radius: 0.3rem;
    font-size: 1.4rem;
    padding: 0rem 1rem;
    align-items: center;
    height: 2rem;
    margin-top: -0rem;
    margin-left: auto;
    margin-right: 2rem;
    justify-content: center;
`

const Title = styled.div`
    display: flex;
    font-weight: 500;
    font-size: 1.3rem;
    align-items: center;
    padding-left: 2rem;
    padding-right: 2rem;
`

const TitleText = styled.div`
    margin-top: 0.2rem;
`

const Card = styled.div`
    border: 1px solid #df8bb9; 
    min-width: 14.5rem;
    width: 14.5rem;
    position: relative;
    color: #172A4E;
    border-radius: 0.5rem;
    box-shadow: ${LIGHT_SHADOW_1};
    background-color: white;
    /*padding: 1.5rem 2rem;
    padding-top: 2rem;*/
    display: flex;
    align-items: center;
    padding-top: 2rem;
    flex-direction: column;
    align-self: ${props => props.top ? "flex-start" : ""};
    cursor: pointer;
    &:hover {
        box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 8px 16px -6px;
    }
    text-decoration: none;
    transition: box-shadow 0.1s;
    margin-right: 2rem;
`