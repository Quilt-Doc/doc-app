import React from 'react';

//styles 
import styled from "styled-components"

//misc
import { connect } from 'react-redux';


class RepositoryCoverageView extends React.Component {
    constructor(props) {
        super(props);
    }


    render() {
        return (
            <>
                <Header>
                        Track Document Coverage
                </Header>
                <Container>
                        <LeftContainer>
                            <ListToolBar>
                                <ListName>Problem Areas</ListName>
                                <IconBorder
                                     marginLeft = {"43rem"}
                                >
                                    <ion-icon style={{'color': '#172A4E', 'fontSize': '2.2rem'}} name="search-outline"></ion-icon>
                                </IconBorder>
                                <IconBorder>
                                    <ion-icon style={{'color': '#172A4E', 'fontSize': '2.55rem', }} name="add-outline"></ion-icon>
                                </IconBorder>
                               
                            </ListToolBar>
                            <ListItemContainer maxHeight = {"30rem"}>
                                <ListItem>
                                    <ion-icon style={{'color': '#172A4E', 'fontSize': '2.2rem', 'marginRight': "2rem"}} name="folder-sharp"></ion-icon>
                                    <ItemName>apis</ItemName>
                                    <ProgressContainer>
                                        <ProgressBar>
                                            {/*<ProgressPart backgroundColor = { }/>*/}
                                            <ProgressPart backgroundColor = {'#19E5BE' } width = {'25%'}/>
                                            <ProgressPart backgroundColor = {'#ff4757'} width = {'75%'}/>
                                        </ProgressBar>
                                        <ProgressDescription>

                                        </ProgressDescription>
                                    </ProgressContainer>
                                    <Statistic>
                                        <ion-icon style={{'color': '#172A4E', 'fontSize': '1.8rem', 'marginRight': "0.3rem"}} name="cube-outline"></ion-icon>
                                        <Count>75</Count>
                                    </Statistic>
                                    <Statistic>
                                        <ion-icon style={{'color': '#172A4E', 'fontSize': '1.8rem', 'marginRight': "0.3rem"}} name="pencil-outline"></ion-icon>
                                        <Count>25</Count>
                                    </Statistic>
                                    <Statistic>
                                    <ion-icon style={{'color': '#172A4E', 'fontSize': '1.8rem', 'marginRight': "0.3rem"}} name="cut-outline"></ion-icon>
                                    <Count>30</Count>
                                    </Statistic>
                                    
                                </ListItem>
                                <ListItem>
                                    <ion-icon style={{'color': '#172A4E', 'fontSize': '2.2rem', 'marginRight': "2rem"}} name="folder-sharp"></ion-icon>
                                    <ItemName>backend</ItemName>
                                    <ProgressContainer>
                                        <ProgressBar>
                                            {/*<ProgressPart backgroundColor = { }/>*/}
                                            <ProgressPart backgroundColor = {'#19E5BE' } width = {'10%'}/>
                                            <ProgressPart backgroundColor = {'#feca57' } width = {'40%'}/>
                                            <ProgressPart backgroundColor = {'#ff4757'} width = {'50%'}/>
                                        </ProgressBar>
                                        <ProgressDescription>

                                        </ProgressDescription>
                                    </ProgressContainer>
                                    <Statistic>
                                        <ion-icon style={{'color': '#172A4E', 'fontSize': '1.8rem', 'marginRight': "0.3rem"}} name="cube-outline"></ion-icon>
                                        <Count>75</Count>
                                    </Statistic>
                                    <Statistic>
                                        <ion-icon style={{'color': '#172A4E', 'fontSize': '1.8rem', 'marginRight': "0.3rem"}} name="pencil-outline"></ion-icon>
                                        <Count>25</Count>
                                    </Statistic>
                                    <Statistic>
                                    <ion-icon style={{'color': '#172A4E', 'fontSize': '1.8rem', 'marginRight': "0.3rem"}} name="cut-outline"></ion-icon>
                                    <Count>30</Count>
                                    </Statistic>
                                </ListItem>
                                <ListItem>
                                    <ion-icon style={{'color': '#172A4E', 'fontSize': '2.2rem', 'marginRight': "2rem"}} name="folder-sharp"></ion-icon>
                                    <ItemName>controllers</ItemName>
                                    <ProgressContainer>
                                        <ProgressBar>
                                            {/*<ProgressPart backgroundColor = { }/>*/}
                                            <ProgressPart backgroundColor = {'#19E5BE' } width = {'60%'}/>
                                            <ProgressPart backgroundColor = {'#ff4757'} width = {'40%'}/>
                                        </ProgressBar>
                                        <ProgressDescription>

                                        </ProgressDescription>
                                    </ProgressContainer>
                                    <Statistic>
                                        <ion-icon style={{'color': '#172A4E', 'fontSize': '1.8rem', 'marginRight': "0.3rem"}} name="cube-outline"></ion-icon>
                                        <Count>40</Count>
                                    </Statistic>
                                    <Statistic>
                                        <ion-icon style={{'color': '#172A4E', 'fontSize': '1.8rem', 'marginRight': "0.3rem"}} name="pencil-outline"></ion-icon>
                                        <Count>12</Count>
                                    </Statistic>
                                    <Statistic>
                                    <ion-icon style={{'color': '#172A4E', 'fontSize': '1.8rem', 'marginRight': "0.3rem"}} name="cut-outline"></ion-icon>
                                    <Count>60</Count>
                                    </Statistic>
                                </ListItem>
                                <ListItem>
                                    <ion-icon style={{'color': '#172A4E', 'fontSize': '2.2rem', 'marginRight': "2rem"}} name="folder-sharp"></ion-icon>
                                    <ItemName>doxygen</ItemName>
                                    <ProgressContainer>
                                        <ProgressBar>
                                            {/*<ProgressPart backgroundColor = { }/>*/}
                                            <ProgressPart backgroundColor = {'#19E5BE' } width = {'70%'}/>
                                            <ProgressPart backgroundColor = {'#feca57' } width = {'20%'}/>
                                            <ProgressPart backgroundColor = {'#ff4757'} width = {'10%'}/>
                                        </ProgressBar>
                                        <ProgressDescription>

                                        </ProgressDescription>
                                    </ProgressContainer>
                                    <Statistic>
                                        <ion-icon style={{'color': '#172A4E', 'fontSize': '1.8rem', 'marginRight': "0.3rem"}} name="cube-outline"></ion-icon>
                                        <Count>80</Count>
                                    </Statistic>
                                    <Statistic>
                                        <ion-icon style={{'color': '#172A4E', 'fontSize': '1.8rem', 'marginRight': "0.3rem"}} name="pencil-outline"></ion-icon>
                                        <Count>15</Count>
                                    </Statistic>
                                    <Statistic>
                                    <ion-icon style={{'color': '#172A4E', 'fontSize': '1.8rem', 'marginRight': "0.3rem"}} name="cut-outline"></ion-icon>
                                    <Count>4</Count>
                                    </Statistic>
                                </ListItem>
                                <ListItem>
                                    <ion-icon style={{'color': '#172A4E', 'fontSize': '2.2rem', 'marginRight': "2rem"}} name="folder-sharp"></ion-icon>
                                    <ItemName>doxygen</ItemName>
                                    <ProgressContainer>
                                        <ProgressBar>
                                            {/*<ProgressPart backgroundColor = { }/>*/}
                                            <ProgressPart backgroundColor = {'#19E5BE' } width = {'70%'}/>
                                            <ProgressPart backgroundColor = {'#feca57' } width = {'20%'}/>
                                            <ProgressPart backgroundColor = {'#ff4757'} width = {'10%'}/>
                                        </ProgressBar>
                                        <ProgressDescription>

                                        </ProgressDescription>
                                    </ProgressContainer>
                                    <Statistic>
                                        <ion-icon style={{'color': '#172A4E', 'fontSize': '1.8rem', 'marginRight': "0.3rem"}} name="cube-outline"></ion-icon>
                                        <Count>80</Count>
                                    </Statistic>
                                    <Statistic>
                                        <ion-icon style={{'color': '#172A4E', 'fontSize': '1.8rem', 'marginRight': "0.3rem"}} name="pencil-outline"></ion-icon>
                                        <Count>15</Count>
                                    </Statistic>
                                    <Statistic>
                                    <ion-icon style={{'color': '#172A4E', 'fontSize': '1.8rem', 'marginRight': "0.3rem"}} name="cut-outline"></ion-icon>
                                    <Count>4</Count>
                                    </Statistic>
                                </ListItem>
                                <ListItem>
                                    <ion-icon style={{'color': '#172A4E', 'fontSize': '2.2rem', 'marginRight': "2rem"}} name="folder-sharp"></ion-icon>
                                    <ItemName>preet</ItemName>
                                    <ProgressContainer>
                                        <ProgressBar>
                                            {/*<ProgressPart backgroundColor = { }/>*/}
                                            <ProgressPart backgroundColor = {'#19E5BE' } width = {'70%'}/>
                                            <ProgressPart backgroundColor = {'#feca57' } width = {'20%'}/>
                                            <ProgressPart backgroundColor = {'#ff4757'} width = {'10%'}/>
                                        </ProgressBar>
                                        <ProgressDescription>
            
                                        </ProgressDescription>
                                    </ProgressContainer>
                                    <Statistic>
                                        <ion-icon style={{'color': '#172A4E', 'fontSize': '1.8rem', 'marginRight': "0.3rem"}} name="cube-outline"></ion-icon>
                                        <Count>80</Count>
                                    </Statistic>
                                    <Statistic>
                                        <ion-icon style={{'color': '#172A4E', 'fontSize': '1.8rem', 'marginRight': "0.3rem"}} name="pencil-outline"></ion-icon>
                                        <Count>15</Count>
                                    </Statistic>
                                    <Statistic>
                                    <ion-icon style={{'color': '#172A4E', 'fontSize': '1.8rem', 'marginRight': "0.3rem"}} name="cut-outline"></ion-icon>
                                    <Count>4</Count>
                                    </Statistic>
                                </ListItem>
                            </ListItemContainer>
                        </LeftContainer>
                        <RightContainer>
                            <ListToolBar>
                                    <ListName>Document Breakage</ListName>
                            </ListToolBar>
                            <ListItemContainer2 maxHeight = {"65rem"} width = {"30rem"}>
                                <ListItem2>
                                    <ion-icon style={{'opacity': '1', 
                                                      'color': '#172A4E', 
                                                      'fontSize': '3.5rem', 
                                                      'marginRight': "0.3rem",
                                                      'marginLeft': "1.6rem"}} name="cut-outline"></ion-icon>
                                    <Description marginLeft = {"2rem"}>Lines 12 - 14</Description>

                                    <ion-icon  style={{'opacity': '1', 
                                                      'color': '#172A4E', 
                                                      'fontSize': '2.3rem'}} name="arrow-forward-outline"></ion-icon>
                                    <Description  marginTop = {"-0.3rem"} marginLeft = {"1rem"}>Lines 17 - 19</Description>
                                </ListItem2>
                                <ListItem2>
                                    <ion-icon style={{'opacity': '1', 
                                                      'color': '#172A4E', 
                                                      'fontSize': '3.5rem', 
                                                      'marginRight': "0.3rem",
                                                      'marginLeft': "1.6rem"}} name="pencil-outline"></ion-icon>
                                    <Description marginLeft = {"2rem"}>Lines 12 - 14</Description>

                                    <ion-icon  style={{'opacity': '1', 
                                                      'color': '#172A4E', 
                                                      'fontSize': '2.3rem'}} name="arrow-forward-outline"></ion-icon>
                                    <Description  marginTop = {"-0.3rem"} marginLeft = {"1rem"}>Lines 17 - 19</Description>
                                </ListItem2>
                                <ListItem2></ListItem2>
                            </ListItemContainer2>
                        </RightContainer>
                </Container>
            </>
        );
    }
}


