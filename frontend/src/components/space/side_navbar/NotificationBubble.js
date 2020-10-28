import React from 'react';

//styles
import styled from 'styled-components';
import chroma from 'chroma-js';

//icons
import { AiOutlineTool, AiOutlineUserAdd, AiOutlineUserDelete } from 'react-icons/ai';
import { RiPencilLine } from 'react-icons/ri';

//animation
import { CSSTransition } from 'react-transition-group';

//redux
import { connect } from 'react-redux';

//router
import { withRouter } from 'react-router-dom';

//actions
import { retrieveNotifications } from '../../../actions/Notification_Actions';


class NotificationBubble extends React.Component {

/*1. Push has invalidated User's Documents/Snippets
2. User has pushed code and added new References to be documented.
3. User invited to a Workspace
4. User removed from a Workspace*/
/*
    componentDidMount = async () => {
        
    }
*/

    componentDidMount = async () => {
        const { retrieveNotifications, user: { _id }, match } = this.props;
        const { workspaceId } = match.params;

        
        let notifications = await retrieveNotifications({userId: _id, workspaceId});
        console.log("NOTIFICATIONS", notifications);

        document.addEventListener('mousedown', this.handleClickOutside, false);
    }

    componentDidUpdate = async (prevProps) => {
        const { notificationsOpen } = this.props;

        if (prevProps.notificationsOpen && prevProps.notificationsOpen !== notificationsOpen) {
            console.log("ENTERED HERE");
            const { retrieveNotifications, user: { _id }, match } = this.props;
            const { workspaceId } = match.params;

            
            let notifications = await retrieveNotifications({userId: _id, workspaceId});
            console.log("NOTIFICATIONS", notifications);

            document.addEventListener('mousedown', this.handleClickOutside, false);
        }
    }

    componentWillUnmount = () => {
        document.removeEventListener('mousedown', this.handleClickOutside, false);
    }

    handleClickOutside = (event) => {
        const { closeBubble } = this.props;

        if (this.node && !this.node.contains(event.target)) {
            closeBubble();
        }
    }

    renderNotifications = () => {
        return (
            <div></div>
        )
    }


    render(){

        const { notificationsOpen } = this.props;

        let bottom = "0rem";
        const notiButton = document.getElementById("notificationsBorder");
       

        if (notiButton) {
            bottom = `calc(100vh - ${notiButton.getBoundingClientRect().top}px)`;
        }
       
        return(
            <CSSTransition
                in={notificationsOpen}
                unmountOnExit
                enter = {true}
                exit = {true}
                timeout={150}
                classNames="dropMenuOpposite"
            >
                <Container ref = { node => this.node = node } bottom = {bottom}>
                    <Header>
                        Notifications
                        <Count>8 Unread</Count>
                    </Header>
                    <Notification>
                        <Icon color = {'#ff4757'}>
                            <AiOutlineTool/>
                        </Icon>
                        <Body>
                            <Title>Deprecation</Title>
                            <Content>A push has invalidated some of your documents and snippets.</Content>
                            <CreationDate> 
                                
                                {"October 10, 2020"}
                            </CreationDate>
                        </Body>
                        <Circle><Dot/></Circle>
                    </Notification>
                    <Notification>
                        <Icon >
                            <RiPencilLine/>
                        </Icon>
                        <Body>
                            <Title>Creation</Title>
                            <Content>5 references from your recent push are ready to be documented.</Content>
                            <CreationDate> 
                                {"October 10, 2020"}
                            </CreationDate>
                        </Body>
                        <Circle><Dot/></Circle>
                    </Notification>
                      <Notification>
                        <Icon >
                            <RiPencilLine/>
                        </Icon>
                        <Body>
                            <Title>Creation</Title>
                            <Content>5 references from your recent push are ready to be documented.</Content>
                            <CreationDate> 
                                {"October 10, 2020"}
                            </CreationDate>
                        </Body>
                        <Circle><Dot/></Circle>
                    </Notification>
                    <Notification>
                        <Icon color = {'#19e5be'}>
                            <AiOutlineUserAdd/>
                        </Icon>
                        <Body>
                            <Title>Team</Title>
                            <Content>John joined your Pegasus workspace.</Content>
                            <CreationDate> 
                                {"October 10, 2020"}
                            </CreationDate>
                        </Body>
                        <Circle><Dot/></Circle>
                    </Notification>
                    <Notification>
                        <Icon color = {'#ff4757'}>
                            <AiOutlineUserDelete/>
                        </Icon>
                        <Body>
                            <Title>Team</Title>
                            <Content>John was removed from Pegasus workspace.</Content>
                            <CreationDate> 
                                {"October 10, 2020"}
                            </CreationDate>
                        </Body>
                        <Circle><Dot/></Circle>
                    </Notification>
                </Container>
            </CSSTransition>
        )
    }
}

