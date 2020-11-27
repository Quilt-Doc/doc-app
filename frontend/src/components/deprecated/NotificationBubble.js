import React from 'react';

//styles
import styled from 'styled-components';

//icons
import { AiOutlineRight, AiOutlineLeft, AiFillCloseCircle, AiOutlineClockCircle } from 'react-icons/ai';
import { BsFillPersonPlusFill, BsFillPersonDashFill } from 'react-icons/bs';
import { RiPencilLine } from 'react-icons/ri';

//animation
import { CSSTransition } from 'react-transition-group';

//redux
import { connect } from 'react-redux';

//router
import { withRouter } from 'react-router-dom';

//actions
import { retrieveNotifications } from '../../actions/Notification_Actions';

class NotificationBubble extends React.Component {

/*1. Push has invalidated User's Documents/Snippets
2. User has pushed code and added new References to be documented.
3. User invited to a Workspace
4. User removed from a Workspace*/
/*
    componentDidMount = async () => {
        
    }
*/

    componentDidMount = () => {
        const { retrieveNotifications, user: { _id }, match } = this.props;
        const { workspaceId } = match.params;

        console.log("NOTIFICATIONS ABOUT TO CALL");
        retrieveNotifications({userId: _id, workspaceId});
       

        document.addEventListener('mousedown', this.handleClickOutside, false);
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
                        <Buttons>
                            <Button>
                                <AiOutlineLeft/>
                            </Button>
                            <Button>
                                <AiOutlineRight/>
                            </Button>
                        </Buttons>
                    </Header>
                    <Notification>
                        <Icon color = {'#ff4757'}>
                            <AiFillCloseCircle/>
                        </Icon>
                        <Body>
                            <Content>A push has invalidated some of your documents and snippets.</Content>
                            <CreationDate> 
                                <AiOutlineClockCircle
                                    style = {{marginTop: "0.08rem", marginRight: "0.5rem"}}
                                />
                                {"October 10, 2020"}
                            </CreationDate>
                        </Body>
                    </Notification>
                    <Notification>
                        <Icon color = {'#6762df'}>
                            <RiPencilLine/>
                        </Icon>
                        <Body>
                            <Content>5 references from your recent push are ready to be documented.</Content>
                        </Body>
                    </Notification>
                    <Notification>
                        <Icon color = {'#19e5be'}>
                            <BsFillPersonPlusFill/>
                        </Icon>
                        <Body>
                            <Content>John joined your Pegasus workspace.</Content>
                        </Body>
                    </Notification>
                    <Notification>
                        <Icon color = {'#ff4757'}>
                            <BsFillPersonDashFill/>
                        </Icon>
                        <Body>
                            <Content>John joined your Pegasus workspace.</Content>
                        </Body>
                    </Notification>
                    {/*
                    <Notification>
                        <Color color = {'#ff4757'}>

                        </Color>
                        <Body>
                            A push has invalidated some of your documents and snippets.
                        </Body>
                    </Notification>*/}
                </Container>
            </CSSTransition>
        )
    }
}

export default withRouter(connect(mapStateToProps, { retrieveNotifications })(NotificationBubble));

const CreationDate = styled.div`
    display: inline-flex;
    align-items: center;
    height: 2.3rem;
    font-weight:500;
    border-radius: 0.3rem;
    color: #172A4e;
    opacity: 0.7;
    font-size: 1.2rem;
    margin-top: 0.5rem;
`

const Icon = styled.div`
    color: ${props => props.color};
    font-size: 3rem;
    margin-right: 2rem;
`   

const Container = styled.div`
    min-height: 40rem;
    background-color: white;
    box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px, rgba(9, 30, 66, 0.25) 0px 4px 8px -2px;
    border-radius: 0.7rem;
    position: absolute;
    z-index: 3;
    width: 40rem;
    padding: 2rem;
    color: #172A4E;
    bottom: ${props => props.bottom};
    left: 5rem;
`

const Notification = styled.div`
    width: 100%;
    border-radius: 0.5rem;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    display: flex;
    line-height: 1.5;
    background-color: #f7f9fb;
    border: 1px solid #E0E4E7;
`

const Body = styled.div`
    display: flex;
    flex-direction: column;
`


const Content = styled.div`
    font-size: 1.4rem;
    font-weight: 500;
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
    
`