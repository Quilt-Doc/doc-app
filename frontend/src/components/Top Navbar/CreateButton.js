import React from 'react';

//redux
import { connect } from 'react-redux';

//styles
import styled from 'styled-components';

//icons
import { RiPencilLine } from 'react-icons/ri';

//router
import {withRouter} from 'react-router-dom';
import history from '../../history';

//actions
import { createDocument } from '../../actions/Document_Actions';
import { setCreation } from '../../actions/UI_Actions';
import { clearSelected } from '../../actions/Selected_Actions';
import CreationModal from './CreationModal';
import { stubFalse } from 'lodash';

class CreateButton extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            open: false,
            loading: false
        }
    }

    createDocument = (e, details) =>  {
        e.stopPropagation()
        e.preventDefault()
        this.setState({loading: true})
        let path = history.location.pathname.split("/")
        let {tags, references, parent, repository} = details; 
        if (path.length > 2) {
            let workspaceId = path[2]
            this.props.createDocument({
                authorId: this.props.user._id,
                workspaceId,
                title: "",
                tagIds: tags.map(tag => tag._id), 
                parentId: parent ? parent._id : "",
                repository: repository ? repository._id : null,
                referenceIds: references.map(item => item._id)}
            ).then((documents) => {
                let document = documents.result[0]
                this.setState({loading: false, open: false})
                this.props.setCreation(true)
                history.push(`?document=${document._id}`)
                this.props.clearSelected()
            })
        }
    }



    render(){
        return(
            <>
                <NavbarElement onClick = {(e) => {this.setState({open: true})}} >
                    <RiPencilLine/>
                </NavbarElement>
                <CreationModal 
                    repository = {this.props.repository} 
                    selected = {this.props.selected} 
                    loading = {this.state.loading} 
                    createDocument = {(e, detail) => this.createDocument(e, detail)} 
                    closeModal = {() => this.setState({open: false})} 
                    open = {this.state.open}
                />
            </>
        )
    }
}

const mapStateToProps = (state, ownProps) => {
    let {repositoryId, workspaceId} = ownProps.match.params
    let repository;
    let path = history.location.pathname.split("/");
    if (state.workspaces[workspaceId] && path[3] === "repository"){
        if (path[4]){
           repository = state.workspaces[workspaceId].repositories.filter(repo => {return repo._id === path[4]})[0]
        }
    }
    return {
        user: state.auth.user,
        selected : Object.values(state.selected),
        repository
    }
}

export default withRouter(connect(mapStateToProps, {setCreation, clearSelected, createDocument})(CreateButton));


const NavbarElement = styled.div`
    font-size: 1.8rem;
    /*color: #172A4E;*/
    background-color: #292d38;
   
    height: 3.3rem;
    padding: 0 1rem;
    margin-right: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    &:hover {
        /*background-color:#39466f*/
    }
    color: white;
    border: 1px solid #70EAE1;
    border-radius: 0.3rem;
    cursor: pointer;
`
