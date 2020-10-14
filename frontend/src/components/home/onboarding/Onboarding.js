import React from 'react';

//styles
import styled from 'styled-components';

//actions
import { editUser } from '../../../actions/User_Actions'

//redux
import { connect } from 'react-redux';

//router
import history from '../../../history';

//email validation
import * as EmailValidator from 'email-validator';

class Onboarding extends React.Component {
    constructor(props){
        super(props);
    }

    onboardUser = async () => {
        const { editUser, user: {_id}} = this.props;
        const firstName = this.firstNameInput.value;
        const lastName = this.lastNameInput.value;
        const email = this.emailInput.value;

        if (!firstName) alert("Please enter a first name");
        if (!lastName) alert("Please enter a last name");
        if (!email) alert("Please enter an email");

        if (!EmailValidator.validate(email)){
            alert("Invalid Email");
        }

        await editUser({userId: _id, firstName, lastName, onboarded: true, email});
        history.push('/home/workspaces')
    }

    render(){
        const { user } = this.props;
        let { search } = history.location;
        let params = new URLSearchParams(search)
        let email = params.get('email');
        console.log("USER", user);
        console.log("EMAIL", email);
        return(
                <Content>
                    <Header>
                        Welcome!
                    </Header>
                    <SubHeader>
                        Provide us some info so we can tailor your experience.
                    </SubHeader>
                    <SubContent>
                        <Top>
                            <NameInput 
                                defaultValue = {user.firstName}
                                ref = {node => this.firstNameInput = node}
                                spellCheck = {false} 
                                autoFocus 
                                placeholder = {"First Name"}/>
                            <NameInput 
                                defaultValue = {user.lastName}
                                ref = {node => this.lastNameInput = node}
                                spellCheck = {false} 
                                placeholder = {"Last Name"}/>
                        </Top>
                        <EmailInput
                            defaultValue = {email}
                            ref = {node => this.emailInput = node}
                            spellCheck = {false} 
                            placeholder = {"Email"} 
                        />
                        <NextButton onClick = {() => this.onboardUser()}>
                            Next
                        </NextButton>
                    </SubContent>
                </Content>
        )
    }
}

const mapStateToProps = (state) => {
    const { auth: {user} } = state;
    return {
        user
    }
}

export default connect(mapStateToProps, { editUser })(Onboarding);

 {/*
                            <CSSTransition
                                in = {this.state.page === 0}
                                unmountOnExit
                                enter = {true}
                                exit = {false}     
                                appear = {true}  
                                timeout = {300}
                                classNames = "slidepane"
                            >   
                                <div style ={{width: "100%"}}>
                                    <ChooseProvider
                                        changePage = {this.changePage}
                                    />
                                </div> 
                            </CSSTransition>*/}

const Top = styled.div`
    display: flex;
    margin-bottom: 2rem;
`

const NextButton = styled.div`
    background-color: #23262f;
    height: 3.5rem;
    border-radius: 0.4rem;
    display: inline-flex;
    border-radius: 0.3rem;
    margin-top: 5rem;
    font-size: 1.6rem;
    display: inline-flex;
    align-items: center;
    padding-left: 2rem;
    padding-right: 2rem;
    font-weight: 500;
    border: 1px solid #5B75E6;
    cursor: pointer;
    &:hover {
        background-color: #2e323d;
    }
    width: 100%;
`

const NameInput = styled.input`
    height: 4.5rem;
    font-size: 1.7rem;
    display: flex;
    align-items: center;
    background-color: #23262f;
    padding-left: 2rem;
    padding-right: 2rem;
    color: white;
    border-radius: 0.3rem;
    border: 1px solid #3e4251;
    letter-spacing: 0.5px;
    outline: none;
    &::placeholder {
        color: white;
        opacity: 0.3;
    }
    &:focus{
        border: 1px solid #19e5be;
    }
   width: 35rem;
   &:first-of-type {
        margin-right: 2rem;
   }    
   width: 29rem;
`         


const EmailInput = styled.input`
    height: 4.5rem;
    font-size: 1.7rem;
    display: flex;
    align-items: center;
    background-color: #23262f;
    padding-left: 2rem;
    padding-right: 2rem;
    color: white;
    border-radius: 0.3rem;
    border: 1px solid #3e4251;
    letter-spacing: 0.5px;
    outline: none;
    &::placeholder {
        color: white;
        opacity: 0.3;
    }
    &:focus{
        border: 1px solid #19e5be;
    }
    margin-bottom: 2rem;
    width: 100%;
`          

const Container = styled.div`
    background-color:#16181d;
    min-height: 100vh;
    width: 100vw;
    display: flex;
    flex-direction: column;
    overflow-y: scroll;
    padding-bottom: 20rem;
`

const TopNavbar = styled.div`
    height: 10rem;
    color:#D6E0EE;
    display: flex;
    align-items: center;
`

const StyledIcon = styled.img`
    width: 2.7rem;
    margin-left: 4.5rem;
    margin-right: 1rem;
`

const Company = styled.div`
    font-size: 3rem;
    color:white;
    font-weight: 500;
    letter-spacing: 1.5px;
    margin-right: 15rem;
    margin-top: -0.25rem;
`

const CreateBox = styled.div`
    background-color: white
    height: 60rem;
    width: 100rem;
    margin-top: 3rem;
    border-radius: 0.4rem;
    align-self: center;
    display: flex;
    justify-content: center;
`

const Content = styled.div`
    width: 60rem;
    color: white;
    padding-top: 5rem;
    margin-top: 3rem;
    align-self: center;
`

const Header = styled.div`
    font-size: 2.6rem;
    height: 4.5rem;
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
`

const SubHeader = styled.div`
    color: white;
    font-size: 1.8rem;
    font-weight: 400;
    opacity: 0.9;
`

const SubContent = styled.div`
    margin-top: 5rem;
    width: 100%;
`