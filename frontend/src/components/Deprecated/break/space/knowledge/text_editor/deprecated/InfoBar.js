import React from 'react'

import LabelMenu from '../../General/Menus/LabelMenu';

//styles
import styled from "styled-components";
import chroma from 'chroma-js';


class InfoBar extends React.Component {

    render(){
        return(
            <InfoBarContainer>
                    
                    {/*<InfoBlock >
    
                            <ProfileContent>
    
                            
                            <ProfileButton>FS</ProfileButton>
                            <ProfileInfo>
                                <div style = {{marginBottom: "0.3rem"}}>Created by <span style = {{fontWeight: "600"}}>Faraz Sanal</span></div>
                                <div>June 8th, 2016</div>
                            </ProfileInfo>
                            </ProfileContent>
                    </InfoBlock>  */}   
                         <InfoBlock>
                            <InfoHeader>< ion-icon name="menu-outline"  style = {
                                                {color: "#172A4E",  marginLeft: "-0.4rem", marginRight: "0.7rem", fontSize: "1.8rem"}
                                        }></ion-icon>Contents</InfoHeader>
                            <ShortcutContainer>
                                <Shortcut>+ Iterable-styled datasets</Shortcut>
                                <Shortcut>+ Map-styled datasets</Shortcut>
                            </ShortcutContainer>
                        </InfoBlock>
                        <InfoBlock>
                            <InfoHeader>
                                <ion-icon  style = {
                                                {color: "#172A4E",marginLeft: "-0.4rem", marginRight: "0.7rem", fontSize: "1.65rem"}
                                        } name="git-network-outline"></ion-icon>
                                Repository
                            </InfoHeader>
                            <ReferenceContainer>
                                <RepositoryButton> <ion-icon  style = {
                                                { marginRight: "0.5rem", fontSize: "1.4rem"}
                                        } name="git-network-outline"></ion-icon>
                                        fsanal / FinanceNewsApp</RepositoryButton>
                            </ReferenceContainer>
                        </InfoBlock> 
                        <InfoBlock>
                            <InfoHeader>< ion-icon name="cube-outline"  style = {
                                                {color: "#172A4E",  marginLeft: "-0.4rem", marginRight: "0.7rem", fontSize: "1.65rem"}
                                        }></ion-icon>References</InfoHeader>
                                        
                            <ReferenceContainer2>
                                <Reference>
                                    <ion-icon name="document-outline"
                                    style = {
                                        {color: "#172A4E", marginRight: "0.7rem", fontSize: "1.4rem"}}></ion-icon>
                                    backend.js
                                </Reference>
                                <Reference2>
                                    <ion-icon name="folder"
                                    style = {
                                        {color: "#172A4E", marginRight: "0.7rem", fontSize: "1.4rem"}}></ion-icon>
                                    Semantic
                                </Reference2>
                                {/*<NoneMessage>None yet</NoneMessage>*/}
                                <LabelMenu 
                                    attachTag = {(tagId) => console.log(tagId)}//this.props.attachTag(this.props.currentReference._id, tagId)}//this.props.attachTag(requestId, tagId)}
                                    removeTag = {(tagId) => console.log(tagId)}//this.props.removeTag(this.props.currentReference._id, tagId)}//this.props.removeTag(requestId, tagId)}
                                    setTags = {[]}//{this.props.currentReference.tags}//this.props.request.tags}
                                    marginTop = {"1rem"}
                                />
                            </ReferenceContainer2>
                        </InfoBlock>
                        <InfoBlock>
                            <InfoHeader>
                                <ion-icon  style = {
                                                {color: "#172A4E",  marginLeft: "-0.4rem", marginRight: "0.7rem", fontSize: "1.65rem"}
                                        } name="pricetag-outline"></ion-icon>
                                Labels
                            </InfoHeader>
                            <ReferenceContainer>
                                <NoneMessage>None yet</NoneMessage>
                                {/*this.props.currentReference.tags && this.props.currentReference.tags.length > 0  ? this.renderTags() : */}
                                <LabelMenu 
                                    attachTag = {(tagId) => console.log(tagId)}//this.props.attachTag(this.props.currentReference._id, tagId)}//this.props.attachTag(requestId, tagId)}
                                    removeTag = {(tagId) => console.log(tagId)}//this.props.removeTag(this.props.currentReference._id, tagId)}//this.props.removeTag(requestId, tagId)}
                                    setTags = {[]}//{this.props.currentReference.tags}//this.props.request.tags}
                                    marginTop = {"1rem"}
                                />
                            </ReferenceContainer>
                        </InfoBlock>     
                    </InfoBarContainer>
        )
    }
}

