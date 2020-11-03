import React from 'react';

//styles 
import styled from "styled-components"

class SearchWorkspace extends React.Component {

    constructor(props) {
        super(props)
    }

    render(){
        return (
            <>
                <ModalHeader>Search for a Workspace</ModalHeader>
                <Title>Enter username and workspace</Title>
                <SearchbarWrapper>
                    <ion-icon style = {{
                        'color': '#172A4E', 'fontSize': '4rem', 'marginRight': '1rem'}} name="search-outline"></ion-icon>
                    <Searchbar placeholder = {"@username/workspace"} />
                </SearchbarWrapper>
                <SubmitButton width = {"9rem"} marginTop = {"1rem"}>Request</SubmitButton>
            </>
        )
    }
}

export default SearchWorkspace;

const ModalHeader = styled.div`
    font-size: 2.5rem;
    color: #172A4E;2
`

const Title = styled.div`
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
    margin-top: 15rem;
    color: #172A4E;
    font-weight: bold;
`   

const SearchbarWrapper = styled.div`
    height: 5rem;
    padding: 2rem;
    width: 34rem;
    border: 1px solid #DFDFDF;
    border-radius: 0.3rem;
    display: flex;
    align-items: center;
    background-color: #FAFBFC;
`

const Searchbar = styled.input`
    outline: none;
    height: 3rem;
    font-size: 1.5rem;
    color: #172A4E;
    border: none;
    width: 50rem;
    background-color: #FAFBFC;
    &::placeholder{
        opacity: 0.6;
        color: #172A4E;
    }
`

const SubmitButton = styled.div`
    font-size: 1.25rem;
    margin-top: 2.5rem;
    align-self: flex-end;
    padding: 0.75rem;
    width: 8.4rem;
    display: inline-block;
    text-transform: uppercase;
    letter-spacing: 2px;
    border-radius: 0.3rem;
    color: #172A4E;
    border: 1px solid #172A4E;
    &:hover {
        color: white;
        background-color: #19e5be;
    }
    cursor: pointer;
`