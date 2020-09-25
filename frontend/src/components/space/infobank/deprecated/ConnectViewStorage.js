import React from 'react';
import styled from 'styled-components';

import chroma from 'chroma-js';

import {RiSlackLine} from 'react-icons/ri';
import {FaConfluence} from 'react-icons/fa';
import {FaTrello, FaJira} from 'react-icons/fa';
import {SiAsana, SiNotion} from 'react-icons/si';
import {IoIosSearch} from 'react-icons/io'
import {RiFilter2Line} from 'react-icons/ri';

class Infobank extends React.Component {
    renderListItems(){
        let jsx = []
        let names = [
            "Function Behavior", "Tensor Manipulation",
            "Pegasus", "Connect Docs", "Semantic Hookup",
            "Report Infra"
        ]
        let icons = [
            <RiSlackLine style = {{
                marginRight: "1rem",
                color: '#E11D5A'
            }}/>,
            <FaConfluence style = {{
                marginRight: "1rem",
                color: '#227AF5'
            }}/>,
            <FaTrello style = {{marginRight: "1rem",
                color: '#016AA7'
            }}/>,
            <FaJira style = {{marginRight: "1rem",
                color: '#2684FF'
            }}/>,
            
        ]
        {/*<SiAsana/>,
        <SiNotion/>*/}
        for (let i = 0; i < 20; i++){
            jsx.push(
                <ListItem active = {i%2 == 0 ? true : false}>
                    {icons[i%4]}
                    <Title>{names[i % 6]}</Title>
                </ListItem>
            )
        }
        return jsx
    }
    render(){
        return(
            <Container>
                <Header>Infobank</Header>
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
        )
    }
}

export default Infobank

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
    /*border-bottom: 1px solid #e0e4e7;*/
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
    background-color: ${props => props.active ? chroma("#5B75E6").alpha(0.04) : ''};
    font-size: 1.5rem;
`