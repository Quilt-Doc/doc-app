import React from 'react';

//styles
import styled from 'styled-components';
import { SECONDARY_COLOR } from '../../../styles/colors';

//router
import history from '../../../history';
import { withRouter } from 'react-router-dom';

//icons
import { RiPencilLine } from 'react-icons/ri';
import { FiPlus } from 'react-icons/fi';

//actions
import { createDocument } from '../../../actions/Document_Actions';
import { clearSelected } from '../../../actions/Selected_Actions';

//react-redux
import { connect } from 'react-redux';


//button to create a new document
class CreateButton extends React.Component {
    constructor(props){
        super(props);
    }

    createDocument = async (e) => {
        const { user, match, createDocument, clearSelected, selected, documents } = this.props;
        const { workspaceId } = match.params;

        console.log("ENTERED HERE");

        e.stopPropagation();
        e.preventDefault();

        const markup = JSON.stringify(
            [{
                type: 'title',
                children: [
                { text: '' },
                ],
            },
            {
                type: 'paragraph',
                children: [
                { text: '' },
                ],
            }]
        );

        let repositoryId = (selected && selected.length > 0) ? selected[0].repository._id : null;
        let referenceIds = selected.map(item => item._id);


        console.log("ABOUT TO CREATE DOC", {
            authorId: user._id,
            workspaceId,
            repositoryId,
            referenceIds,
            title: "",
            parentPath: "",
            markup
        })


        let affectedDocuments =  await createDocument({
            authorId: user._id,
            workspaceId,
            repositoryId,
            referenceIds,
            title: "",
            parentPath: "",
            markup
        });

        console.log("CREATED DOCS", affectedDocuments);
        if (affectedDocuments) {
            const { documents } = this.props;

            let doc = documents[affectedDocuments[0]._id];
                
            history.push(`?document=${doc._id}&edit=${true}`);
            clearSelected();
        }
    }

    render(){
        return(
            <>
                <NavbarIcon onClick = {this.createDocument} > 
                    <FiPlus/>
                </NavbarIcon>
            </>
        )
    }
}

const mapStateToProps = (state, ownProps) => {
    const { selected, auth: { user }, documents } = state;

    return {
        user,
        selected: Object.values(selected),
        documents
    }   
}
//history.push(`?create_document=true`)} >


export default withRouter(connect(mapStateToProps, {clearSelected, createDocument})(CreateButton));



const NavbarIcon = styled.div`
    border: 1px solid ${SECONDARY_COLOR};
    height: 4rem;
    width: 4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.7rem;
    cursor: pointer;
    font-size: 1.8rem;
    color: white;
    margin-left: 1.5rem;
    margin-bottom: 2rem;
    &:hover {
        background-color:#2b3345;
    }
    transition: background-color 0.05s ease-in;
`

/*
const NavbarIcon = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 5.5rem;
    width: 100%;
    font-size: 2.1rem;
    font-weight: 500;
    background-color:${props => props.active ? '#464c5d' : '#3b404f'};
    cursor: pointer;
    &:hover {
        background-color:#464c5d;
    }
    transition: background-color 0.1s ease-in;
    border-bottom: 1px solid #4f5569;
    border-radius: 0.3rem;
    margin-bottom: 2.5rem;
    color: white;
`*/