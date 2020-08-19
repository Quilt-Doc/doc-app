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

class CreateButton extends React.Component {

    createDocumentFromButton = (e) =>  {
        e.stopPropagation()
        e.preventDefault()
        let path = history.location.pathname.split("/")
        if (path.length > 2) {
            let workspaceId = path[2]
            this.props.createDocument({authorId: this.props.user._id,
                workspaceId, parentId: "", title: "",
                referenceIds: this.props.selected.map(item => item._id)}).then((documents) => {
                console.log("CREATE DOCS", documents)
                let document = documents.result[0]
                this.props.setCreation(true)
                history.push(`?document=${document._id}`)
                this.props.clearSelected()
            })
        }
    }

    render(){
        return(
            <NavbarElement onClick = {(e) => {this.createDocumentFromButton(e)}} >
                <RiPencilLine/>
            </NavbarElement>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        user: state.auth.user,
        selected : Object.values(state.selected),
    }
}

export default withRouter(connect(mapStateToProps, {setCreation, clearSelected, createDocument})(CreateButton));


const NavbarElement = styled.div`
    font-size: 1.8rem;
    /*color: #172A4E;*/
    background-color: #414758;
   
    height: 3.2rem;
    padding: 0 1rem;
    margin-right: 1.5rem;
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
