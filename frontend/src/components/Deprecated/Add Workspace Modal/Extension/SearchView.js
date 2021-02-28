import React, { useState } from 'react'
import styled from 'styled-components';

import { FaConfluence, FaJira, FaTrello, FaSlack} from "react-icons/fa";
import { FiFileText} from "react-icons/fi"
import {GiTicket} from 'react-icons/gi'
import {GoFileCode} from 'react-icons/go'

const SearchView = () => {

    let [search, setSearch] = useState(false)

    return(
        <>
            <TopContainer>
                Search
            </TopContainer>
            <SearchContainer>
                <SearchbarWrapper hoverColor = {search ? '#313b5e' : '#39466f'} onClick = {() => setSearch(true)}>
                    <ion-icon 
                        style={{'color': 'white', 'cursor': 'pointer', 'fontSize': '2rem'}} 
                        name="search-outline">
                    </ion-icon>
                    <Searchbar autoFocus />
                </SearchbarWrapper>
                <DocumentContainer>
                        <Flag>
                            <Circle/>
                            Knowledge
                        </Flag>
                        <ListContainer>
                        <Card>
                                <IconBorder>
                                    <FiFileText/>
                                </IconBorder>
                                Probability Distributions
                                <IconBorder2
                                     style = {{color: '#2884FF'}}
                                >
                                   <FaConfluence/>
                                </IconBorder2>
                            </Card>
                            <Card>
                                <IconBorder>
                                    <FiFileText/>
                                </IconBorder>
                                Tree Network
                                <IconBorder2>
                                    <ion-icon 
                                        style = {{color: '#E11D5A'}}
                                        name="logo-slack">
                                       
                                    </ion-icon>
                                </IconBorder2>
                            </Card>
                            <Card>
                                {/*FiFileText*/}
                                {/*BsFileText*/}
                                <IconBorder>
                                    <FiFileText/>
                                </IconBorder>
                                Pytorch Integrations
                                <IconBorder2>
                                    <FaSlack  style = {{color: '#E11D5A'}}/>

                                </IconBorder2>
                            </Card>
                            <Card>
                                {/*FiFileText*/}
                                {/*BsFileText*/}
                                <IconBorder>
                                    <FiFileText/>
                                </IconBorder>
                                Prototyping Data
                                <IconBorder2
                                     style = {{color: '#2884FF'}}
                                >
                                   <FaConfluence/>
                                </IconBorder2>
                            </Card>
                        </ListContainer>
                        <Flag>
                            <Circle color = "#19e5be" />
                            Project Management
                        </Flag>
                        <ListContainer>
                                <Card>
                                    <IconBorder>
                                        <GiTicket/>
                                    </IconBorder>
                                    Finish MarkupMenu
                                    <IconBorder2>
                                        <FaJira style = {{color: '#2884FF'}}/>
                                    </IconBorder2>
                                </Card>
                                <Card>
                                    <IconBorder>
                                        <GiTicket/>
                                    </IconBorder>
                                    Server Bug
                                    <IconBorder2>
                                        <FaJira style = {{color: '#2884FF'}}/>
                                    </IconBorder2>
                                </Card>
                                <Card>
                                    {/*FiFileText*/}
                                    {/*BsFileText*/}
                                    <IconBorder>
                                        <GiTicket/>
                                    </IconBorder>
                                    Doc Hierarchy Fixes
                                    <IconBorder2>
                                        <FaTrello style = {{color: '#0079BF'}}
                                        />
                                    </IconBorder2>
                                </Card>
                            </ListContainer>

                    </DocumentContainer>
            </SearchContainer>
        </>
    )
}

export default SearchView;

const Flag = styled.div`
    font-size: 1.1rem;
    text-transform:uppercase;
    margin-top: 1.5rem;
    margin-bottom: 1rem;
    &:first-of-type {
        margin-top: 1rem;
    }
    display: flex;
    align-items: center;
`

const SubContainer = styled.div`
    width: 70%;
    border-right: 1px solid #66CDC4;
    padding: 2.2rem 2rem;
    padding-top: 1.5rem;
`

const SearchContainer = styled.div`
    background-color: #181b2b;
    border-radius: 0.4rem;
    display: flex;
    flex-direction: column;
`

const TopContainer = styled.div`
    font-size: 1.7rem;
    align-items: center;
    display: flex;
    margin-bottom: 2rem;
`

const SearchbarWrapper = styled.div`
    
    cursor: text;
    display: flex;
    align-items: center;
    height: 4rem;
    padding: 0.5rem 1.5rem;
   /*background-color:#1b1f31; #39466f*/
    border-bottom: 1px solid #66CDC4;
    &:hover {
        background-color:${props => props.hoverColor};
    }
    border-top-right-radius: 0.4rem;
    border-top-left-radius: 0.4rem;
`


const Searchbar = styled.input`
    background-color:transparent;
    border-radius: 2px;
    border: none;
    padding: 0.4rem 0.4rem;
    font-size: 1.35rem;
    outline: none;
    color: white;
    margin-left: 1rem;
    &::placeholder {
        color: white;
        opacity: 0.7;
        font-weight: 400;
    }
    &:hover {
        background-color:transparent;
    }
    font-weight: 350;
    height: 3rem;
    width: ${props => props.barWidth};
    transition: width 0.2s ease-out;
    font-family: -apple-system,BlinkMacSystemFont, sans-serif;
`




const IconBorder = styled.div`
    width: 1rem;
    height: 1rem;
    justify-content: center;
    align-items: center;
    font-size: 1.15rem;
    margin-right: 0.7rem;
`


const IconBorder2 = styled.div`
    justify-content: center;
    align-items: center;
    font-size: 1.3rem;
    margin-left: auto;
    margin-right: 1rem;
    margin-top: 0.3rem;
`

const Card = styled.div`
    display: flex;
    font-size: 1.3rem;
    align-items: center;
    padding-left: 1rem;
    height: 3.5rem;
    font-weight: 500;
    cursor: pointer;
    &:hover {
        background-color: #272b45;
    }
  
    transition: all 0.1s ease-in-out;
    border-radius: 0.2rem;
`

const ListContainer = styled.div`
    
`




const HeaderContainer = styled.div`
    display: flex;
    align-items: center;
`

const Header = styled.div`
    display: flex;
    font-size: 1.3rem;
    align-items: center;
    font-weight: 400;
    letter-spacing: 0.5px;
`

const DocumentContainer = styled.div`
    padding: 2.2rem 2rem;
    padding-top: 1.5rem;
`


const Circle = styled.div`
    border-radius: 50%;
    height: 0.6rem;
    width: 0.6rem;
    background-color: #6762df;
    margin-right: 0.7rem;
    background-color: ${props => props.color};
`