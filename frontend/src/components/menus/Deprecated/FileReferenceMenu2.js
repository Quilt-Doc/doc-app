
import React from 'react';

// react-redux
import { connect } from 'react-redux';

//chroma
import chroma from 'chroma-js';

//styles
import styled from "styled-components";

//actions
import { retrieveTags } from '../../../../actions/Tag_Actions';

/*renderTop = () => {
        if (this.addButton){
            let {top, height} = this.addButton.getBoundingClientRect();
            console.log(top + height - 100);
            return top + height + 10;
        }
        return 0;
    }

    renderLeft = () => {
        if (this.addButton){
            let {left} = this.addButton.getBoundingClientRect();
            
            return left;
        }
        return 0;
    }*/
class FileReferenceMenu extends React.Component {
    
    constructor(props){
        super(props)

        this.state = {
            open: false,
            focused: false
        }

        this.menuRef = React.createRef();
    }

    componentDidMount() {
        document.addEventListener('mousedown', this.handleClickOutside, false);
    }

    componentWillUnmount() {
        document.removeEventListener('mousedown', this.handleClickOutside, false);
    }

    /**
     * Alert if clicked on outside of element
     */
    handleClickOutside = (event) => {
        if (this.node && !this.node.contains(event.target)) {
            this.setState({open: false})
        }
    }

    render() {
        this.colors = ['#5352ed', 
        '#ff4757', '#20bf6b', '#ff6348', '#1e90ff', '#e84393', '#1e3799', '#b71540', '#079992'
        ]
        return(
            <MenuContainer  >
                <AddButton onClick = {() => this.setState({open: true})}>
                    <ion-icon style = {{fontSize: "1.5rem"}} name="add-outline"></ion-icon>
                </AddButton>
                {this.state.open && 
                    <Container ref = {node => this.node = node}>
                        <HeaderContainer>Add references</HeaderContainer>
                        <SearchbarContainer>
                            <SearchbarWrapper 
                                backgroundColor = {this.state.focused ? "white" : "#F7F9FB"}
                                border = {this.state.focused ? "2px solid #2684FF" : "1px solid #E0E4E7;"}
                            >
                                 <ion-icon name="search-outline" style = {{fontSize: "2.3rem", color: '#172A4E', opacity: 0.4}}></ion-icon>
                                <Searchbar 
                                    onFocus = {() => {this.setState({focused: true})}} 
                                    onBlur = {() => {this.setState({focused: false})}} 
                                    autoFocus 
                                    placeholder = {"Find references..."}/>
                               
                            </SearchbarWrapper>
                        </SearchbarContainer>
                        <ListContainer>
                            {this.colors.map((color) => {
                                //let icon =  ref.kind === 'dir' ? <ion-icon style = {{marginRight: "0.5rem", fontSize: "1.3rem"}} name="folder-sharp"></ion-icon> 
                                //: <ion-icon style = {{marginRight: "0.5rem", fontSize: "1rem"}} name="document-outline"></ion-icon>; 
                                return(
                                    <ListItem color = {color} backgroundColor = {chroma(color).alpha(0.2)}
                                    ><ion-icon style = {{marginRight: "0.7rem", fontSize: "1.3rem"}} name="folder-sharp"></ion-icon>Semantic</ListItem>
                                )
                            })}
                        </ListContainer>
                    </Container>
                }
            </MenuContainer>
        )
    }
    
}

const mapStateToProps = (state) => {
    return {
        labels: state.tags
    }
}



export default connect(mapStateToProps, {  })(FileReferenceMenu);

const MenuContainer = styled.div`
`

const AddButton = styled.div`
    width: 2.3rem;
    height: 2.3rem;
    background-color: #F7F9FB;
    border: 1px solid #E0E4E7;
    opacity: 0.4;
    border-radius: 0.2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    &:hover {
        opacity: 1
    }
    color: #172A4E;
`

const Container = styled.div`
    width: 24rem;
    display: flex;
    flex-direction: column;
    color: #172A4E;
    box-shadow: 0 2px 6px 2px rgba(60,64,67,.15);
    position: absolute;
    border-radius: 0.3rem;
    font-size: 1.4rem;
    margin-top: -5rem;
    z-index: 2;
    background-color: white;
`

const SearchbarContainer = styled.div`
    height: 5.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom:  1px solid #E0E4E7;
`

const HeaderContainer = styled.div`
    height: 3.5rem;
    display: flex;
    align-items: center;
    font-size: 1.3rem;
    padding: 1rem;
    color: #172A4E;
    border-bottom: 1px solid #E0E4E7;
`

const ListHeader = styled.div`
    height: 3rem;
  
    padding: 1.5rem;
    align-items: center;
    display: flex;
    font-size: 1.4rem;
    opacity: 0.8;

`

const ListContainer = styled.div`
    display: flex;
    flex-direction: column;
    padding: 1rem;
`

const ListItem = styled.div`
    height: 2.8rem;
    font-size: 1.25rem;
    border-radius: 0.4rem;
    margin-bottom: 0.7rem;
    color: #2980b9;
    padding: 1rem;
    display: flex;
    align-items: center;
    &:hover {
        box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 1px 1px 0px;
    }
    cursor: pointer;
    background-color:#262E49;
    color:#D6E0EE;
    border-radius: 0.3rem;
`

const ListCreate = styled.div`
    height: 3.5rem;
    border-radius: 0.4rem;
    margin-bottom: 0.7rem;
    background-color: #F7F9FB;
    &:hover {
        box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 1px 1px 0px;
    }
    color: #172A4E;
    padding: 1rem;
    display: flex;
    align-items: center;
    cursor: pointer;
`

const SearchbarWrapper = styled.div`
    width: 22rem;
    height: 3.5rem;
    border: 1px solid  #E0E4E7;
    background-color: ${props => props.backgroundColor};
    border: ${props => props.border};
    border-radius: 0.4rem;
    padding: 1.5rem;
    align-items: center;
    display: flex;
`

const Searchbar = styled.input`
    width: 18rem;
    margin-left: 0.9rem;
    &::placeholder {
        color: #172A4E;
        opacity: 0.4;
    }
    &:focus {
        background-color: white;
    }
    background-color: #F7F9FB;
    border: none;
    outline: none;
    font-size: 1.4rem;
    color: #172A4E;
    
`