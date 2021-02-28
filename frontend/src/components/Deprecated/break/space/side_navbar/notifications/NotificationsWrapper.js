import React from 'react';

//animation
import { CSSTransition } from 'react-transition-group';

//components
import NotificationBubble from './NotificationBubble';

const NotificationsWrapper = (props) => {
    const { notificationsOpen } = props;

    return(
        <CSSTransition
            in={notificationsOpen}
            unmountOnExit
            enter = {true}
            exit = {true}
            timeout={150}
            classNames="dropMenuOpposite"
        >
            <NotificationBubble {...props}/>
        </CSSTransition>
    )
}

export default NotificationsWrapper;