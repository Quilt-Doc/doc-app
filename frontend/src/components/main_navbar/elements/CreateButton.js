import React from 'react';

//styles
import styled from 'styled-components';

//router
import history from '../../../history';

//icons
import { RiPencilLine } from 'react-icons/ri';

//button to create a new document
class CreateButton extends React.Component {
    constructor(props){
        super(props);
    }

    render(){
        return(
            <>
                <NavbarElement onClick = {() => history.push(`?create_document=true`)} >
                    <RiPencilLine/>
                </NavbarElement>
            </>
        )
    }
}


export default CreateButton;


const NavbarElement = styled.div`
    font-size: 1.8rem;
    background-color: #292d38;
    height: 3.3rem;
    padding: 0 1rem;
    margin-right: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: white;
    border: 1px solid #70EAE1;
    border-radius: 0.3rem;
    cursor: pointer;
`
