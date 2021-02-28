import React, { useState } from 'react'
import styled from 'styled-components';

import { FaConfluence, FaJira, FaTrello } from "react-icons/fa";
import { FiFileText} from "react-icons/fi"
import {GiTicket} from 'react-icons/gi'
import {GoFileCode} from 'react-icons/go'

import KnowledgeView from './KnowledgeView';
import SearchView from './SearchView';

//components
import { CSSTransition } from 'react-transition-group';

//split markers -- directory, file
const ExtensionDemo = () => {
    let [page, changePage] = useState(1)
    
    return (<Container>
                <Content>
                    {page === 0 &&
                        <CSSTransition
                            in = {page === 0}
                            appear = {true}        
                            timeout = {300}
                            classNames = "page"
                        >
                            <div>
                                <KnowledgeView/>
                            </div>
                        </CSSTransition>
                    }
                    {page === 1 &&
                        <CSSTransition
                            in = {page === 1}
                            appear = {true}      
                            timeout = {300}
                            classNames = "page"
                        >
                            <div>
                                <SearchView/>
                            </div>
                        </CSSTransition>
                    }
                </Content>
                <Navbar>
                    <NavbarIcon active = {page === 0} onClick = {() => changePage(0)}>
                        <ion-icon name="layers-outline"></ion-icon>
                    </NavbarIcon>
                    <NavbarIcon active = {page === 1} onClick = {() => changePage(1)}>
                       <ion-icon name="search-outline"></ion-icon>
                    </NavbarIcon>
                    <NavbarIcon onClick = {() => changePage(2)}>
                        <ion-icon name="planet-outline"></ion-icon>
                    </NavbarIcon>
                    <NavbarIcon onClick = {() => changePage(3)}>
                        <ion-icon name="notifications-outline"></ion-icon>
                    </NavbarIcon>
                </Navbar>
            </Container>);
}

export default ExtensionDemo;

const Content = styled.div`
    flex: 1 1 30rem;
    margin-right: 3rem;
`

const Container = styled.div`
    display: flex;
    background-color: #0F111B;
    color: white;
    padding: 2rem;
`

const Navbar = styled.div`
    display: flex;
    flex-direction: column;
    margin-left: auto;
`


const NavbarHeader = styled.div`
    
`

const NavbarIcon = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 3rem;
    width: 3rem;
    font-size: 1.8rem;
    margin-bottom: 1rem;
    background-color: #1b1f31;
    border-radius: 0.3rem;
    cursor: pointer;
    &:hover {
        background-color: #272b45;
    }
    border-bottom: ${props => props.active ? "2px solid #66CDC4" : ""};
`

const Icons = styled.div`
    margin-left: auto;
`



