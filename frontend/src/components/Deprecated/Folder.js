import React from 'react';

//css
import 'antd/dist/antd.css';

//misc
import { connect } from 'react-redux';
import { Field, reduxForm } from 'redux-form';
import { withRouter } from 'react-router';

//styles
import styled from "styled-components"

//actions
import { retrieveChildren, createFolder } from "../../actions/Folder_Actions"

//components
import { Modal, Icon, Dropdown, Menu } from 'antd'
import { Link } from 'react-router-dom';
import Folder2 from './Folder2';

class Folder extends React.Component {

    constructor() {
        super();
        this.state = {
            children: [],
            open: false,
            modalVisible: false,
            selected: false
        }
    }


    componentDidMount() {
        /*
        const { match: { params } } = this.props;
        if (params.folderID = this.props.id) {
            this.setState({selected: true})
        }
        */
    }



    renderFolders() {
        if (this.state.open) {
            return this.state.children.map((folder) => {
                return (
                    <Folder2 marginLeft = {this.props.marginLeft + 0.5} key = {folder._id} id = {folder._id} title = {folder.title}/>
                )
            })
        }
    }

    openFolder = () => {
        this.props.retrieveChildren(this.props.id).then(result => {
            this.setState({children: Object.values(result)})
            this.setState({open: true});
        })
    }

    triggerFolder = (e) => {
        e.stopPropagation()
        e.preventDefault()
        this.props.retrieveChildren(this.props.id).then(result => {
            this.setState({children: Object.values(result)})
            this.setState(prevState => ({open: !prevState.open}));
        })
    }
      
    handleMenuClick(e){
        if (e.key === 1) {
            this.setState({
                modalVisible: true,
            });
        }
    }
    menu = (
        <Menu onClick={(e) => {this.handleMenuClick(e)}}>
            <Menu.Item key="1">
                Create Folder
            </Menu.Item>
            <Menu.Item key="2">
                Delete Folder
            </Menu.Item>
        </Menu>
    );


    closeModal = () => {
        this.setState({
            modalVisible: false,
        });
    }


    onSubmit = (formValues) => {
        this.props.createFolder({parentID: this.props.id, ...formValues}).then(() => {
            this.openFolder()
            this.setState({modalVisible: false})
        })
        //this.props.createPost(this.props.match.params.productID, formValues);
    }

    renderInput = ({input, label, meta, marginTop, placeholder}) => {
        return(
            <InputContainer marginTop = {`${marginTop}`}>
                <InputHeader>{label}</InputHeader>
                <StyledInput {...input}/>
            </InputContainer>
        )
    }

    renderForm = () => {
        return(
            <form onSubmit = {this.props.handleSubmit(this.onSubmit)}>
                <Field marginTop = "2rem" name = "title" component = {this.renderInput} label = "Title" />
                <Field marginTop = "0.5rem" name = "description" component = {this.renderInput} label = "Description" />
                <Button width = "3rem" marginTop = "1rem" marginLeft = "2rem" height = "3rem">Submit</Button>
            </form>
        )
    }

    renderBody(){
        return(
            <>
                <CreateHeader>Create a folder</CreateHeader>
                {this.renderForm()}
            </>
        )
    }


    render() {
        return (
            <>
                <StyledLink to = {`/${this.props.match.params.workspaceID}/folders/${this.props.id}`}>
                    <FolderContainer onClick = {() => {}} >
                        <FolderTitle marginLeft = {`${this.props.marginLeft}rem`}>
                            {this.props.title}
                        </FolderTitle>
                        <FolderOptions>
                            <Dropdown overlay={this.menu} trigger={['click']}>
                                <StyledEllipsis type="ellipsis" />
                            </Dropdown>
                            <StyledDown type = "down" onClick = {this.triggerFolder} />
                        </FolderOptions>
                    </FolderContainer>
                </StyledLink>
                {this.renderFolders()}
                <Modal
                    visible={this.state.modalVisible}
                    onOk={() => {}}
                    onCancel={this.closeModal}
                    footer={[]}
                >
                    {this.renderBody()}
                </Modal>
            </>
        );
    }
}

/*
 <Modal
                    title="Create a folder"
                    visible={this.state.visible}
                    onOk={this.handleOk}
                    onCancel={this.handleCancel}
                ></Modal>
<Dropdown overlay={menu}>
      <Icon type="down" />
    </Dropdown>
*/

const mapStateToProps = (state) => {
    return {
        folders: state.folders
    }
}

export default withRouter(reduxForm({
    form: 'create_folder_form'
})(connect(mapStateToProps, { retrieveChildren, createFolder })(Folder)));

/*

renderError({ error, touched }) {
        if (touched && error) {
            return (
                <div className = "ui error message">
                    <div className = "header">{error}</div>
                </div>
            )
        }
    }
*/

const FolderContainer = styled.div`
    height: 1.5rem;
    display: flex;
    align-items: center;
    padding: 0.5rem;

    :hover {
        cursor: pointer;
        background-color: #F2F8FF;
    }
`

const FolderTitle = styled.div`
    font-size: 0.6rem;
    margin-left: ${props => props.marginLeft};
    color: #314659;
`

const FolderOptions = styled.div`
    display: flex;
    justify-content: flex-end;
    margin-left: auto;
`

const StyledEllipsis = styled(Icon)`
    margin-right: 1rem;
    font-size: 1rem;
    margin-top: 0.1rem;
    color: #E6E6E6;
    :hover {
        color: black;
    }
`

const StyledDown = styled(Icon)`
    font-size: 0.5rem !important;
    margin-left: auto;
    align-self: center;
`

const CreateHeader = styled.div`
    font-size: 1.5rem;
    margin-left: 1.5rem;
    margin-top: 1rem;
    color:  #172B4D;
    font-weight: 600;
`


const StyledInput = styled.input`
    font-size: 1rem;
    width: 10rem;
    height: 0.2rem;
    border: #DADCE0 solid 0.2rem;
    padding: 1rem;
    padding-left: 0.5rem;
    border-radius: 0.5rem;

    :focus {
        border: solid 0.2rem #3c40c6;
        outline: none;
    }
`

const InputContainer = styled.div`
    font-size: 2rem;
    margin-left: 1.5rem;
    margin-top: ${props => props.marginTop};
    font-weight: 600;
`

const InputHeader = styled.div`
    font-size: 0.5rem;
    font-weight: 600;
`

const Button = styled.button`
    background-color:#3c40c6;
    color: white;
    margin-left: ${props => props.marginLeft};
    margin-top: ${props => props.marginTop};
    width: ${props => props.width};
    height: ${props => props.height};
    font-size: 0.5rem;
    border: none;
    border-radius: 0.3rem;
    cursor: pointer;

    :hover {
        background-color:#575fcf;
    }
    :focus {
        outline: 0;
        box-shadow: none!important;
    }
`

const StyledLink = styled(Link)`
    text-decoration: none;
    color: black; 
`