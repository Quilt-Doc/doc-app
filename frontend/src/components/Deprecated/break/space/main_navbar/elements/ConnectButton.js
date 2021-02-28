import React from 'react';

//styles
import styled from 'styled-components';

//icons
import { VscDebugDisconnect } from 'react-icons/vsc';

// history
import history from '../../../../history';

// button to create linkages on the main navbar
class ConnectButton extends React.Component {
    render(){
        return(
            <NavbarElement onClick = {() => history.push(`?create_linkage=true`)}  >
                <VscDebugDisconnect style = {{color: 'white'}}/>
            </NavbarElement>
        )
    }
}

export default ConnectButton;


const NavbarElement = styled.div`
    font-size: 1.8rem;
    background-color:#292d38;;
    height: 3.3rem;
    padding: 0 1rem;
    margin-right: 3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: white;
    border: 1px solid #5871FF;
    border-radius: 0.3rem;
    cursor: pointer;
`
