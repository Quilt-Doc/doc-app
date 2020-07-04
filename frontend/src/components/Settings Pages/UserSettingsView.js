import React from 'react';
import styled from 'styled-components';

class UserSettingsView extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        return <Container>
                    <Menu>
                        <Header>
                            Personal Settings
                        </Header>
                        <Setting>
                            Profile
                        </Setting>
                        <Setting>
                            Account {/* Password, Username, Email*/}
                        </Setting>
                        <Setting>
                            Connections
                        </Setting>
                        <Setting>
                            Notifications
                        </Setting>
                        <Setting>
                            Workspaces
                        </Setting>
                    </Menu>
                    <Content>
                        <SettingHeader>
                            Profile
                        </SettingHeader>
                        <DualSection>
                            <Section>
                                <Field>
                                    <FieldName>Name</FieldName>
                                    <FieldInput></FieldInput>
                                </Field>
                                <Field>
                                    <FieldName>Bio</FieldName>
                                    <FieldTextArea></FieldTextArea>
                                </Field>
                                <Field>
                                    <FieldName>Job Title</FieldName>
                                    <FieldInput></FieldInput>
                                </Field>
                                <Field>
                                    <FieldName>Organization</FieldName>
                                    <FieldInput></FieldInput>
                                </Field>
                                <Field>
                                    <FieldName>Location</FieldName>
                                    <FieldInput></FieldInput>
                                </Field>
                            </Section>
                            <Section marginLeft = {"8rem"}>
                                <FieldName>Profile Picture</FieldName>
                                <ProfileButton>FS</ProfileButton>
                            </Section>
                        </DualSection>
                        <SettingHeader>
                            Account
                        </SettingHeader>
                        <Section>
                            <Field>
                                <FieldName>Primary Email</FieldName>
                                <FieldInput></FieldInput>
                            </Field>
                            <Field>
                                <FieldName>Username</FieldName>
                                <FieldButton>Change Username</FieldButton>
                            </Field>
                            <Field>
                                <FieldName>Password</FieldName>
                                <FieldButton>Change Password</FieldButton>
                            </Field>
                            
                        </Section>
                        <SettingHeader>
                            Connections
                        </SettingHeader>
                        <Section>
                            <Field>
                                <FieldName>Connect to Github</FieldName>
                                <ConnectButton>
                                    <IconBorder width = {"3.5rem"}>
                                        <ion-icon style = {{'fontSize':'2.5rem',  
                                                            'color': '#172A4E'}} 
                                                    name="logo-github">     
                                        </ion-icon>
                                    </IconBorder>
                                    Connect to Github
                                </ConnectButton>
                            </Field>
                            <Field>
                                <FieldName>Connect to Bitbucket</FieldName>
                                <ConnectButton>
                                    <IconBorder  >
                                        <ion-icon style = {{'fontSize':'2rem', 
                                                            'color': '#172A4E'}} 
                                                    name="logo-bitbucket">     
                                        </ion-icon>
                                    </IconBorder>
                                    Connect to Bitbucket
                                </ConnectButton>
                            </Field>
                            
                        </Section>
                    </Content>
                </Container>
    }
}

export default UserSettingsView;

const Container = styled.div`
    margin: 0 auto; 
    margin-top: 3rem;
    width: 90rem;
    height: 50rem;
    display: flex;

`

const Menu = styled.div`
    width: 20rem;
    display: flex;
    flex-direction: column;
`

const Content = styled.div`
    width: 70rem;

    margin-left: 3rem;
`

const Header = styled.div`
    color: #172A4E;
    height: 4rem;
    display: flex;
    align-items: center;
    font-size: 1.8rem;
    font-weight: bold;
    padding: 1rem;
    margin-bottom: 2rem;
`

const Setting = styled.div`
    height: 4rem;
    padding: 1rem;
    color: #172A4E;
    display: flex;
    align-items: center;
    &:first-of-type {
        margin-top: 2.5rem;
    }
    opacity: 0.7;
    font-size: 1.7rem;
    &:hover {
        background-color: #F4F4F6;
        opacity: 1;
    }
    cursor: pointer;
    border-radius: 0.3rem;
`

const Username = styled.div`
    font-weight: bold;
`

const HeaderTitle = styled.div`
    font-size: 1.8rem;
    font-weight: bold;
    margin-bottom: 1.5rem;
`

const SettingHeader = styled.div`
    height: 4rem;
    display: flex;
    align-items: center;
    font-size: 2.5rem;
    font-weight: bold;
    color: #172A4E;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #EDEFF1;
`

const DualSection = styled.div`
    display: flex;
`

const Section = styled.div`
    display: flex;
    flex-direction:column;
    padding-top: 2rem;
    padding-bottom: 2rem;
    margin-left: ${props => props.marginLeft};
    margin-bottom: 2.5rem;
`

const FieldName = styled.div`
    font-weight: bold;
    color: #172A4E;
    margin-bottom: 1rem;
`

const Field = styled.div`
    margin-bottom: 2.5rem;
`

const FieldInput = styled.input`
    outline: none;
    height: 3.5rem;
    width: 30rem;
    border-radius: 0.3rem;
    border: 1px solid #DFDFDF;
    padding: 1rem;
    color: #172A4E;
    font-size: 1.5rem;
    background-color: #FAFBFC;

    &:focus {
        background-color: white;
        border: 1px solid #19E5BE;
    }
`

const FieldTextArea = styled.textarea`
    outline: none;
    width: 30rem;
    height: 7rem;
    border-radius: 0.3rem;
    border: 1px solid #DFDFDF;
    background-color: #FAFBFC;
    font-size: 1.5rem;
    color: #172A4E;
    padding: 1rem;
    resize: none;
    &:focus {
        background-color: white;
        border: 1px solid #19E5BE;
    }
`

const FieldButton = styled.div`
    height: 4rem;
    width: 17rem;
    border-radius: 0.5rem;
    border: 1px solid #19E5BE;
    padding: 1rem;
    color: #172A4E;
    font-size: 1.5rem;
    background-color: #FAFBFC;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: white;
    cursor: pointer;
    &:hover {
        background-color: #FAFBFC;
    }
`


const ConnectButton = styled.div`
    border: 1px solid #1BE5BE;
    color: #172A4E;
    display: flex;
    align-items: center;
    padding: 1.5rem;
    height: 4.5rem;
    width: 22rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1.5rem;

    &:hover {
        background-color:  #F7F9FB;
    }
`

const IconBorder = styled.div`
    display: flex;
    align-items: center;
    jusify-content: center;
    width: 3.5rem;
`

const ProfileButton = styled.div`
    width: 14rem;
    height: 14rem;
    justify-content: center;
    align-items: center;
    display: flex;
    border-radius: 0.3rem;
    font-size: 5rem;
    color: white;
    background-color: #19E5BE;
    cursor: pointer;  
`