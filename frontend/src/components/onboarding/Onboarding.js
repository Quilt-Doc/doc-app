import React from 'react';

//styles
import styled from 'styled-components';

//actions
import { editUser } from '../../actions/User_Actions'
import { checkLogin, logOut } from '../../actions/Auth_Actions';

//redux
import { connect } from 'react-redux';

//router
import history from '../../history';

//email validation
import * as EmailValidator from 'email-validator';

//logo
import logoSVG from '../../images/final_logo.svg';
import { RiLogoutCircleLine } from 'react-icons/ri';

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
        history.push('/workspaces')
    }

    userLogout = async () => {
        const { logOut, checkLogin } = this.props;
        await logOut();
        await checkLogin();
        history.push('/login');
    }

    render(){
        const { user } = this.props;
        let { search } = history.location;
        let params = new URLSearchParams(search)
        let email = params.get('email');

        return(
            <Container>
                <Top>
                    <StyledIcon src = {logoSVG}/>
                    <BrandName>
                        quilt
                    </BrandName>
                    <LogoutButton onClick = {this.userLogout}>
                        <RiLogoutCircleLine/>
                    </LogoutButton>
                </Top>
                <Content>
                    <Header>
                        Welcome!
                    </Header>
                    <SubHeader>
                        Provide us some info so we can tailor your experience.
                    </SubHeader>
                    <SubContent>
                        <Top2>
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
                        </Top2>
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
            </Container>
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


const LogoutButton = styled.div`
    background-color: #23262e;
    height: 3.5rem;
    width: 3.5rem;
    border-radius: 0.3rem;
    margin-left: auto;
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
    font-size: 2rem;
    cursor: pointer;
    &:hover {
        box-shadow: 0 6px 10px 0 rgba(0, 0, 0, 0.14), 0 1px 18px 0 rgba(0, 0, 0, 0.12), 0 3px 5px -1px rgba(0, 0, 0, 0.4);
    }
`

const BrandName = styled.div`
    font-size: 3.5rem;
    letter-spacing: 1px;
    font-weight: 400;
    margin-top: 0.3rem;
`

const StyledIcon = styled.img`
    max-width: 4rem;
    margin-right: 1.33rem;
    margin-top: 1.5rem;
`

const Container = styled.div`
    background-color:#16181d;
    display: flex;
    flex: 1;
    display: flex;
    flex-direction: column;
    color: white;
`


const Top = styled.div`
    height: 9rem;
    padding-left: 8.5rem;
    padding-right: 8.5rem;
    color:white;
    display: flex;
    align-items: center;
`

const Top2 = styled.div`
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
    border: 1px solid #6762df;
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

const TopNavbar = styled.div`
    height: 10rem;
    color:#D6E0EE;
    display: flex;
    align-items: center;
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