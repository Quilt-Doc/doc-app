import React from 'react';

//css


//misc
import { connect } from 'react-redux';

//styles
import styled from "styled-components"

//actions
import { retrieveChildren } from "../../actions/Folder_Actions"

//components
import { Icon } from 'antd'
import { Link } from 'react-router-dom';
import Folder from './Folder'

class Folder2 extends React.Component {

    constructor() {
        super();
        this.state = {
            children: [],
            open: false
        }
    }

    componentDidMount() {
        this.props.retrieveChildren(this.props.id).then(result => {
            this.setState({children: Object.values(result)})
        })
        /*
        this.props.retrieveChildren(this.props.id).then(result => {
            console.log("RESULTS BIGGER BOI");
            console.log(result);
            this.setState({labels: result})
        })
        */
        //console.log(Object.values(this.props.retrieveChildren(this.props.id)))
        //this.setState({children: Object.values(this.props.retrieveChildren(this.props.id))})
    }



    renderFolders() {
        if (this.state.open) {
            return this.state.children.map((folder) => {
                return (
                    <Folder marginLeft = {this.props.marginLeft + 0.5} key = {folder._id} id = {folder._id} title = {folder.title}/>
                )
            })
        }
    }

    openFolder = () => {
        this.setState(prevState => ({open: !prevState.open}));
    }
    

    render() {
        console.log(this.props.marginLeft)
        return (
            <>
                <FolderContainer onClick = {() => {}} >
                    <FolderTitle marginLeft = {`${this.props.marginLeft}rem`}>
                        {this.props.title}
                    </FolderTitle>
                    <StyledIcon type="down" onClick = {this.openFolder}/>
                </FolderContainer>
                {this.renderFolders()}
            </>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        folders: state.folders
    }
}

export default connect(mapStateToProps, { retrieveChildren })(Folder2);



const FolderContainer = styled.div`
    height: 1.5rem;
    display: flex;
    align-items: center;
    padding: 0.5rem;
`

const FolderTitle = styled.div`
    font-size: 0.6rem;
    margin-left: ${props => props.marginLeft};
    color: #314659;
`



const StyledIcon = styled(Icon)`
    font-size: 0.5rem !important;
    margin-left: auto;
`