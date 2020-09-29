import React, { useState, useEffect, useRef } from 'react';

const SelectMenu = ({components, actions, data, misc}) => {
    const [ open, setOpen ] = useState(false);
    const [ loaded, setLoaded ] = useState(false);
    const [ position, setPosition ] = useState(-1);
    const [ query, setQuery ] = useState("");

    const { createSelectable, createOpenButton } = components;
    const { select, deselect, search, retrieve, create } = actions;
    const { returnData, returnSelected } = data;
    const { placeholder, hold } = misc;

    const selected = returnSelected();
    const data = returnData();

    const button = useRef(null);
    const menu = useRef(null);

    const listenerAttached = false;

    useEffect(async () => { 
        if (open) {
            if (!listenerAttached) {
                document.addEventListener('mousedown', this.handleClickOutside, false);
                listenerAttached = true;
            }
            await retrieve(selected); 
            setLoaded(true);
        } else if (listenerAttached) {
            document.removeEventListener('mousedown', this.handleClickOutside, false);
            listenerAttached = false;
        }
    }, [open])

    handleClickOutside = (event) => {
        const checkNodeContains = (node) => 
            { if (node && node.current && !node.current.contains(event.target)) return true; }

        if (checkNodeContains(button) && checkNodeContains(menu)) {
            setOpen(false)
        }
    }

    const renderContent = () => {
        return (
            <ListContainer>
                { 
                    data.map((item, i) => {
                        const isSelected = selected.includes(item._id);
                        const isHovered = position === i;
                        return createSelectable(item, isSelected, isHovered,
                            handleSelect(e, item, isSelected),
                            handleFocus(e, item, i)
                        );
                    }) 
                }
            </ListContainer>
        )
    }

    const handleSelect = (e, item, isSelected) => {
        if (e) e.preventDefault();
        if (deselect && isSelected) {
            await deselect(item);
        } else {
            await select(item)
        }
    }

    const handleButtonClick = (e) => {
        e.preventDefault();
    }

    return (
        <>
            <ButtonContainer ref = {button} onClick = {handleButtonClick}>
                {createOpenButton()}
            </ButtonContainer>
            <CSSTransition
                in = {open}
                unmountOnExit
                enter = {true}
                exit = {true}       
                timeout = {150}
                classNames = "dropmenu"
            >
                <MenuContainer ref = {menu}>
                    <HeaderContainer>Add labels</HeaderContainer>
                    <MenuSearchbar 
                        data = {data}
                        selected = {selected}
                        handleSelect = {handleSelect}
                        position = {position} 
                        setPosition = {setPosition}
                        search = {search}
                        hold = {hold}
                        query = {query}
                        setQuery = {setQuery}
                        placeholder = {placeholder}
                    />
                    {renderContent()}
                </MenuContainer>
            </CSSTransition>
        </>
    )
}

const MenuSearchbar = ({ data, selected, handleSelect, position, setPosition, 
    search, hold, query, setQuery, placeholder }) => {

    let typingTimeout = null;

    useEffect(async () => await search(query), [query]);

    const handleChange = (e) => {
        if (hold) {
            if (typingTimeout) clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() =>  setQuery(e.target.value), 200);
        } else {
            setQuery(e.target.value);
        }
    }

    const handleKeyDown = (e) => {
        e.preventDefault();
        if (e.key === "Enter" && position !== -1 ) {
            const item = data[position];
            const isSelected = selected.includes(item._id);
            handleSelect(null, item, isSelected);
        } else if (e.keyCode === 38) {
            position !== -1 ? setPosition(position - 1) : setPosition(data.length - 1);
        } else if (e.keyCode === 40) {
            position !== data.length - 1 ? setPosition(position + 1) : setPosition(-1);
        }
    }

    return (
        <SearchbarContainer>
            <Searchbar 
                onKeyDown = {handleKeyDown}  
                onChange = {handleChange}
                placeholder = {placeholder}
                autoFocus 
            />
        </SearchbarContainer>
    )
}

// setData (currently attached)
// data (can be seen in menu)
// retrieve
// select
// deselect
