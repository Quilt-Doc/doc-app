import React from 'react';

//styles 
import styled from "styled-components"

//images
import repo_icon1 from '../images/repo1.svg'
import repo_icon2 from '../images/repo2.svg'
import repo_icon3 from '../images/repo3.svg'
import repo_icon4 from '../images/repo4.svg'
import repo_icon5 from '../images/repo5.svg'
import repo_icon6 from '../images/repo6.svg'
import repo_icon7 from '../images/repo7.svg'
import repo_background from '../images/repo_background.svg'

//actions
import { createCodebase, retrieveCodebases } from '../actions/Codebase_Actions'
import { repoUpdateCommit } from '../actions/Repo_Actions'

//react-router
import { Link } from 'react-router-dom';

//misc
import { connect } from 'react-redux';

class Repository_Viewer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
           modal_display: 'none',
        }

        this.count = 0
        this.address_input = React.createRef();
        this.name_input = React.createRef();
    }

    componentDidMount() {
        this.props.retrieveCodebases()
    }

    renderLink(link) {
        console.log('LINK: ', link);
        let position = link.indexOf('github.com/');
        return `/codebase/directory/${link.slice(position + 11, link.length)}`
    }

    renderRepositories() {
        console.log("ENTERED HERE")
        console.log(this.props.codebases);
        let icons = [repo_icon1, repo_icon2, repo_icon3, repo_icon4, repo_icon5, repo_icon6, repo_icon7]

        let jsx_codebases = []
        this.props.codebases.map((codebase) => {
            jsx_codebases.push(
                <Link to = {this.renderLink(codebase.link)}><Repo_Box onClick = {() => {console.log(codebase.link)}}>
                    <Styled_Icon src = {icons[codebase.icon]}/>
                    {codebase.name}
                </Repo_Box></Link>
            )
        })

        this.count = jsx_codebases.length

        jsx_codebases.push( <Repo_Box opacity = {0.5} onClick = {() => this.setState({modal_display: ''})}>
                                <ion-icon style={{'font-size':'6rem', 'margin-bottom': '0.45rem'}} name="add-outline"></ion-icon>
                                Add New Repository
                            </Repo_Box>
        )
        
        let all_jsx = []
        for (let i = 0; i < jsx_codebases.length; i+= 3) {
            all_jsx.push(<Repo_Row>
                {jsx_codebases.slice(i, i + 3).map(jsx_codebase => {
                    return jsx_codebase
                })}
            </Repo_Row>)
        }
        
        return all_jsx
    }

    createRepository() {
        this.props.createCodebase({name: this.name_input.current.value, link: this.address_input.current.value, icon: this.count}).then((repo_data) => {
            this.props.repoUpdateCommit({ repo_id: repo_data[0], repo_link: repo_data[1]})
            this.clearModal()
        })

    }

    clearModal() {
        this.setState({modal_display: 'none'})
        this.name_input.current.value = "";
        this.address_input.current.value = "";
    }



    render() {
        if (this.props.codebases){
            return (
                <Container>
                    <Header>Repositories</Header>
                    <Repo_Container>
                        {this.renderRepositories()}
                    </Repo_Container>
                    <Modal_Background onClick = {() => this.clearModal()} display = {this.state.modal_display}>
                        <Modal_Content onClick = {(e) => e.stopPropagation()}>
                            <Modal_Header>Link to a Repository</Modal_Header>
                            <Modal_Container>
                                <Forms_Container>
                                    <Form_Container>
                                        <Form_Header>Repository Address</Form_Header>
                                        <StyledInput ref={this.address_input} placeholder = {'github.com/repository-address'}  />
                                    </Form_Container>
                                    <Form_Container>
                                        <Form_Header>Repository Name</Form_Header>
                                        <StyledInput ref={this.name_input} placeholder = {'repository-address'}  />
                                    </Form_Container>
                                    <SubmitButton onClick = {() => this.createRepository()}>CREATE</SubmitButton>
                                </Forms_Container>
                                <Modal_Image/>
                            </Modal_Container>
                        </Modal_Content>
                    </Modal_Background>
                </Container>
            )
        }
        return null
    }
}

