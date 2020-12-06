import React from 'react';

//styles
import styled from 'styled-components';
import { MINUS_SIDENAVBAR } from '../../../styles/dimensions';
import { PRIMARY_LIGHT_COLOR, TEXT_COLOR } from '../../../styles/colors';

//icons
import { CgSearch } from 'react-icons/cg';
import { VscBell } from 'react-icons/vsc';

const TopNavbar = () => {

    return (
        <Container>
            {/*
            <LeftItems>
                <SearchbarButton>
                    <SearchbarText>Search</SearchbarText>
                    <IconContainer>
                        <CgSearch/>
                    </IconContainer>
                </SearchbarButton>
                <NotificationButton>
                    <VscBell/>
                </NotificationButton>
                <UserButton>
                    F
                </UserButton>
            </LeftItems>
            */}
        </Container>
    )
}

export default TopNavbar;

const Container = styled.div`
    background-color: #221E32;
    width: 100vw; /*${MINUS_SIDENAVBAR};*/
    height: 6rem;
    display: flex;
    align-items: center;
    padding-right: 15rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`

const LeftItems = styled.div`
    margin-left: auto;
    height: 7rem;
    display: flex;
    align-items: center;
`

const SearchbarButton = styled.div`
    width: 27rem;
    height: 3.5rem;
    border-radius: 0.6rem;
    background-color: ${PRIMARY_LIGHT_COLOR};
    display: flex;
    align-items: center;
    padding: 0rem 2rem;
`

const SearchbarText = styled.div`
    color: white;
    opacity: 0.8;
    font-size: 1.4rem;
`

const IconContainer = styled.div`
    color: white;
    opacity: 0.8;
    font-size: 1.6rem;
    height: 2.5rem;
    margin-left: auto;
    display: flex;
    align-items: center;
`

const NotificationButton = styled.div`
    height: 3.5rem;
    width: 3.5rem;
    font-size: 1.7rem;
    margin-left: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.7rem;
    background-color: ${PRIMARY_LIGHT_COLOR};
    &:hover {
        background-color: ${PRIMARY_LIGHT_COLOR};
    }
    background-color: ${props => props.active ?  PRIMARY_LIGHT_COLOR : ''};
    /*background-color: ${props => props.active ? '#3b404f' : ''};*/
    cursor: pointer;
    color: ${TEXT_COLOR};
`

const UserButton = styled.div`
    border: 1px solid #6762df;
    height: 4rem;
    width: 4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 2rem;
    border-radius: 0.7rem;
    cursor: pointer;
    font-size: 1.6rem;
    color: ${TEXT_COLOR};
`