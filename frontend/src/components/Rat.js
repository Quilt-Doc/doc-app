import React from 'react';
import styled from 'styled-components';
import html2canvas from 'html2canvas';
import ColorMenu from './Space Page/Text Editor Page/Editor/EditorToolbar/ColorMenu';

class Rat extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            url: null
        }
    }

    setUrl = () => {
        html2canvas(this.node).then(canvas => {
          this.setState({url: canvas.toDataURL()});
        });
    }
    
    render(){
        let color = this.state.url ? "blue" : ""
        return(
        <>
        <Container style = {{backgroundColor: color}}ref = {node => this.node = node}>
            <Button onClick = {() => {
                this.setUrl()
            }}>

            </Button>
            
        </Container>
        {this.state.url &&
            <StyledImg src = {this.state.url} />
        }
        </>
    )}
}

export default Rat;

const StyledImg = styled.img`
    width: 20rem;
`

const Button = styled.div`
    width: 15rem;
    height: 15rem;
    background-color: green;
    cursor: pointer;
`

const Container = styled.div`
    width: 100%;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: red;
`