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
            filter: ""
        }
    }



    renderOptions = () => {
        const { changeLanguage } = this.props;

        let languages = ["Python", "Javascript", "Java", "PHP",
        "C", "C++", "C#", "Haskell", "Ruby", "Rust", "Scala",
        "Swift", "Typescript", "Lua", "Objective-C", "Go", "Perl",
        "Dart", "Kotlin", "Shell", "R", "Matlab"];

        languages.sort();

        const { filter } = this.state;

        if (filter) {
            languages = languages.filter(lang => lang.toLowerCase().includes(filter.toLowerCase()))
        }

        if (languages.length > 0) {
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
        } else {
            return (
                <EmptyPlaceholder>
                    No Results..
                </EmptyPlaceholder>
            )
        }
    }

    openOptions = (e) => {
        e.stopPropagation(); 
        e.preventDefault(); 
        const { setOptionsOpen } = this.props;
        document.addEventListener('mousedown', this.handleClickOutside, false);
        setOptionsOpen(true);
    }

    handleClickOutside = (e) => {
        if (this.node && !this.node.contains(e.target)) {
            const { setOptionsOpen } = this.props;
            document.removeEventListener('mousedown', this.handleClickOutside, false);
            setOptionsOpen(false);

            const { container, setMenuVisibility } = this.props;

            if (container && !container.contains(e.target)) {
                setMenuVisibility(false)
            }
        }
    }

    renderSelectionFieldContent = () => {
        const { optionsOpen } = this.props;

        if (!optionsOpen) {
            const { language } = this.props;
            const languageText = language ? language : "Select Language";
            return (
                <>
                    <SelectionText>{languageText}</SelectionText>
                    <Icon>
                        <FiChevronDown/>
                    </Icon>
                </>
            )
        } else {
            const { filter } = this.state;
            return (
                <SelectionInput
                    autoFocus = {true}
                    value = {filter}
                    onChange = {(e) => this.setState({filter: e.target.value})}
                />
            )
        }
    }

    render(){
        const { optionsOpen } = this.props;
        return (
            <>
                <Container>
                    <SelectionField onClick = {this.openOptions}>
                        {this.renderSelectionFieldContent()}
                    </SelectionField>
                </Container>
                {optionsOpen && 
                    <LanguageOptions ref = {node => this.node = node}>
                        {this.renderOptions()}
                    </LanguageOptions>
                }
            </>
        )
    }
}

export default LanguageMenu;

const EmptyPlaceholder = styled.div`
    height: 5rem;
    display: flex;
    align-items: center;
    padding: 0rem 1.5rem;
    font-size: 1.3rem;
`

const Option = styled.div`
    padding: 0.5rem 1.5rem;
    font-size: 1.3rem;
    &:hover {
        background-color: ${chroma("#6762df").alpha(0.2)};
    }
    cursor: pointer;
    font-weight: 400;
`

const LanguageOptions = styled.div`
    margin-top: 1rem;
    max-height: 30rem;
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

const SelectionInput = styled.input`
    border: none;
    outline: none;
    font-size: 1.4rem;
    font-family: -apple-system,BlinkMacSystemFont, sans-serif;
    background-color: transparent;
`

const SelectionText = styled.div`
    margin-right: 0.5rem;
    font-weight: 500;
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