const mapStateToProps = (state) => {
    return {
        
    }
}


export default RepositoryCoverageView;

const Header = styled.div`
    color: #172A4E;
    font-size: 2.5rem;
    margin-left: 4rem;
    margin-bottom: 2rem;
`

const Container = styled.div`
    display: flex;
    margin-left: 4rem;
    margin-right: 4rem;
    margin-bottom: 4rem;
    height: 87%;
    padding: 3rem;
    background-color: #F7F9FB;
`

const CoverageContainer = styled.div`
    display: flex;
`

const LeftContainer = styled.div`
    display: flex;
    flex-direction: column;
    box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 1px 1px 0px;
    /*box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 8px 16px -6px;*/
    border-radius: 0.2rem;
    width: 65rem;
    background-color: white;
    padding-bottom: 0.5rem;
    max-height: 32rem;
`



const ListToolBar = styled.div`
    height: 4.5rem;
    display: flex;
    border-bottom: 1px solid #EDEFF1;
    align-items: center;
`

const ListItemContainer = styled.div`
    flex-direction:column;
    overflow-y: scroll;
`

const ListItem = styled.div`
    height: 4.5rem;
    padding-left: 2rem;
    padding-right: 2rem;
    transition: background-color 0.1s ease-in;
    &:hover {
        background-color: #F4F4F6; 
    }
    color: #172A4E;
    cursor: pointer;
    align-items: center;
    display: flex;
    font-size: 1.5rem;
`

