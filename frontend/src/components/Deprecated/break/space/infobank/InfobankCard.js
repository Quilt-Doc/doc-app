import React from 'react';
import styled from 'styled-components';

import chroma from 'chroma-js';

import {RiSlackLine, RiCheckFill, RiFileList2Fill} from 'react-icons/ri';
import {FaConfluence} from 'react-icons/fa';
import {FaTrello, FaJira} from 'react-icons/fa';
import {SiAsana, SiNotion} from 'react-icons/si';
import {IoIosSearch} from 'react-icons/io'
import { CgSearch } from 'react-icons/cg';
import {RiFilter2Line} from 'react-icons/ri';
import {AiOutlineClockCircle} from 'react-icons/ai';

import { CSSTransition } from 'react-transition-group';

import { Link, withRouter } from 'react-router-dom';



class InfobankCard extends React.Component {

    getDateItem = (doc) => {
        let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        let item =  new Date(doc.created)
        let dateString = `${months[item.getMonth()]} ${item.getDate()}, ${item.getFullYear()}`;
        return dateString
    }

    renderLink = (doc) => {
        let rat = "john";
        let { workspaceId } = this.props.match.params;
        return `/workspaces/${workspaceId}/document/${doc._id}`;
    }

    render(){ 
        let {result, key} = this.props;
        return(
            <CSSTransition
                in={true}
                appear = {true}
                timeout = {150}
                classNames = "itemcard"
            >
                <div>
                    <Card to = {this.renderLink(result)} key = {key} top = {result.image ? false : true}>
                        <Title>
                            {result.title ? result.title : "Untitled"}
                            <Status>
                                <RiCheckFill 
                                    style = 
                                    {{
                                        fontSize: "1.7rem"
                                    }}
                                />
                            </Status>
                        </Title>
                        <ImageContainer>
                            {result.image ? 
                                <StyledImg src = {result.image} />
                                :   <StyledIcon>
                                        <RiFileList2Fill style = {{
                                            color: '#2684FF',
                                        }}/>
                                    </StyledIcon>
                            }
                        </ImageContainer> 
                        <Detail>
                            <CreationDate>
                                <AiOutlineClockCircle
                                    style = {{marginRight: "0.5rem"}}
                                />
                                {this.getDateItem(result)}
                            </CreationDate>
                            <Creator>
                                F
                            </Creator>
                        </Detail>
                    </Card>
                </div>
            </CSSTransition>
        )
    }
}

export default withRouter(InfobankCard);


const ImageContainer = styled.div`
    height: 22rem;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: -2rem;
    margin-bottom: 1rem;
    
`

const StyledIcon = styled.div`
    width: 20rem;
    height:21.2rem;
    background-color: white;
    justify-content: center;
    align-items: center;
    display:flex;
    border: 1px solid #E0E4E7;
    border-radius: 0.2rem;
    font-size: 3.5rem;
`

const StyledImg = styled.img`
    width: 20rem;
    height: auto;
    border: 1px solid #373a49;;
    border-radius: 0.3rem;
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
    justify-content: center;
`

const Title = styled.div`
    display: flex;
    font-weight: 500;
    font-size: 1.4rem;
    align-items: center;
    padding: 2rem;
    padding-bottom: 3rem;
    background-color: #373a49;
    color: white;
    border-top-left-radius: 0.3rem;
    border-top-right-radius: 0.3rem;
`

//add a border on this guy
const Content = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 22rem;
    margin-bottom: 1rem;
    margin-top: 1rem;
    font-size: 3rem;
`

const Detail = styled.div`
    display: flex;
    font-size: 1.1rem;
    align-items: center;
    margin-top: auto;
    padding: 0 2rem;
`

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
`

const Card = styled(Link)`
    width: 100%;
    position: relative;
    color: #172A4E;
    border-radius: 0.3rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    background-color: white;
    /*padding: 1.5rem 2rem;
    padding-top: 2rem;*/
    padding-bottom: 1.5rem;
    display: flex;
    flex-direction: column;
    align-self: ${props => props.top ? "flex-start" : ""};
    cursor: pointer;
    &:hover {
        box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 8px 16px -6px;
    }
    text-decoration: none;
    transition: box-shadow 0.1s;
`


/*
  {
            <Container>
                <ConnectContainer>
                    <Toolbar>
                        <IoIosSearch style = {{'fontSize': '2.3rem'}}/>
                        <FilterButton>
                            <RiFilter2Line/>
                        </FilterButton>
                    </Toolbar>
                    <ListView>
                        {this.renderListItems()}
                    </ListView>
                </ConnectContainer>
            </Container>
  }     
const FilterButton = styled.div`
    margin-left: auto;
    height: 2.5rem;
    width: 2.5rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    background-color: #f7f9fb;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.3rem;
    font-size: 1.8rem;
    cursor: pointer;
`

const Toolbar = styled.div`
    height: 4.5rem;

    display: flex;
    align-items: center;
    padding-left: 2rem;
    padding-right: 3rem;
    
`

const Header = styled.div`
    font-size: 2rem;
    font-weight: 500;
    height: 10rem;
    display: flex;
    align-items: center;
`

const ListView = styled.div`
    display: flex;
    flex-direction: column;
    max-height: 67rem;
`

const Title = styled.div`
    font-weight: 500;
    font-size: 1.3rem;
`

const Container = styled.div`
    background-color: #f7f9fb;
    height: 100%;
    padding-top: 1rem;
    padding-left: 8rem;
    padding-right: 8rem;
    padding-bottom: 5rem;
`

const ConnectContainer = styled.div`
    background-color: white;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    border-radius: 0.3rem;
`

const ListItem = styled.div`
    
    display: flex;
    align-items: center;
    padding-left: 3rem;
    padding-right: 3rem;
    height: 3.8rem;
    background-color: white;
    background-color: ${props => props.active ? chroma("#6762df").alpha(0.04) : ''};
    font-size: 1.5rem;
`*/