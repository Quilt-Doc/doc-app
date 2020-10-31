import React, {Component} from 'react';

//styles
import styled from 'styled-components';
import chroma from 'chroma-js';

//icons
import { FiPlus, FiTrash } from 'react-icons/fi';

//react-redux
import { connect } from 'react-redux';

//react-router
import { withRouter } from 'react-router-dom';
import history from '../../history';

//actions
import { editUser } from '../../actions/User_Actions';
import { sendInvite } from '../../actions/Auth_Actions';
import { deleteWorkspace } from '../../actions/Workspace_Actions';

//email validation
import * as EmailValidator from 'email-validator';
 
class UserSettings extends Component {
    constructor(props) {
        super(props)
    }


    sendInvite = () => {
        const { memberUsers, sendInvite, match } = this.props;
        const { workspaceId } = match.params;

        let email = this.invite.value;
        if (!EmailValidator.validate(this.invite.value)){
            alert("Invalid Email");
            return
        }


        const emails = memberUsers.map(user => user.email);

        if (emails.includes(email)) {
            alert("User email already exists in workspace")
            return
        }

        sendInvite({workspaceId, email})
    }

    validateLength = (formValue) => {
        if (formValue.length === 0) return false;
        return true;
    }

    saveUserSettings = () => {
        const { user, editUser } = this.props;
        let formValues = {};
        if (this.validateLength(this.firstName.value) && this.firstName.value !== user.firstName) formValues.firstName = this.firstName.value;
        if (this.validateLength(this.lastName.value) && this.lastName.value !== user.lastName) formValues.lastName = this.lastName.value;
        if (this.validateLength(this.email.value) && this.email.value !== user.email) {
            if (!EmailValidator.validate(this.email.value)){
                alert("Invalid Email");
            }
            formValues.email = this.email.value;
        } 
        if (this.validateLength(this.bio.value) && this.bio.value !== user.bio) formValues.bio = this.bio.value;
        if (this.validateLength(this.position.value) && this.position.value !== user.position) formValues.position = this.position.value;
        if (this.validateLength(this.org.value) && this.org.value !== user.organization) formValues.organization = this.org.value;

        formValues.userId = user._id;

        editUser(formValues);
        alert("User settings were successfully changed.");
    }

    deleteWorkspace = async () => {
        const { deleteWorkspace, match } = this.props;
        const { workspaceId } = match.params;
        history.push('/workspaces');
        await deleteWorkspace({ workspaceId });
    }

