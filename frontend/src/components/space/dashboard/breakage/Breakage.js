import React, {Component} from 'react';

//styles
import styled from 'styled-components';

//components
import BreakageCard from './BreakageCard2';
import BreakagePlaceholder from './BreakagePlaceholder';

//react-redux
import { connect } from 'react-redux';

//react-router
import { withRouter } from 'react-router-dom';

//actions
import { retrieveBrokenDocuments } from '../../../../actions/Document_Actions';
// component that shows which documents have been broken by deprecation

class Breakage extends Component {

    constructor(props){
        super(props);
        this.state = {
            loaded: false,
            broken: []
        }
    }

    componentDidMount = async () => {
        const { retrieveBrokenDocuments, match } = this.props;
        const { workspaceId } = match.params;

        const broken = await retrieveBrokenDocuments({workspaceId});
        this.setState({loaded: true, broken});
    }  
    
    renderBrokenCards = () => {
        const { broken } = this.state;
        const { workspace: {memberUsers} } = this.props;
        if (broken.length > 0) return broken.map(doc => {
            const { author } = doc;
            let color = 0;
            memberUsers.map((user, i) => {
                if (user._id === author._id) {
                    color = i;
                }
            })
            return <BreakageCard color = {color} doc = {doc}/>
        }
        );
        return null
    }

    render(){
        const { broken } = this.state;
        return(
            <BreakageContainer>
                <Header>  
                    Deprecation
                </Header>
                {this.renderBrokenCards()}
            </BreakageContainer>
        )
    }
}

const mapStateToProps = (state, ownProps) => {
    const { workspaces } = state;
    const { workspaceId } = ownProps.match.params

    return {
        workspace: workspaces[workspaceId]
    }
}

export default withRouter(connect(mapStateToProps, {retrieveBrokenDocuments})(Breakage));

const Message = styled.div`
    height: 7rem;
    opacity: 0.5;
    font-size: 1.4rem;
    font-weight: 500;
    display: flex;
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

const ListView = styled.div`
    display: flex;
    padding-bottom: 1rem;
    height: 100%;
    overflow-x: scroll;
    min-width: calc((100vw - 6rem - 32rem) * 0.925);
    /*
    width: calc(100vw - 32rem - 25rem);
    */
`

const BreakageContainer = styled.div`
    width: 100%;
    height: calc(85vh - 37vh - 3rem);
    display: flex;
    flex-direction: column;
    margin-top: 3rem;
    background-color: white;
    padding: 2rem;
    border-radius: 0.7rem;
    box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 5px 10px -5px;
`
