import React from 'react';

import styled from 'styled-components';

import { HiOutlineFilter} from 'react-icons/hi';
import {FiChevronDown, FiFilter} from 'react-icons/fi'
import {TiFilter} from 'react-icons/ti';
import { IoIosSearch } from 'react-icons/io';


class InfobankToolbar extends React.Component {
    constructor(props){
        super(props)
    }
    /*onBlur = {(e) => {e.target.blur(); setSearch(false)}}*/
    /* hoverColor = {search ? '#313b5e' : '#39466f'} onClick = {() => setSearch(true)}*/

    onPressHandler = (e) => {
        if (e.key === "Enter") {
            this.props.updateQuery(this.input.value);
        }
    }

    render(){
        return (
            <Container>
                <SearchbarWrapper>
                    <Searchbar ref = {node => this.input = node} onKeyPress = {(e) => {this.onPressHandler(e)}} placeholder = {"Search for anything.."} />
                    <SearchButton>
                        <IoIosSearch/>
                    </SearchButton>
                </SearchbarWrapper>
            </Container>
        )
    }
    
}

/* <SearchbarWrapper>
                    <Searchbar ref = {node => this.input = node} onKeyPress = {(e) => {this.onPressHandler(e)}} placeholder = {"Search for anything.."} />
                    <SearchButton>
                        <IoIosSearch/>
                    </SearchButton>
                </SearchbarWrapper>*/

export default InfobankToolbar;

const Container = styled.div`
    background-color: white;
    padding: 3.5rem 2.5rem;
    border-radius: 0.5rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    margin-bottom: 4rem;
`

const Type = styled.div`
    padding: 0.5rem 1.5rem;
    border: 1px solid #E0E4E7;
    font-size: 1.3rem;
    border-radius: 1.5rem;
    margin-right: 1rem;
    opacity: 0.9;
    ${props => props.active ? 
        "opacity: 1; \
         background-color:#383e4c; \
         border: none; \
         color: white;" : ""
    }
    &:hover {
        box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 8px 16px -6px;
    }
    cursor: pointer;
`

const Leftbar = styled.div`
    display: flex;
    margin-left: auto;
`

const SortButton = styled.div`
    display: inline-flex;
    align-items: center;
    background-color:  #2B2F3A;
    font-size: 1.5rem;
    padding: 0rem 2rem;
    border-radius: 0.4rem;
    margin-left: 15rem;
    height:4.5rem;
    color: white;
`

const Pretense = styled.div`
    opacity: 0.8;
    margin-right:0.5rem;
`

const Sorted = styled.div`
    font-weight: 500;
`


const FilterButton = styled.div`
    height: 4.5rem;
    width: 4.5rem;
    margin-left: 1rem;
    background-color: #2B2F3A;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.2rem;
    border-radius: 0.4rem;

    cursor: pointer;
    &:hover {
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }
    
`



const SearchbarWrapper = styled.div`
    width: 4 0rem;
    height: 4.5rem;
    background-color: #eff3f5;
    border-radius: 0.4rem;
    padding: 0rem 1.5rem;
    padding-right: 0rem;
    cursor: text;
    display: flex;
    align-items: center;
    &:hover {
    }
`

const SearchButton = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 4.5rem;
    width: 6rem;
    margin-left: auto;
    background-color: #2B2F3A;
    color: white;
    font-size: 2.5rem;
    border-top-right-radius: 0.4rem;
    border-bottom-right-radius: 0.4rem;
`

const Searchbar = styled.input`
    background-color:transparent;
    border-radius: 2px;
    border: none;
    padding: 0.4rem 0.4rem;
    font-size: 1.5rem;
    outline: none;
    margin-right: 1rem;
    &::placeholder {
        color: #172A4e;
        opacity: 0.7;
        font-weight: 400;
    }
    &:hover {
        background-color:transparent;
       
    }
    
    font-weight: 400;
    height: 3.5rem;
    width: 30rem;
    flex: 1 1 30rem;
    /*transition: width 0.15s ease-out;*/
    font-family: -apple-system,BlinkMacSystemFont, sans-serif;
`

const Main = styled.div`
    display: flex;
    align-items: center;
`

const Second = styled.div`
    display: flex;
    align-items: center;
    margin-top: 1.5rem;
`
/*
const Container = styled.div`
    
    padding-left: 5rem;
    padding-right: 5rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    padding-top: 3rem;
    padding-bottom: 2rem;
    background-color: white;
    z-index: 2;
    margin-bottom: 1rem;
    position: sticky;
    top: 0;
`*/


/*
    render(){
        return(
            <Container>
                <Main>
                   
                    <Leftbar>
                        <SortButton>
                            <Pretense>Sort by</Pretense>
                            <Sorted>Relevance</Sorted>
                            <FiChevronDown 
                                style = {{
                                    marginLeft: "0.5rem",
                                    marginTop: "0.25rem",
                                    fontSize: "1.45rem"
                                }}
                            />
                        </SortButton>
                        <FilterButton>
                            <TiFilter
                                style = {{ opacity: 1, marginTop: "0.2rem"}}
                            />
                        </FilterButton>
                    </Leftbar>
                </Main>
                <Second>
                    <Type active = {true}>Documents</Type>
                    <Type>Linkages</Type>
                    <Type>Code</Type>
                </Second>
            </Container>
        )
    }*/