    render() {
        const { workspace, user, memberUsers } = this.props;


        let renderWorkspaceSettings;
        
        if (workspace) {
            renderWorkspaceSettings = workspace.creator._id === user._id;
        }

        return (
            <>
                { workspace && 
                    <Container>
                            <Top>
                                <Header>SETTINGS</Header>
                            </Top>
                            <SubContainer>
                                <Content>
                                    { renderWorkspaceSettings && 
                                        <Block>
                                            <SettingHeader>
                                                Workspace Settings
                                            </SettingHeader>
                                            <DualSection>
                                                <Section>
                                                    <Field>

                                                        <FieldName>Invite User By Email</FieldName>
                                                        {!user.verified && 
                                                            <Description>
                                                                You must verify your email before adding people to this workspace.
                                                            </Description>
                                                        }
                                                        <InviteContainer active = {user.verified ? true : false}>
                                                            <FieldInput 
                                                                ref = {node => this.invite = node}>
                                                            </FieldInput>
                                                            <InviteButton 
                                                                active = {user.verified ? true : false}
                                                                onClick = {() => {
                                                                    if (user.verified) {
                                                                        this.sendInvite();
                                                                    } else {
                                                                        alert("Please verify your email before sending invites.");
                                                                    }
                                                                }}>
                                                                <FiPlus/>
                                                            </InviteButton>
                                                        </InviteContainer>
                                                    </Field>
                                                    <Field>
                                                        <FieldName2>Team</FieldName2>
                                                        {
                                                            memberUsers.map(memberUser => {
                                                                return (
                                                                    <MemberContainer>
                                                                        <Creator>{memberUser.firstName.charAt(0)}</Creator>
                                                                        <Name >{`${memberUser.firstName} ${memberUser.lastName}`}</Name>
                                                                    </MemberContainer>
                                                                )
                                                            })
                                                        }
                                                    </Field>
                                                    <Field>
                                                        <FieldName2>Delete Workspace</FieldName2>
                                                        <WorkspaceDeletionButton onClick = {this.deleteWorkspace}>
                                                            <FiTrash style = {{color: "#ff4757", marginRight: "1rem", fontSize: "2rem"}}/>
                                                            Delete Workspace Permanently
                                                        </WorkspaceDeletionButton>
                                                    </Field>
                                                </Section>
                                            </DualSection>
                                        </Block>
                                    }
                                    <Block>
                                        <SettingHeader>
                                            User Settings
                                        </SettingHeader>
                                        <DualSection>
                                            <Section>
                                                <Field>
                                                    <FieldName>First Name</FieldName>
                                                    <FieldInput 
                                                        defaultValue = {user.firstName}
                                                        ref = {node => this.firstName = node}
                                                    />
                                                </Field>
                                                <Field>
                                                    <FieldName>Last Name</FieldName>
                                                    <FieldInput
                                                        defaultValue = {user.lastName}
                                                        ref = {node => this.lastName = node}
                                                    />
                                                </Field>
                                                <Field>
                                                    <FieldName>Primary Email</FieldName>
                                                    <FieldInput
                                                        defaultValue = {user.email}
                                                        ref = {node => this.email = node}
                                                    />
                                                </Field>
                                                <Field>
                                                    <FieldName>Bio</FieldName>
                                                    <FieldTextArea
                                                        defaultValue = {user.bio}
                                                        ref = {node => this.bio = node}
                                                    />
                                                </Field>
                                                <Field>
                                                    <FieldName>Position</FieldName>
                                                    <FieldInput
                                                        defaultValue = {user.position}
                                                        ref = {node => this.position = node}
                                                    />
                                                </Field>
                                                <Field>
                                                    <FieldName>Organization</FieldName>
                                                    <FieldInput
                                                        defaultValue = {user.organization}
                                                        ref = {node => this.org = node}
                                                    />
                                                </Field>
                                            </Section>
                                        </DualSection>
                                        <Bottom>
                                            <SaveButton onClick = {() => this.saveUserSettings()}>
                                                Save User Settings
                                            </SaveButton>
                                        </Bottom>
                                    </Block>
                                
                                </Content>
                            </SubContainer>
                        </Container>
                }
            </>
        )
    }
}

const mapStateToProps = (state, ownProps) => {

    const { workspaces, auth: {user}} = state;
    const { workspaceId } = ownProps.match.params;
    const workspace = workspaces[workspaceId]

    let memberUsers;

    if (workspace) memberUsers = Object.values(workspace.memberUsers);

    return {
        user,
        workspace,
        memberUsers
    }
}

export default withRouter(connect(mapStateToProps, {editUser, sendInvite, deleteWorkspace})(UserSettings));

const WorkspaceDeletionButton = styled.div`
    color: #172a4e;
    font-size: 1.5rem;
    height: 4rem;
    padding: 0rem 1rem;
    border: 1px solid #ff4757;
    background-color: ${chroma('#ff4757').alpha(0.2)};
    display: inline-flex;
    align-items: center;
    font-weight: 500;
    border-radius: 0.4rem;
    cursor: pointer;
    &:hover {
        background-color: ${chroma('#ff4757').alpha(0.4)};
    }

`

const Description = styled.div`
    color: #172a4e;
    font-size: 1.5rem;
    font-weight: 400;
    margin-bottom: 1.3rem;
    height: 2rem;
    opacity: 0.5;
`


const Name = styled.div`
    font-size: 1.3rem;
    width: 10rem;
    margin-right: 1rem;
    opacity: 1;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
	font-weight: 500;
    width: 10rem;
`

const Creator = styled.div`
    height: 2.5rem;
    width: 2.5rem;
    background-color: ${chroma('#1e90ff').alpha(0.2)};
    color:#1e90ff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.4rem;
    margin-top: -0.1rem;
    border-radius: 0.3rem;
    font-weight: 500;
    margin-right: 1rem;
`

const MemberContainer = styled.div`
    display: flex;
    align-items: center;
    height: 6rem;
    font-size: 1.3rem;
    background-color: white;
    padding: 2rem;
    border: 1px solid #E0e4e7;
    border-radius: 0.6rem;
    margin-bottom: 1.5rem;
    width: 22rem;
    
`

