import React from 'react';

//styles
import styled from 'styled-components';
import chroma from 'chroma-js';

//loader
import { Oval } from 'svg-loaders-react';

//icons
import { AiOutlineTool, AiOutlineUserAdd, AiOutlineUserDelete } from 'react-icons/ai';
import { RiPencilLine } from 'react-icons/ri';
import { VscBell } from 'react-icons/vsc';

//animation
import { CSSTransition } from 'react-transition-group';

//infinite scroll
import InfiniteScroll from 'react-infinite-scroller';

//redux
import { connect } from 'react-redux';

//router
import { withRouter } from 'react-router-dom';

//actions
import { retrieveNotifications, setNotificationsHidden } from '../../../../actions/Notification_Actions';


class NotificationBubble extends React.Component {

    constructor(props) { 
        super(props);
        this.state = {
            hasMore: true,
            unread: 0,
            loaded: false
        }
    }

    componentDidMount = async () => {
        const { setNotificationsHidden, pendingNotifications, user: { _id }, match } = this.props;
        const { workspaceId } = match.params;

        this.setState({unread: pendingNotifications});

        setNotificationsHidden({userId: _id, workspaceId});
        await this.retrieveNotifications(0);

        this.setState({loaded: true});

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

    getDateItem = (created) => {
        let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        let item =  new Date(created)
        let dateString = `${months[item.getMonth()]} ${item.getDate()}, ${item.getFullYear()}`;
        return dateString
    }

    renderNotifications = () => {
        const { notifications } = this.props;
        
        const typeData = {
            invalid_knowledge: { 
                title: "Deprecation", 
                getContent: (notification) => {
                    const { check: { brokenDocuments, brokenSnippets }, repository: { fullName }} = notification;
                    return (
                        <>
                            {`A push to `}
                            <Weighted>{fullName}</Weighted>
                            {` has invalidated `}
                            <Weighted>{brokenDocuments.length}</Weighted>
                            {` of your documents and `}
                            <Weighted>{brokenSnippets.length}</Weighted>
                            {` of your snippets.`}
                        </>
                    )
                },
                icon:  <AiOutlineTool/>,
                color: '#ff4757'
            },

            to_document: {
                title: 'Creation',
                getContent:  (notification) => {
                    const { check: { addedReferences }, repository: { fullName }} = notification;
                    const word1 = addedReferences.length > 1 ? "references" : "reference";
                    const word2 = addedReferences.length > 1 ? "are" : "is";
                    return (
                        <>
                            <Weighted>{addedReferences.length}</Weighted>
                            {` ${word1} from your recent push to `}
                            <Weighted>{fullName}</Weighted>
                            {` ${word2} ready to be documented.`}
                        </>
                    )
                },
                icon: <RiPencilLine/>,
                color: '#172A4E'
            },

            added_workspace: {
                title: 'Team', 
                getContent: (notification) => {
                    const {user: {firstName, lastName}, workspace: { name }} = notification;
                    return (
                        <>
                            <Weighted>
                                {`${firstName} ${lastName}`}
                            </Weighted>
                            {` joined `}
                            <Weighted>
                                {name}
                            </Weighted>
                        </>
                    )
                },
                icon: <AiOutlineUserAdd/>,
                color: '#19e5be'
            },

            removed_workspace: {
                title: 'Team',
                getContent: (notification) => {
                    const {user: {firstName, lastName}, workspace: { name }} = notification;
                    return (
                        <>
                            <Weighted>
                                {`${firstName} ${lastName}`}
                            </Weighted>
                            {` was removed from `}
                            <Weighted>
                                {name}
                            </Weighted>
                        </>
                    )
                },
                icon:  <AiOutlineUserDelete/>,
                color: '#ff4757'
            }
        }
        
        return notifications.map(notification => {
            const { type, status, created, _id} = notification;

            const { title, getContent, icon, color } = typeData[type];

            const content = getContent(notification);

            return (
                <Notification key = {_id}>
                    <Icon color = {color}>
                        {icon}
                    </Icon>
                    <Body>
                        <Title>{title}</Title>
                        <Content>{content}</Content>
                        <CreationDate>    
                            {this.getDateItem(created)}
                        </CreationDate>
                    </Body>
                    <Circle>
                        {(status === "visible") && <Dot/>}
                    </Circle>
                </Notification>
            )
        })
    }

    retrieveNotifications = async (page) => {
        const { retrieveNotifications, match, user: { _id } } = this.props;
        const { workspaceId } = match.params;

        console.log("PAGE", page);
        //this.setState({ hasMore: null });

        const wipe = page === 0;
        const hasMore = await retrieveNotifications({ workspaceId, userId: _id, skip: page * 10, limit: 10}, wipe);

        this.setState({ hasMore })
    }


    renderLoader = () => {
        return (
            <LoaderContainer>
                <Oval stroke={'#E0E4E7'}/>
            </LoaderContainer>
        )
    }

    renderPlaceholder = () => {
        return (
            <Placeholder>
                <PlaceholderIcon>
                    <VscBell/>
                </PlaceholderIcon>
                <PlaceholderText>
                    You have no notifications.
                </PlaceholderText>
            </Placeholder>
        )
    }

    renderBody = () => {
        const { hasMore } = this.state;
        const { notifications } = this.props;

        return (
            <SubContainer >
                { notifications.length === 0 ? this.renderPlaceholder() :
                    <InfiniteScroll
                        pageStart={0}
                        loadMore={this.retrieveNotifications}
                        useWindow = {false}
                        hasMore={hasMore}
                        initialLoad = {false}
                        loader={this.renderLoader()}
                        threshold = {300}
                    >
                        {this.renderNotifications()}
                    </InfiniteScroll>
                }
            </SubContainer>
        )
    }

    render(){
        const { unread, loaded } = this.state;

        let bottom = "0rem";
        const notiButton = document.getElementById("notificationsBorder");
       

        if (notiButton) {
            bottom = `calc(100vh - ${notiButton.getBoundingClientRect().top}px)`;
        }
       
        return(
            <Container ref = { node => this.node = node } bottom = {bottom}>
                <Header>
                    Notifications
                    <Count unread = {unread}>{`${unread} Unread`}</Count>
                </Header>
                {loaded ? this.renderBody() : this.renderLoader()}
            </Container>
        )
    }
}

const mapStateToProps = (state) => {
    let { auth: { user }, notifications, ui: {pendingNotifications} } = state;

    return {
        user,
        notifications,
        pendingNotifications
    }
}

export default withRouter(connect(mapStateToProps, { retrieveNotifications, setNotificationsHidden })(NotificationBubble));

const Weighted = styled.b`
    font-weight: 500;
`

const Placeholder = styled.div`
    height: 50vh;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    opacity: 0.5;
`

const PlaceholderIcon = styled.div`
    font-size: 6rem;
    height: 5rem;
    width: 5rem;
    display: flex;
    justify-content: center;
    align-items: center;
`

const PlaceholderText = styled.div`
    margin-top: 1.5rem;
    font-size: 1.5rem;
    font-weight: 400;
    line-height: 1.5;
`

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
    opacity: ${props => props.unread === 0 ? 0 : 1};
    transition: 0.1s ease-in;
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

const SubContainer = styled.div`
    overflow-y: scroll;
    min-height: 55vh;
    max-height: 55vh;
    height: 55vh;
`

const Container = styled.div`
    background-color: white;
    box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px, rgba(9, 30, 66, 0.25) 0px 4px 8px -2px;
    border-radius: 0.4rem;
    position: absolute;
    z-index: 3;
    width: 40rem;
    color: #172A4E;
    bottom: ${props => props.bottom};
    left: 5rem;
`

const Notification = styled.div`
    width: 100%;
    padding: 2rem 1.5rem;
    display: flex;
    align-items: center;
    line-height: 1.5;
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

const LoaderContainer = styled.div`
    height: 15rem;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
`