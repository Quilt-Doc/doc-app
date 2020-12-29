import React from "react";

//styles
import styled from "styled-components";
import chroma from "chroma-js";

//icons
import { ImGithub } from "react-icons/im";
import logoSVG from "../../images/final_logo.svg";

//router
import history from "../../history";

// endpoint used by axios api to backend
import { apiEndpoint } from "../../apis/api";

// component that the user sees to login
class Login extends React.Component {
    // opens up the backend route set by passport
    // instantiates the login process for github
    goLogin = () => {
        let { search } = history.location;
        let params = new URLSearchParams(search);
        let email = params.get("email");

        if (email !== null && email !== undefined) {
            window.open(`${apiEndpoint}/auth/github?email=${email}`, "_self");
        } else {
            window.open(apiEndpoint + "/auth/github", "_self");
        }
    };

    render() {
        return (
            <Background>
                <Container>
                    <Content>
                        <StyledIcon src={logoSVG} />
                        <Company>quilt</Company>
                        <SubHeader>
                            The knowledge solution for developer teams.
                        </SubHeader>
                        <SubHeader2>
                            Sign in with Github to get started
                        </SubHeader2>
                        <NextButton
                            onClick={() => {
                                this.goLogin();
                            }}
                        >
                            <ImGithub style={{ marginRight: "1rem" }} />
                            Continue with Github
                        </NextButton>
                    </Content>
                </Container>
            </Background>
        );
    }
}

export default Login;

const Background = styled.div`
    background-color: #16181d;
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
`;

const Container = styled.div`
    height: 100%;
    width: 100%;
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow-y: scroll;
    color: white;
    justify-content: center;
    align-items: center;
`;

const StyledIcon = styled.img`
    width: 8rem;
    margin-bottom: 0.5rem;
    margin-left: -4.5rem;
`;

const Company = styled.div`
    letter-spacing: 1px;
    font-weight: 400;
    font-size: 4.5rem;
    display: flex;
    align-items: center;
    margin-bottom: 1.5rem;
`;

const NextButton = styled.div`
    background-color: #23262f;
    height: 4rem;
    border-radius: 0.4rem;
    display: inline-flex;
    border-radius: 0.3rem;
    margin-top: 2rem;
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
`;

const Content = styled.div`
    margin-top: -10rem;
    width: 43rem;
    padding-top: 8rem;
    padding-bottom: 8rem;
    border-radius: 0.3rem;
    color: white;
    border: 2px solid ${chroma("#6762df").alpha(0.4)};
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: 0 6px 10px 0 rgba(0, 0, 0, 0.14),
        0 1px 18px 0 rgba(0, 0, 0, 0.12), 0 3px 5px -1px rgba(0, 0, 0, 0.4);
`;

const SubHeader = styled.div`
    color: white;
    font-size: 1.8rem;
    font-weight: 300;
    opacity: 1;
    margin-top: 2.5rem;
`;

const SubHeader2 = styled.div`
    color: white;
    font-size: 1.8rem;
    font-weight: 400;
    opacity: 1;
    margin-top: 5rem;
`;
