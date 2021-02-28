import React, { Component } from 'react';

//actions
import { retrieveChecks } from '../../actions/Check_Actions';

//react-redux
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

//components
import CheckCard from '../space/dashboard/checks/elements/CheckCard';

class ChecksLeftBar extends Component {

    constructor(props){
        super(props);
        this.state = {
            currentCheck: 
        }
    }

    componentDidMount = () => {
        const { retrieveChecks, match, workspace } = this.props;
        const { workspaceId } = match.props;
        retrieveChecks({workspaceId, repositoryId: workspace.repositories[0]._id});
    }

    renderChecks = () => {
        const { checks } = this.props;
        checks.map(check => {
            <CheckCard  check = {check}/>
        })
    }

    render(){
        return (
            <LeftBar>
                {this.renderChecks()}
            </LeftBar>
        )
    }
}


const mapStateToProps = (state, ownProps) => {
    const { workspaces, checks } = state;
    const { workspaceId } = ownProps.match.params;

    const workspace = workspaces[workspaceId];

    return {
        checks,
        workspace
    }
}

export default withRouter(connect(mapStateTorProps, { retrieveChecks })(ChecksLeftBar));


/*  <LeftBar>
                    <Check>
                        <Status>
                            <IoMdCheckmarkCircleOutline/>
                        </Status>
                        <CheckContent>
                            <Commit>
                                    <FiGitCommit
                                        style = {{
                                            fontSize: "1.2rem",
                                            marginTop: "0.1rem",
                                            marginRight: "0.2rem",
                                        }}
                                    />
                                    b30e5c3
                            </Commit>
                            <Title>Reporting pushed</Title>
                            <Detail>
                                <Bottom>
                                    <Creator>F</Creator>
                                    <CreationDate> 
                                        <AiOutlineClockCircle
                                            style = {{marginTop: "0.08rem", marginRight: "0.5rem"}}
                                        />
                                        August 12, 2015
                                    </CreationDate>
                                </Bottom>
                            </Detail>
                        </CheckContent>
                    </Check>
                    <Check>
                        <Status>
                            <IoMdCheckmarkCircleOutline/>
                        </Status>
                        <CheckContent>
                            <Commit>
                                    <FiGitCommit
                                        style = {{
                                            fontSize: "1.2rem",
                                            marginTop: "0.1rem",
                                            marginRight: "0.2rem",
                                        }}
                                    />
                                    b30e5c3
                            </Commit>
                            <Title>Reporting pushed</Title>
                            <Detail>
                                <Bottom>
                                    <Creator>F</Creator>
                                    <CreationDate> 
                                        <AiOutlineClockCircle
                                            style = {{marginTop: "0.08rem", marginRight: "0.5rem"}}
                                        />
                                        August 12, 2015
                                    </CreationDate>
                                </Bottom>
                            </Detail>
                        </CheckContent>
                    </Check>
                </LeftBar>*/