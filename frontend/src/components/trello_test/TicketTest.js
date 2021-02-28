import React, { useState, useMemo, useEffect } from 'react';

import styled from 'styled-components';

import { withRouter } from 'react-router-dom';

import { connect } from 'react-redux';

import { retrieveTickets } from '../../actions/Ticket_Actions';
import { MENU_SHADOW } from '../../styles/shadows';

const TicketTest = (props) => {
    const { user, match, retrieveTickets } = props;
    const { workspaceId } = match.params;

    const [tickets, setTickets] = useState(null);

    const retrieveTicketsWrapper = useMemo(() => async () => {
        const response = await retrieveTickets({workspaceId});
        const { result } = response;

        setTickets(result);
    }, [workspaceId, retrieveTickets]);

    useEffect(() => {
        if (!tickets) retrieveTicketsWrapper();
    }, [retrieveTicketsWrapper]);

    const renderCards = () => {
        if (tickets) {
            return tickets.map(ticket => {
                console.log(JSON.parse(ticket.associations));
                return (
                    <Card>
                        Associations
                        <Layer></Layer>
                        Card Data
                        <Layer>{ticket.relevant}</Layer>
                    </Card>
                )
            })
        }
    }

    return (
        <Container>
            {renderCards()}
        </Container>
    )
}



const mapStateToProps = (state) => {
    const { auth: {user} } = state;
    return {
        user
    }
}

export default withRouter(connect(mapStateToProps, { retrieveTickets })(TicketTest));

const Layer = styled.div`
    margin-bottom: 1rem;
    margin-top: 0.5rem;
    font-size: 1.4rem;
    line-height: 2;
`

const Card = styled.div`
    margin-bottom: 1rem;
    background-color: white;
    padding: 2rem;
    box-shadow: ${MENU_SHADOW};
    border-radius: 0.3rem;
    width: 50rem;
`

const Container = styled.div`
    height: 100vh;
    width: 100vw;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 10rem;
`

const Button = styled.div`
    display: flex;
    align-items: center;
    padding: 1rem;
    border: 1px solid #E0E4E7;
    background-color: white;
    cursor: pointer;
`