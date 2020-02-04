import React from 'react';

//css


//misc
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

//styles
import styled from "styled-components"

//actions
import { retrieveFolders } from "../actions/Folder_Actions"

//components
import { Icon } from 'antd'
import { Link } from 'react-router-dom';
import Folder from './Folder';

class Sidebar extends React.Component {

    componentDidMount() {
        const { match: { params } } = this.props;
        this.props.retrieveFolders(params.workspaceID, {root: true})
    }

    renderRoots() {
        console.log(this.props.folders)
        if (this.props.folders) {
            return this.props.folders.map(folder => {
                return  <Folder marginLeft = {1} key = {folder._id} id = {folder._id} title = {folder.title}/>
            })
        }
    }

    render() {
        return (
           <Menu>
               <DocHierarchy>
                    {this.renderRoots()}
               </DocHierarchy>
           </Menu>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        folders: Object.values(state.folders)
    }
}

export default withRouter(connect(mapStateToProps, { retrieveFolders })(Sidebar));

const Menu = styled.div`
    
    width: 13rem;
    height: 100vh;
    border-right: 0.1rem solid #e3e3e3;
    display: flex;
    flex-direction: column;
`

const DocHierarchy = styled.div`
    margin-top: 2rem;

`

