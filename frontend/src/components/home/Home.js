import React from 'react';

//components
import Workspaces from './workspaces/Workspaces';

//styles
import styled from 'styled-components';

//router
import history from '../../history';

//actions
import { logOut, checkLogin } from '../../actions/Auth_Actions';

//react-redux
import { connect } from 'react-redux';
//icons
import logoSVG from '../../images/final_logo_2.svg';
import { RiLogoutCircleLine } from 'react-icons/ri';


const Home = ({logOut, checkLogin}) => {

    const userLogout = async () => {
        await logOut();
        await checkLogin();
        history.push('/login');
    }

    return (
        <Container>
            <Top>
                <StyledIcon src = {logoSVG}/>
                <BrandName>
                    quilt
                </BrandName>
                <LogoutButton onClick = {() => {userLogout()}}>
                    <RiLogoutCircleLine/>
                </LogoutButton>
            </Top>
            <Workspaces/>
        </Container>
    )
}

const mapStateToProps = () => {
    return {}
}

export default connect(mapStateToProps, {logOut, checkLogin})(Home);

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
    max-width: 4.3rem;
    margin-right: 1rem;
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