const mapStateToProps = (state) => {
    const { auth: { user }} = state;

    return {
        user
    }
}

export default withRouter(connect(mapStateToProps, { retrieveNotifications })(NotificationBubble));

const Title = styled.div`
    text-transform: uppercase;
    margin-bottom: 1rem;
    font-size: 1.3rem;
    font-weight: 500;
    opacity: 0.4;
`
const Count = styled.div`
    padding: 0.6rem 1.2rem;
    background-color: ${chroma('#6762df').alpha(0.2)};
    margin-left: auto;
    border-radius: 1rem;
    font-size: 1.3rem;
`

const CreationDate = styled.div`
    display: inline-flex;
    align-items: center;
    height: 2.3rem;
    font-weight:400;
    border-radius: 0.3rem;
    color: #172A4e;
    opacity: 0.7;
    font-size: 1.3rem;
    margin-top: 0.5rem;
`

const Icon = styled.div`
    color: ${props => props.color};
    font-size: 3rem;
    margin-right: 2rem;
    opacity: 0.7;
`   

const Container = styled.div`
    min-height: 73vh;
    max-height: 73vh;
    background-color: white;
    box-shadow: 0 2px 2px 2px rgba(60,64,67,.15);
    border-radius: 0.4rem;
    position: absolute;
    z-index: 3;
    width: 40rem;
    color: #172A4E;
    bottom: ${props => props.bottom};
    left: 5rem;
    overflow-y: scroll;
`

const Notification = styled.div`
    width: 100%;
    padding: 2rem 1.5rem;
    display: flex;
    align-items: center;
    line-height: 1.5;
    &:last-of-type {
        border-bottom: 1px solid #E0E4E7;
    }
    &:hover {
        background-color: ${chroma('#6762df').alpha(0.15)}
    }
    transition: background-color 0.15s;
    border-top: 1px solid #E0E4E7;

`

const Body = styled.div`
    display: flex;
    flex-direction: column;
    padding-left: 1rem;
    padding-right: 2rem;
`

const Circle = styled.div`
    min-width: 3rem;
    min-height: 5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: auto;
`

const Dot = styled.div`
    border-radius: 50%;
    height: 1rem;
    width: 1rem;
    background-color: ${chroma('#6762df').alpha(0.7)};
`

const Content = styled.div`
    font-size: 1.5rem;
    font-weight: 400;
    line-height: 1.5;
    margin-bottom: 0.5rem;
`

const Buttons = styled.div`
    margin-left: auto;
    display: flex;
    align-items: center;
`

const Button = styled.div`
    height: 3.5rem;
    background-color: #f7f9fb;
    border: 1px solid #E0E4e7;
    width: 3.5rem;
    &:first-of-type {
        margin-right: 1rem;
    }
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.8rem;
`

const Header = styled.div`
    height: 4.5rem;
    display: flex;
    align-items: center;
    font-size: 1.7rem;
    font-weight: 600;
    margin-bottom: 1rem;
    /*
    padding-left: 4rem;
    padding-right: 4rem;
    */
    margin-top: 2rem;
    padding: 2rem;
`