import React, { Component } from 'react';
import PropTypes from 'prop-types';

//styles
import styled from 'styled-components';
import chroma from 'chroma-js';

//icons
import { AiOutlineClockCircle, AiOutlineExclamation } from 'react-icons/ai';
import { RiCloseFill, RiFileList2Fill } from 'react-icons/ri'
import { FiGitCommit } from 'react-icons/fi';

// Card representing document that is broken
class BreakageCard extends Component {

    // depending on whether this is a warning card (from props) or not
    // display correct status
    renderStatus(){
        let { status, breakCommit } = this.props.doc;
        return status === "invalid" ?
        (<Status color = {"#ff4757"}>
          
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
        const { color, doc: { author, title, breakDate, breakCommit } } = this.props;
        return(
            <Card> {/*REPEATED COMPONENT MINIMAL DOCUMENT*/}
                <Title>
                    <Name>{title}</Name>
                    {this.renderStatus()}
                </Title>
                <Content>
                    <RiFileList2Fill style = {{
                        color: '#2684FF',
                    }}/>
                </Content> 
                <Detail>
                    <Creator color = {this.selectColor(color)} > 
                        {author.firstName.charAt(0)}
                    </Creator>
                    <CreationDate> {/*REPEATED COMPONENT CHRONOLOGY*/}
                        <AiOutlineClockCircle
                            style = {{marginTop: "0.08rem", marginRight: "0.5rem"}}
                        />
                        {this.getDateItem(breakDate)}
                    </CreationDate>
                </Detail>
            </Card>
        )
    }
}

export default BreakageCard;

const CreationDate = styled.div`
    display: inline-flex;
    align-items: center;
    height: 2.3rem;
    font-weight:500;
    border-radius: 0.3rem;
    color: #8996A8;
    margin-left: auto;
`

const Commit = styled.div`
    font-size: 0.95rem;
    margin-left: auto;
    display: flex;
    align-items: center;
    opacity: 0.7;
    font-weight: 500;
`

const Status = styled.div`
    display: inline-flex;
    background-color: ${props => chroma(props.color).alpha(0.15)};
    color:${props => props.color};
    border: 1px solid ${props => props.color};
    font-weight: 500;
    border-radius: 0.3rem;
    font-size: 1.4rem;
    align-items: center;
    height: 2rem;
    margin-top: -0rem;
    margin-left: auto;
    justify-content: center;
    padding: 0 1rem;
`

const Title = styled.div`
    display: flex;
    font-weight: 500;
    font-size: 1.4rem;
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

const Detail = styled.div`
    display: flex;
    font-size: 1.1rem;
    align-items: center;
    margin-top: auto;
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
    margin-top: -0.1rem;
    background-color: ${props => chroma(props.color).alpha(0.2)};
    color: ${props => props.color};
`

const Card = styled.div`
    height: 16rem;
    min-width: 23rem;
    border-radius: 0.5rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    border: 1px solid #E04E71;
    background-color: white;
    padding: 1.5rem 2rem;
    padding-top: 2rem;
    display: flex;
    flex-direction: column;
    align-self: ${props => props.top ? "flex-start" : ""};
    margin-right: 2rem;
    margin-right: 3rem;
`


