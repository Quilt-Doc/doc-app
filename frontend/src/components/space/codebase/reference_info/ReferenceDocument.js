import React from 'react';
import PropTypes from 'prop-types';

//styles
import styled from 'styled-components';
import chroma from 'chroma-js';

//history
import history from '../../../../history';

//icons
import { RiFileList2Fill, RiCheckFill } from 'react-icons/ri';
import { AiOutlineClockCircle } from 'react-icons/ai';

// individual document in document list in reference info
const ReferenceDocument = ({doc, index}) => {
    const { _id, title } = doc;

    return (
        <ListItem 
            onClick = { () => history.push(`?document=${_id}`) }
            active = { index %2 == 0 ? false : true} 
        >
            <RiFileList2Fill  
                style = 
                {{  
                    marginRight: "1rem",
                    fontSize: "2rem",
                    color: '#2684FF'
                }}
            />
            <Title>{title && title !== "" ? title : "Untitled"}</Title>
            <Status>
                <RiCheckFill 
                    style = 
                    {{ 
                        marginRight: "0.3rem",
                        fontSize: "1.5rem"
                    }}
                />
                Valid
            </Status> {/*REPEATED COMPONENT STATUS*/}
            <Creator> 
                F
            </Creator> {/*REPEATED COMPONENT AUTHOR*/}
            <CreationDate> 
                <AiOutlineClockCircle
                    style = {{marginRight: "0.5rem"}}
                />
                August 12, 2015
            </CreationDate> {/*REPEATED CREATION DATE*/}
        </ListItem>
    )
}

ReferenceDocument.propTypes = {
    doc : PropTypes.object
}

export default ReferenceDocument;

const Creator = styled.div`
    height: 2.5rem;
    width: 2.5rem;
    background-color: ${chroma('#1e90ff').alpha(0.2)};
    color:#1e90ff;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.3rem;
    font-size: 1.4rem;
    margin-left: auto;
    margin-top: -0.1rem;
    margin-right: 3rem;
`

const CreationDate = styled.div`
    display: inline-flex;
    align-items: center;
    background-color: #f5f7fa;
    height: 2.3rem;
    padding: 0rem 0.8rem;
    font-weight:500;
    border-radius: 0.3rem;
    color: #8996A8;
    font-size: 1.1rem;
`

const Title = styled.div`
    font-weight: 500;
    font-size: 1.35rem;
    width: 40%;
`

const Status = styled.div`
    display: inline-flex;
    background-color: ${chroma('#19e5be').alpha(0.15)};
    color: #19e5be;
    font-weight: 500;
    border-radius: 0.3rem;
    font-size: 1.3rem;
    padding: 0rem 1rem;
    align-items: center;
    margin-left: 2rem;
    height: 2rem;
    margin-top: -0rem;
`

const ListItem = styled.div`
    display: flex;
    align-items: center;
    padding-left: 3rem;
    padding-right: 3rem;
    min-height: 4rem;
    max-height: 4rem;
    background-color: ${props => props.active ? chroma("#5B75E6").alpha(0.04) : ''};
    font-size: 1.5rem;
`