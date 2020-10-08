import React, {Component} from 'react';

//styles
import styled from 'styled-components';

//components
import CheckCard from './elements/CheckCard';
import CheckRightContent from './elements/CheckRightContent'

//actions
import { retrieveChecks } from '../../../../actions/Check_Actions';

//react-redux
import { connect } from 'react-redux';

//router
import { withRouter } from 'react-router-dom';

// component that retrieve pull requests from version control
// and keeps track of doc/reference updating and deprecation with regard to the request
class Checks extends Component {
    constructor(props){
        super(props);
        this.state = {
            currentCheck: null,
            loaded: false
        }
    }

    componentDidMount = async () => {
        const { retrieveChecks, match, workspace } = this.props;
        const { workspaceId } = match.params;

        await retrieveChecks({ workspaceId, repositoryId: workspace.repositories[0]._id });

        const { checks } = this.props;
        const currentCheck = checks.length > 0 ? checks[0] : null;
        this.setState({ loaded: true, currentCheck});
    }

    renderChecks = () => {
        const { checks } = this.props;
        const { currentCheck } = this.state;
        return checks.map(check => {
            return <CheckCard 
                active = {currentCheck._id === check._id} 
                setCheck = {() => this.setState({currentCheck: check})} 
                check = {check}
            />
        })
    }

    render(){
        const { currentCheck } = this.state;
        return(
            <Container>
                <Header>
                    Git Checks
                </Header>
                <BodyContainer>
                    {currentCheck ? 
                        <>
                            <LeftBar>
                                { this.renderChecks() }
                            </LeftBar> 
                            <CheckRightContent check = {currentCheck}/>
                        </>
                        :
                        <Centered>
                            <Message>Push code to your repository to see checks</Message>
                        </Centered>
                    }
                </BodyContainer>
            </Container>
        )
    }    
}


const mapStateToProps = (state, ownProps) => {
    const { workspaces, checks } = state;
    const { workspaceId } = ownProps.match.params;

    const workspace = workspaces[workspaceId];

    return {
        checks: Object.values(checks),
        workspace
    }
}

export default withRouter(connect(mapStateToProps, { retrieveChecks })(Checks));

const Message = styled.div`
    opacity: 0.5;
    font-size: 1.4rem;
    font-weight: 500;
`

const Centered = styled.div`
    height: 100%;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
`

const LeftBar = styled.div`
    width: 50rem;
    min-height: 100%;
    overflow-y: scroll;
    background-color: white;
    border-right: 1px solid #E0E4E7;
    padding: 2rem;
    border-top-left-radius: 0.5rem;
    border-bottom-left-radius: 0.5rem;
`

const Header = styled.div`
    height: 4.5rem;
    display: flex;
    align-items: center;
    font-size: 1.7rem;
    font-weight: 500;
    margin-bottom: 1rem;
`

const Container = styled.div`
    display: flex;
    flex-direction: column;
    z-index: 1;
    /*
    padding-left: 4rem;
    padding-right: 4rem;
    */
    margin-top: 1.5rem;
`

const BodyContainer = styled.div`
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    background-color: #f7f9fb;
    border-radius: 0.5rem;
    min-height: 45rem;
    display: flex;
    height: 60vh;
`