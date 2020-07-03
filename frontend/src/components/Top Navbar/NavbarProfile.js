import React from 'react';
import styled from 'styled-components';


class NavbarProfile extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            menuOpen: false
        }
    }

    render(){
        return  <Container>
                    <ProfileButton onClick = {() => 
                        {this.setState(prevState => ({menuOpen: !prevState.menuOpen}))}}>
                        FS
                    </ProfileButton>
                    <ProfileMenu 
                        opacity = {this.state.menuOpen ? '' : '0'}
                        top = {this.state.menuOpen ? '' : '-10000px'}
                        left = {this.state.menuOpen ? '' : '-10000px'}
                    >
                        <ProfileHeader>
                            <ProfileButton2>
                                FS
                            </ProfileButton2>
                            <ProfileInfo>
                                <ProfileUsername>
                                    @fsanal
                                </ProfileUsername>
                                <ProfileName>
                                    Faraz Sanal
                                </ProfileName>
                            </ProfileInfo>
                        </ProfileHeader>
                        <MenuButton>
                            Help
                        </MenuButton>
                        <MenuButton>
                            Settings
                        </MenuButton>
                        <MenuButton>
                            Sign out
                        </MenuButton>
                    </ProfileMenu>
                </Container>
    }

}

export default NavbarProfile;

const ProfileButton = styled.div`
    width: 3.5rem;
    height: 3.5rem;
    justify-content: center;
    align-items: center;
    display: flex;
    border-radius: 0.3rem;
    font-size: 1.4rem;
    color: white;
    background-color: #19E5BE;
    cursor: pointer;
    
`

const Container = styled.div`
    position: relative;
    margin-left: 145rem;
`

const ProfileMenu  = styled.div`
    box-shadow: 0 2px 6px 2px rgba(60,64,67,.15);
    width: 18rem;
    margin-top: 1rem;
    background-color: white;
    font-family: -apple-system,BlinkMacSystemFont, sans-serif;
    color: #172A4E;
    padding: 0.25rem 0;
    z-index: 10;

    margin-left: -14rem;
    border-radius: 0.5rem;
    transition: all 0.1s ease-in;
    position: absolute;
    opacity : ${props => props.opacity};
    top: ${props => props.top};
    left: ${props => props.left};
`

const DropdownButton = styled.div`
    padding: 0.5rem;
    height: 2.7rem;
    &:hover {
        background-color: #F7F9FB;
    }
    display: flex;
    align-items: center;
    cursor: pointer;
`

const ProfileHeader =styled.div`
    display: flex;
    align-items: center;
    border-bottom: 1px solid #EDEFF1;
    height: 8rem;
`

const ProfileButton2 = styled.div`
    width: 4.5rem;
    height: 4.5rem;
    margin-left: 1.7rem;
    border: 1px solid #19E5BE;
    justify-content: center;
    align-items: center;
    display: flex;
    border-radius: 0.3rem;
    color: white;
    background-color: #19E5BE;
    font-size: 1.5rem;
    margin-right: 1.7rem;
`

const ProfileInfo = styled.div`
    
`

const ProfileUsername = styled.div`
    font-weight: bold;
    margin-top: 0.65rem;
`

const ProfileName = styled.div`
    display: flex;
    flex-direction: column;
`

const MenuButton = styled.div`
    padding-left: 1.7rem;
    font-size: 1.5rem;
    height: 4rem;
    
    display: flex;
    align-items: center;
    cursor: pointer;
    opacity: 0.8;
    &:hover {
        opacity: 1;
        background-color: #F4F4F6;
    }
`