import React, { Component } from 'react';

//styles
import styled from 'styled-components';
import chroma from 'chroma-js';

//icons
import { RiCheckFill } from 'react-icons/ri';

//components
import RepositoryMenu3 from '../../menus/RepositoryMenu3';

class Filter extends Component {
    constructor(props){
        super(props);

        this.state = {
            documentIsSelected: false,
            referenceIsSelected: false
        }
    }

    render(){
        const { documentIsSelected, referenceIsSelected } = this.state;
        return(
            <FilterContainer>
                <FilterHeader>Filter By</FilterHeader>
                <FilterBlock>
                    <SectionHeader>Type</SectionHeader>
                    <TypeButton color = {'#f27448'}>
                        Documents
                    </TypeButton>
                    <TypeButton color = {'#6762df'}>
                        References
                    </TypeButton>
                </FilterBlock>
                <FilterBlock>
                    <SectionHeader>Repository</SectionHeader>
                    <RepositoryMenu3/>
                </FilterBlock>
                <FilterBlock>
                    <SectionHeader>References</SectionHeader>
                    
                </FilterBlock>
                <FilterBlock>
                    <SectionHeader>Documents</SectionHeader>
                    
                </FilterBlock>
                <FilterBlock>
                    <SectionHeader>Labels</SectionHeader>
                    
                </FilterBlock>
                <FilterBlock>
                    <SectionHeader>Creator</SectionHeader>
                    
                </FilterBlock>
                <FilterBlock>
                    <SectionHeader>Status</SectionHeader>
                    
                </FilterBlock>
            </FilterContainer>
        )
    }
}

export default Filter;

const TypeButton = styled.div`
    background-color: ${props => chroma(props.color).alpha(0.2)};
    border-radius: 0.3rem;
    font-size: 1.1rem;
    padding: 0.7rem 1rem;
    display: inline-flex;
    color:  ${props => props.color};
    text-transform: uppercase;
    font-weight: 400;
    &:last-of-type {
        margin-top: 1rem;
    }
    justify-content: center;
    align-items: center;
    width: 9rem;
`


const FilterHeader = styled.div`
    color: #172A4e;
    font-weight: 500;
    font-size: 1.8rem;
    height: 3rem;
`

const FilterBlock = styled.div`
    display: flex;
    flex-direction: column;
`

const SectionHeader = styled.div`
    height: 2rem;
    font-weight: 500;
    font-size: 1.3rem;
    text-transform: uppercase;
    opacity: 0.7;
    margin-top: 2.5rem;
    margin-bottom: 1rem;
`   

const FilterContainer = styled.div`
    height: 70rem;
    width: 40rem;
    margin-right: 3rem;
    background-color: white;
    box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 5px 10px -5px;
    border-radius: 0.7rem;
    padding: 3rem;
    display: flex;
    flex-direction: column;
`

const Form = styled.div`
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
`

const CheckBoxBorder = styled.div`
    min-height: 4rem;
    min-width: 4rem;
    margin-right: 0.5rem;
    &:hover {
        background-color: ${chroma("#6762df").alpha(0.1)};
    }
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-radius: 50%;
`

const CheckBox = styled.div`
    height: 1.6rem;
    width: 1.6rem;
    background-color: ${props => props.backgroundColor};
    border: 2px solid ${props => props.borderColor};
    border-radius: 0.2rem;
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
    margin-right: 1rem;
`

const CheckContainer = styled.div`
    display: flex;
    align-items: center;
    &:first-of-type {
        margin-bottom: 1.4rem;
    }
    font-size: 1.3rem;
    font-weight: 500;
`