const ListName = styled.div`
    margin-left: 2rem;
    color: #172A4E;
    font-size: 1.6rem;
    font-weight: bold
`

const ItemName = styled.div`
    width: 16rem;
`

const ProgressContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: 24rem;
`

const ProgressBar = styled.div`
    width: 14rem;
    height: 0.65rem;
    border-radius: 12rem;
    display: flex;
`

const ProgressPart = styled.div`
    background-color: ${props => props.backgroundColor};
    width: ${props => props.width};
    padding: 0.2rem;
`

const ProgressDescription = styled.div`

`

const Statistic = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 2.5rem;
    font-size: 1.1rem;
    opacity: 0.6; 
    width: 6rem;
    transition: all 0.05s ease-in;
    &: hover {
        opacity: 1;
    }
    
`

const Count = styled.div`

`

const IconBorder = styled.div`
    margin-left: ${props => props.marginLeft};
    margin-right: 0.2rem;
    display: flex;
    align-items: center;
    opacity: 0.7;
    width: 3.5rem;
    height: 3.5rem;
    &: hover {
        opacity: 1;
        background-color: #F4F4F6; 
    }
    cursor: pointer;
    justify-content: center;
    transition: all 0.1s ease-in;
`

const ListItemContainer2 = styled.div`
    flex-direction:column;
    height: 60rem;
    width: 36rem;
`

const RightContainer = styled.div`
    margin-left: 3rem;
    background-color: white;
    box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 1px 1px 0px;
    width: 36rem;
    border-radius: 0.2rem;
`

const ListItem2 = styled.div`
    height: 6.5rem;

    margin-top: 0.5rem;
    display: flex;
    align-items: center;
    border-left: 3px solid #19E5BE;
    border-radius: 2px;
`

const Description = styled.div`
    margin-left: ${props => props.marginLeft};
    margin-right: 1rem;
    color: #172A4E;
    font-size: 1.5rem;
    margin-top: ${props => props.marginTop};
`

const IconBox = styled.div`
    width: 3rem;
    height; 3rem;
    align-items: center;
    justify-content: center;
`