const Bottom = styled.div`
    background-color:#f7f9fb;
    min-height: 7.5rem;
    max-height: 7.5rem;
    padding-left: 4rem;
    padding-right: 4rem;
    align-items: center;
    display: flex;
    width: 100%;
    border-top: 1px solid #E0E4e7;
    border-bottom-left-radius: 0.3rem;
    border-bottom-right-radius: 0.3rem;
`

const SubContainer = styled.div`
    width: 100%;
    height: 100%;
    align-items: center;
    display: flex;
    flex-direction: column;
    margin-top: 4rem;
`   

const Header = styled.div`
    font-size: 1.1rem;
    font-weight: 400;
    display: inline-flex;
    border-bottom: 2px solid #172A4E;
    height: 2.8rem;
    padding-right: 3.5rem;
    display: flex;
    align-items: center;
`

const Top = styled.div`
    display: flex;
    align-items: center;
`

const Block = styled.div`
    &:first-of-type {
        margin-bottom: 3rem;
    }
    background-color: white;
    width: 75rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    border-radius: 0.4rem;
`

const Container = styled.div`
    width: 100%
    min-height: 100%;
    padding: 2.1rem;
    padding-bottom: 5rem;
    background-color: #f6f7f9;
`

const Menu = styled.div`
    width: 20rem;
    display: flex;
    flex-direction: column;
`

const Content = styled.div`
    
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
    height: 7rem;
    display: flex;
    align-items: center;
    font-size: 1.8rem;
    font-weight:600;
    color: white;
    margin-bottom: 1.5rem;
    background-color: #373a49;
    padding: 0rem 4rem;
    border-top-left-radius: 0.4rem;
    border-top-right-radius: 0.4rem;
`

const DualSection = styled.div`
    display: flex;
    justify-content: center;
    padding: 1.5rem 4rem;
`

const Section = styled.div`
    display: flex;
    flex-direction:column;
    padding-top: 2rem;
    padding-bottom: 2rem;
    margin-left: ${props => props.marginLeft};
    width: 100%;
    
`

const FieldName = styled.div`
    font-size: 1.6rem;
    font-weight: 600;
    color: #172A4E;
    margin-bottom: 1rem;
`


const FieldName2 = styled.div`
    font-size: 1.6rem;
    font-weight: 600;
    color: #172A4E;
    margin-bottom: 1.3rem;
`

const Field = styled.div`
    margin-bottom: 2.5rem;
`

const InviteContainer = styled.div`
    width: 100%;
    display: flex;
    opacity: ${props => props.active ? 1 : 0.5};
`

const InviteButton = styled.div`
    background-color: #373a49;  
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 9rem;
    font-size: 1.8rem;
    border-top-right-radius: 0.3rem;
    border-bottom-right-radius: 0.3rem;
    cursor: pointer;
    &:hover {
        background-color: ${props => props.active ? "#4f5369" : ""};
    }
`

const FieldInput = styled.input`
    height: 3.5rem;
    border-radius: 0.3rem;
    border: 1px solid #E0E4E7;
    padding: 1rem;
    color: #172A4E;
    font-size: 1.5rem;
    font-weight: 500;
    &:focus {
        background-color: white;
    }
    width: 100%;
    font-family: -apple-system,BlinkMacSystemFont, sans-serif;
`

const SaveButton = styled.div`
    background-color: white;
    margin-left: auto;
    border: 1px solid  #E0E4e7;
    display: inline-flex;
    font-size: 1.5rem;
    justify-content: center;
    align-items: center;
    padding: 1rem 2rem;
    border-radius: 0.4rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    font-weight: 500;
    cursor: pointer;
    &:hover {
        background-color: #f7f9fb;
    }
`

const FieldTextArea = styled.textarea`
    font-weight: 500;
    height: 7rem;
    border-radius: 0.3rem;
    border: 1px solid #E0E4E7;
    font-size: 1.5rem;
    color: #172A4E;
    padding: 1rem;
    resize: none;
    &:focus {
        background-color: white;
    }
    font-family: -apple-system,BlinkMacSystemFont, sans-serif;
    width: 100%;
`

const FieldButton = styled.div`
    height: 4rem;
    width: 17rem;
    border-radius: 0.5rem;
    border: 1px solid #19e5be;
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
    background-color: #19e5be;
    cursor: pointer;  
`