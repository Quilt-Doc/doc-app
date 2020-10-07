import React, {Component} from 'react';

//styles
import styled from 'styled-components';
import chroma from 'chroma-js';

//icons
import { RiFileList2Fill } from 'react-icons/ri'
import { AiOutlineClockCircle } from 'react-icons/ai';
import { FiTrash } from 'react-icons/fi';

//Individual item in Feed
class FeedLog extends Component {

    renderIcon = () => {
        const { type } = this.props.feed;
        if (type === "create") {
            return (
                <IconBorder>
                    <RiFileList2Fill 
                        style = {{fontSize: "2.2rem"}}
                    />
                </IconBorder>
            )
        } else {
            return (
                <IconBorder red = {true}>
                    <FiTrash 
                        style = {{fontSize: "2.2rem"}}
                    />
                </IconBorder>
            )
        }
    }

    renderText = () => {
        const { user: {firstName, lastName}, type, document} = this.props.feed;
        return ( 
            <>
                <Document>
                    {`${firstName} ${lastName}`}
                </Document>
                {type === "create" ? " created " : " deleted " }
                <Document>{document ? document.title: ""}</Document>
            </>
        )
    }

    getDateItem = () => {
        const { date } = this.props.feed;
        let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        let item =  new Date(date)
        let dateString = `${months[item.getMonth()]} ${item.getDate()}, ${item.getFullYear()}`;
        return dateString
    }

    render(){
        return (
            <ListItem>
                {this.renderIcon()}
                <Detail>
                    <Content>
                        {this.renderText()}
                    </Content>
                    <CreationDate>
                        <AiOutlineClockCircle
                            style = {{marginRight: "0.5rem"}}
                        />
                        {this.getDateItem()}
                    </CreationDate> {/*REPEATED COMPONENT CHRONOLOGY*/}
                </Detail>
            </ListItem>
        )
    }
}

export default FeedLog;


const Document = styled.b`
    font-weight: 500;
`

const CreationDate = styled.div`
    display: inline-flex;
    align-items: center;
    height: 2.3rem;
    padding: 0rem 0.8rem;
    font-weight:500;
    border-radius: 0.3rem;
    opacity: 0.7;
    font-size: 1.1rem;
    float: right;
    margin-top: 2rem;
`

const ListItem = styled.div`
    display: flex;
   
    font-size: 1.5rem;
    margin-bottom: 2rem;
    padding:2rem 1.5rem;
    padding-bottom: 1rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    background-color:#373a49;
    color: white;
    border-radius: 0.5rem;
`

const Icon = styled.div`
    width: 5rem;
    margin-right: 1.5rem;
`

const Detail = styled.div`
    padding-left: 2rem;
    width: 100%;
`

const Content = styled.div`
    font-size: 1.25rem;
    margin-top: 0.1rem;
    line-height:1.6;
`

const IconBorder = styled.div`
    min-width: 4rem;
    max-width: 4rem;
    height: 4rem;
    background-color: ${props => props.red ? chroma('#ff4757').alpha(0.2) : chroma('#19e5be').alpha(0.2)};
    color: ${props => props.red ? "#ff4757" : '#19e5be'};
    align-items: center;
    justify-content: center;
    display: flex;
    border-radius: 50%;
    font-size: 1.6rem;
`