export default InfoBar;


const RepositoryButton = styled.div`
    background-color: ${chroma("#6762df").alpha(0.1)}; 
    color: #6762df;
    font-weight: 500;
    padding: 0.75rem;
    display: inline-flex;
    border-radius: 0.4rem;
    /*box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 1px 1px 0px;*/
    align-items: center;
    cursor: pointer;
    &: hover {
        box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 1px 1px 0px;
    }
    letter-spacing: 1;
    font-size: 1.3rem;
`

const CommentInput = styled.input`
    width: 26rem;
    height: 3.5rem;
    border: 1px solid  #E0E4E7;
    background-color: #F7F9FB;
    border-radius: 0.4rem;
    padding: 1.5rem;
    &:focus {
        background-color: white;
        border: 2px solid #2684FF;

    }
    &::placeholder {
        color: #172A4E;
        opacity: 0.4;
    }
    outline: none;
    font-size: 1.4rem;
    color: #172A4E;
    
`


const NoneMessage = styled.div`
    font-size: 1.3rem;
    margin-right: 1rem;
    opacity: 0.5;
`

const Shortcut = styled.div`
    font-size: 1.3rem;
    margin-bottom: 0.5rem;
    &:last-of-type {
        margin-bottom: 0rem;
        
    }
`

const InfoBarContainer = styled.div`
    /*background-color: #F4F4F6; */
   

    /*box-shadow: 2px 2px 4px rgba(0,0,0,0.1);*/
    /*
    margin-top: 1rem;
    */
    position: -webkit-sticky; /* for Safari */
    position: sticky;
    width: 27rem;
    margin-right: 6rem;
    margin-left: -3rem;
    top: 5.5rem;
    align-self: flex-start;
`


const InfoHeader = styled.div`
    display: flex;
    align-items: center;
    font-weight: 500;
    font-size: 1.4rem;
    color: #172A4E;
    margin-bottom: 1.5rem;
`


const InfoBlock = styled.div`
    padding-top: 2.3rem;
    padding-bottom: 2.3rem;
    display: ${props => props.display};
   
`


const ReferenceContainer = styled.div`
    margin-top: 0.8rem;
    display: flex;
    flex-wrap: wrap;
   
    align-items: center;
`

const ReferenceContainer2 = styled.div`
    margin-top: 0.8rem;
    display: flex;
    flex-wrap: wrap;
    margin: -0.7rem;
    margin-bottom: 0rem;
    align-items: center;
`

const ShortcutContainer = styled.div`
    margin-top: 0.8rem;
    display: flex;
    flex-direction: column;
`

const Reference = styled.div`
    font-size: 1.25rem;
    color: #172A4E;
    /*box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 8px 16px -6px;*/
    padding: 0.55rem 0.7rem;
    padding-right: 0.9rem;
    align-items: center;
    display: inline-flex;
    /*background-color:#262E49;*/
    /*color:#D6E0EE;*/
    border-left: 3.5px solid #19e5be;
    background-color: #F7F9FB;
    border-radius: 0.3rem;
    box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 1px 1px 0px;
   
    margin: 0.7rem;
`


const Reference2 = styled.div`
    font-size: 1.25rem;
    color: #172A4E;
    /*box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 8px 16px -6px;*/
    padding: 0.55rem 1rem;
    align-items: center;
    display: inline-flex;
    /*background-color:#262E49;*/
    /*color:#D6E0EE;*/
    border-left: 3.5px solid #6762df;
    background-color: #F7F9FB;
    border-radius: 0.3rem;
    box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 1px 1px 0px;
    margin-right: 1rem;
    margin: 0.7rem;
`


const ProfileButton = styled.div`
    width: 3.3rem;
    height: 3.3rem;
    justify-content: center;
    align-items: center;
    display: flex;
    border-radius: 0.25rem;
    font-size: 1.4rem;
    color: white;
    background-color:#6762df;
    cursor: pointer;
    margin-right: 1.25rem;
`


/*#1BE5BE*/