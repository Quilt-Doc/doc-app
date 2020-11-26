import React, { Component } from 'react';

//styles
import styled from 'styled-components';
import { MENU_SHADOW } from '../../../../../../../styles/shadows';
import chroma from 'chroma-js';

//icons
import { FiChevronDown } from 'react-icons/fi';


class LanguageMenu extends Component {
    constructor(props){
        super(props);

        this.state = {
            optionsOpen: true
        }
    }



    renderOptions = () => {
        const { changeLanguage } = this.props;

        const languages = ["Python", "Javascript", "Java", "PHP",
        "C", "C++", "C#", "Haskell", "Ruby", "Rust", "Scala",
        "Swift", "Typescript", "Lua", "Objective-C", "Go", "Perl",
        "Dart", "Kotlin", "Shell", "R", "Matlab"];

        languages.sort();

        return languages.map(lang => {
            return (
                <Option 
                    onClick = {() => changeLanguage(lang)}
                    key = {lang}
                >
                    {lang}
                </Option>
            );
        });
    }

    render(){
        const { optionsOpen } = this.state;
        return (
            <>
                <Container>
                    <SelectionField>
                        <SelectionText>Select Language</SelectionText>
                        <Icon>
                            <FiChevronDown/>
                        </Icon>
                    </SelectionField>
                </Container>
                {optionsOpen && 
                    <LanguageOptions>
                        {this.renderOptions()}
                    </LanguageOptions>
                }
            </>
        )
    }
}

export default LanguageMenu;

const Option = styled.div`
    padding: 0.5rem 1.5rem;
    font-size: 1.3rem;
    &:hover {
        background-color: ${chroma("#6762df").alpha(0.2)};
    }
    cursor: pointer;
`

const LanguageOptions = styled.div`
    margin-top: 1rem;
    height: 30rem;
    overflow-y: scroll;
    box-shadow: ${MENU_SHADOW};
    border-radius: 0.4rem;
    background-color: white;
    display: flex;
    flex-direction: column;
    padding-top: 0.6rem;
    padding-bottom: 0.6rem;
`

const SelectionField = styled.div`
    background-color: ${chroma("#6762df").alpha(0.2)};
    font-size: 1.4rem;
    display: flex;
    align-items: center;
    border-radius: 0.3rem;
    padding: 0.5rem 1rem;
    cursor: pointer;
    &:hover {
        background-color: ${chroma("#6762df").alpha(0.3)};
    }
`   

const SelectionText = styled.div`
    margin-right: 0.5rem;
`

const Icon = styled.div`
    margin-left: auto;
    margin-right: 0.5rem;
    margin-top: 0.5rem;
    font-size: 1.45rem;
`

const Container = styled.div`
    border-radius: 0.4rem;
    padding: 1rem;
    background-color: white;
    box-shadow: ${MENU_SHADOW};
    cursor: default;
`