const mapStateToProps = (state) => {
    console.log(Object.values(state.codebases))
    return {
        codebases: Object.values(state.codebases)
    }
}

export default connect(mapStateToProps, {createCodebase, retrieveCodebases, repoUpdateCommit})(Repository_Viewer);


const Styled_Icon = styled.img`
    width: 5rem;
    margin-bottom: 1.5rem;
`

const Header = styled.div`
    font-size: 3.5rem;
    color: #172A4E;
    font-weight: bold;
    letter-spacing: 0.1rem;
`

const Container = styled.div`
    width: 110rem;
    margin: 0 auto;
    margin-top: 7rem;
`

const Repo_Container = styled.div`
    background-color: rgba(244, 244, 246, 0.7);
    margin-top: 3rem;
    display: flex;
    flex-direction: column;
    border-radius: 0.3rem;
    width: 98rem;
    padding-bottom: 4rem;
`

const Repo_Row = styled.div`
    display: flex;
    margin-top: 4rem;
`

const Repo_Box = styled.div`
    background-color: white;
    margin-left: 4.5rem;
    margin-right: 4rem;
    box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 1px 1px 0px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 24rem;
    height: 17rem;
    display: flex;
    border-radius: 5px;
    transition: box-shadow 0.1s ease, transform 0.1s ease;
    &:hover {
        cursor: pointer;
        box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 8px 16px -6px;
        opacity: 1;
    }
    font-size: 1.5rem;
    color: #172A4E;
    font-weight: bold;
    opacity: ${props => props.opacity};
`


// Modal
/* The Modal (background) */
const Modal_Background = styled.div`
    /*display: none;  Hidden by default */
    position: fixed; /* Stay in place */
    z-index: 10000; /* Sit on top */
    left: 0;
    top: 0;
    width: 100%; /* Full width */
    height: 100%; /* Full height */
    overflow: hidden; /* Enable scroll if needed */
    background-color: rgb(0,0,0); /* Fallback color */
    background-color: rgba(0, 0, 0, 0.4); /* Black w/ opacity */
    display: ${props => props.display};
`
  
  /* Modal Content/Box */
const Modal_Content = styled.div`
    background-color: #fefefe;
    margin: 4.5% auto; /* 15% from the top and centered */
    padding: 5rem;
    padding-bottom: 2rem;
    border: 1px solid #888;
    width: 73vw; /* Could be more or less, depending on screen size */
    height: 50rem;
    border-radius: 5px;
    box-shadow: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 5px 10px, rgba(15, 15, 15, 0.2) 0px 15px 40px;
    display: flex;
    flex-direction: column;
    max-width: 96rem;
`

const Modal_Image = styled.div`
    height: 35rem;
    width: 48rem;
    margin-left: 3rem;
    background-image: url(${repo_background});
    background-size: cover;
`
const Modal_Header = styled.div`
    font-size: 4rem;
    color: #172A4E;
    font-weight:bold;
    letter-spacing: 0.1rem;
`

const StyledInput = styled.input`
    height: 4rem;
    width: 42rem;
    padding: 0.8rem;
    font-size: 1.6rem;
    color: #172A4E;
    border-radius: 0.4rem;
    border: 1px solid #D7D7D7;
    outline: none;
    &:focus {
        border: 1.5px solid #19E5BE;
    }
`

const Modal_Container = styled.div`
    display: flex;
`

const Form_Container = styled.div`
    display: flex;
    flex-direction: column
`
const Form_Header = styled.div`
    font-size: 1.6rem;
    color: #172A4E;
    letter-spacing: 0.05rem;
    margin-top: 2rem;
    margin-bottom: 1rem;
`

const Forms_Container = styled.div`
    display: flex;
    flex-direction: column;
    margin-top: 6rem;
`

const SubmitButton = styled.div`
    margin-top: 4.5rem;
    padding: 0.5rem;
    width: 7.7rem;
    display: inline-block;
    text-transform: uppercase;
    letter-spacing: 2px;
    border-radius: 0.4rem;
    color: #19E5BE;
    border: 1px solid #19E5BE;
    &:hover {
        color: white;
        background-color: #19E5BE;
    }
    cursor: pointer;
    
`