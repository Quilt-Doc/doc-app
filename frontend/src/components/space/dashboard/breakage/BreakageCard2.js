import React, { Component } from 'react';
import PropTypes from 'prop-types';

//styles
import styled from 'styled-components';
import chroma from 'chroma-js';

//icons
import { AiOutlineClockCircle, AiOutlineExclamation } from 'react-icons/ai';
import { RiCloseFill, RiFileList2Fill } from 'react-icons/ri'
import { FiClock, FiGitCommit } from 'react-icons/fi';

// Card representing document that is broken
class BreakageCard extends Component {

    // depending on whether this is a warning card (from props) or not
    // display correct status
    renderStatus(){
        let { status, breakCommit } = this.props.doc;
        return status === "invalid" ?
        (<Status color = {chroma("#ff4757")}>
          
            <Commit>
                <FiGitCommit
                    style = {{
                        fontSize: "1.2rem",
                        marginRight: "0.3rem",
                        marginTop: "0.1rem"
                    }}
                />
                {breakCommit.slice(0, 7)}
            </Commit>
        </Status>) :
        (<Status color = {"#6762df"}>
            <AiOutlineExclamation
                style = 
                {{
                    fontSize: "1.5rem"
                }}
            />
            <Commit>
                    <FiGitCommit
                        style = {{
                            fontSize: "1.2rem",
                            marginRight: "0.3rem",
                            marginTop: "0.1rem"
                        }}
                    />
                    {breakCommit.slice(0, 7)}
            </Commit>
        </Status>)
    }

    getDateItem = () => {
        const { created } = this.props.doc;
        let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        let item =  new Date(created)
        let dateString = `${months[item.getMonth()]} ${item.getDate()}, ${item.getFullYear()}`;
        return dateString
    }


    selectColor = (index) => {
        let colors = ['#5352ed',  '#e84393', '#20bf6b', '#1e3799', '#b71540', '#079992', '#ff4757', '#1e90ff', '#ff6348'];

        return index < colors.length ? colors[index] : 
            colors[index - Math.floor(index/colors.length) * colors.length];
    }
    
    render(){
        const { color, doc: { author, title, breakDate, breakCommit, image } } = this.props;
        return(
            <Card> 
                <ImageContainer>
                    <StyledImage src = {image}/>
                </ImageContainer>
                <Detail>
                    <Title>
                        <StyledIcon>
                            <RiFileList2Fill style = {{
                                            color: chroma('#ff4757').alpha(0.9),
                            }}/>
                        </StyledIcon>
                        {title}
                    </Title>
                    {this.renderStatus()}
                    <Bottom>
                        <Creator color = {this.selectColor(color)} > 
                            {author.firstName.charAt(0)}
                        </Creator>
                        <CreationDate> 
                            <FiClock style = {{marginRight: "0.5rem"}}/>
                            {this.getDateItem(breakDate)}
                        </CreationDate>
                      
                    </Bottom>
                   
                </Detail>
                
                {/*
                <Top>
                    <Title>
                        {title}
                    </Title>
                    <Commit>
                        <FiGitCommit
                            style = {{
                                fontSize: "1.2rem",
                                marginRight: "0.3rem",
                                marginTop: "0.1rem"
                            }}
                        />
                        {breakCommit.slice(0, 7)}
                    </Commit>
                </Top>
                <Bottom>
                    <Creator color = {this.selectColor(color)} > 
                        {author.firstName.charAt(0)}
                    </Creator>
                    <CreationDate> 
                        <AiOutlineClockCircle
                            style = {{marginTop: "0.08rem", marginRight: "0.5rem"}}
                        />
                        {this.getDateItem(breakDate)}
                    </CreationDate>
                </Bottom>
                */}
            </Card>
        )
    }
}

export default BreakageCard;

const Detail = styled.div`
    width: 19rem;
    margin-left: auto;
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
`

const StyledIcon = styled.div`
    justify-content: center;
    align-items: center;
    display:flex;
    font-size: 2.2rem;
    margin-right: 0.8rem;
`

const ImageContainer = styled.div`
    height: 12rem;
    width: 12rem;
    overflow-y: hidden;
    border-radius: 0.5rem;
    box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 5px 10px -5px;
    padding-top: 1rem;
    background-color: white;
`

const StyledImage = styled.img`
    width: 10rem;
    object-fit: cover;
    overflow-y: hidden;
    /*
    display: flex;
    justify-content: center;
    */
    margin-left: 1rem;
    margin-right: 1rem; 
    margin-top: 0rem;
`

const CreationDate = styled.div`
    display: inline-flex;
    align-items: center;
    font-weight:400;
    border-radius: 0.3rem;
    color: #172A4e;
    margin-left: auto;
    margin-top: auto;
    padding: 0.2rem;
`

const Commit = styled.div`
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    opacity: 0.7;
    font-weight: 500;
`

const Status = styled.div`
    margin-top: 1rem;
    display: inline-flex;
    background-color: ${props => chroma(props.color).alpha(0.15)};
    color:${props => props.color};
    border: 1px solid ${props => props.color};
    font-weight: 500;
    border-radius: 0.3rem;
    font-size: 1.4rem;
    align-items: center;
    height: 2rem;
    justify-content: center;
    padding: 0 1rem;
`

const Title = styled.div`
    display: flex;
    font-weight: 500;
    font-size: 1.3rem;
    align-items: center;
`

const Name = styled.div`
    opacity: 1;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    font-weight: 500;
    width: 10rem;
    font-size: 1.25rem;
`

//3 Faraz TODO: add a border on this guy
const Content = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 22rem;
    margin-bottom: 1rem;
    margin-top: 1rem;
    font-size: 3.5rem;
`

const Top = styled.div`
    display: flex;
    align-items: center;
`

const Bottom = styled.div`
    display: flex;
    font-size: 1.1rem;
    margin-top: 1rem;
`

const Creator = styled.div`
    height: 2.5rem;
    width: 2.5rem;
    /*
    background-color: ${chroma('#1e90ff').alpha(0.2)};
    color:#1e90ff;*/
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.3rem;
    font-size: 1.4rem;
    
    background-color: ${props => chroma(props.color).alpha(0.2)};
    color: ${props => props.color};
`

const Card = styled.div`
    /*background-color: #f7f9fb;*/
    border-radius: 0.4rem;
    width: 100%;
    /*margin-bottom: 1.5rem;*/
    display: flex;
    padding: 1rem 1rem;
    /*border: 1px solid #E0E4E7;*/
`

const IconBorder = styled.div`
    width: 2.3rem;
    font-size: 2rem;
    color: #ff4757;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: 0.7rem;
`