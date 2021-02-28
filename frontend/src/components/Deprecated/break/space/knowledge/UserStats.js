import React, { Component } from 'react';

//actions
import { retrieveUserStats } from '../../../actions/UserStats_Actions';

//styles
import styled from 'styled-components';
import chroma from 'chroma-js';

//connect
import { connect } from 'react-redux';

//router
import { withRouter } from 'react-router-dom';

//icons
import { IoMdBook } from 'react-icons/io';

class UserStats extends Component {
    constructor(props){
        super(props);
        this.state = {
            userStats: [],
            loaded: false
        }
    }

    componentDidMount = async () => {
        const { retrieveUserStats, match } = this.props;
        const { workspaceId } = match.params;

        const userStats = await retrieveUserStats({workspaceId});
        this.setState({userStats, loaded: true});
        console.log("USER STATS", userStats);
    }


    selectColor = (index) => {
        let colors = ['#5352ed', '#ff4757', '#20bf6b','#1e90ff', '#ff6348', 
            '#e84393', '#1e3799', '#b71540', '#079992'];
    
        return index < colors.length ? colors[index] : 
            colors[index - Math.floor(index/colors.length) * colors.length];
    }

    renderUserStats = () => {
        const { userStats } = this.state;
        const { workspace: { memberUsers } } = this.props;
        return userStats.map(stat => {
            const { documentsCreatedNum, documentsBrokenNum, user } = stat;

            let color = "#6762df";
            let letter = "F"
            memberUsers.map((memberUser, i) => {
                if (user._id === memberUser._id) {
                    color = this.selectColor(i)
                    letter = memberUser.firstName.charAt(0);
                }
            })

            return (
                <Stat>
                    <Creator color = {color}>{letter}</Creator>
                    <IndStat>Has created {documentsCreatedNum} Docs</IndStat>
                    <IndStat>Needs to fix {documentsBrokenNum} Docs</IndStat>
                </Stat>
            )
        })
    }

    render(){
        const { workspace } = this.props;
        return (
            <Container>
                <Header>
                    <IconBorder>
                        <IoMdBook/>
                    </IconBorder>
                    {`${workspace.name} Knowledge`}
                </Header>
                <StatsContainer>
                    {this.renderUserStats()}
                </StatsContainer>
            </Container>
        )
    }
}

const mapStateToProps = (state, ownProps) => {
    const { workspaces } = state;
    const { workspaceId } = ownProps.match.params;

    const workspace = workspaces[workspaceId];

    return {
        workspace
    }
}

export default withRouter(connect(mapStateToProps, { retrieveUserStats })(UserStats));

const Colored = styled.b`
    margin-left: 0.5rem;
    margin-right: 0.5rem;
    font-weight: 500;
    font-size: 1.7rem;
    color: ${props => props.color};
`

const Stat = styled.div`
    display: flex;
    align-items: center;
    &:last-of-type {
        margin-bottom: 0rem;
    }
    margin-bottom: 2rem;
`

const IndStat = styled.div`
    margin-right: 1.5rem;
    font-size: 1.4rem;
    font-weight: 500;
    width: 25rem;
`

const Creator = styled.div`
    min-height: 3rem;
    min-width: 3rem;
    max-height: 3rem;
    max-width: 3rem;
   /* background-color: ${chroma('#1e90ff').alpha(0.2)};
    color:#1e90ff;*/
    background-color: ${props => chroma(props.color).alpha(0.2)};
    color: ${props => props.color};
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.6rem;
    margin-top: -0.1rem;
    border-radius: 0.3rem;
    font-weight: 500;
    margin-right: 3rem;
`

const Header = styled.div`
    font-size: 3rem;
    margin-bottom: 4rem;
    font-weight: 500;
    display: flex;
    align-items: center;
`

const IconBorder = styled.div`
    display: flex;
    align-items: center;
    margin-right: 1.5rem;
`


const StatsContainer = styled.div`
    width: 50rem;
    padding: 3rem;
    border-radius: 0.5rem;
    border: 1px solid ${chroma('#172A4e').alpha(0.2)};
`

const Container = styled.div`
    height: 100vh;
    overflow-y: scroll;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    z-index: 2;
    width: 100%;
    background-color: white;
    padding: 10rem;
`