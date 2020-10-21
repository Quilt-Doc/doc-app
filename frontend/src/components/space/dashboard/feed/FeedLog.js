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

    renderIcon = (last) => {
        const { type,} = this.props.feed;
        if (type === "create") {
            return (
                <IconContainer>
                    <IconBorder>
                        <RiFileList2Fill/>
                    </IconBorder>
                    {(!last) && <Divider/>}
                </IconContainer>
            )
        } else {
            return (
                <IconContainer>
                    <IconBorder red = {true}>
                        <FiTrash 
                        />
                    </IconBorder>
                    {(!last) && <Divider/>}
                 </IconContainer>
            )
        }
    }

    renderText = () => {
        const { user: {firstName, lastName}, type, title} = this.props.feed;
        return ( 
            <>
                <Document>
                    {`${firstName} ${lastName}`}
                </Document>
                {type === "create" ? " created " : " deleted " }
                <Document>{title ? title : ""}</Document>
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
        const { feed, index, last } = this.props;
        return (
            <>
                <ListItem active = {index % 2 == 0}>
                    {this.renderIcon(last)}
                    <Detail>
                        <Content id = {`#feedDetail${feed._id}`}>
                            {this.renderText()}
                        </Content>
                        <CreationDate>
                            <AiOutlineClockCircle
                                style = {{marginRight: "0.5rem"}}
                            />
                            {this.getDateItem()}
                        </CreationDate>
                    </Detail>
                </ListItem>
            </>
        )
    }
}

/*  <CreationDate>
                        <AiOutlineClockCircle
                            style = {{marginRight: "0.5rem"}}
                        />
                        {this.getDateItem()}
                    </CreationDate> {/*REPEATED COMPONENT CHRONOLOGY */

export default FeedLog;


const Divider = styled.div`
    height: 100%;
    width: 0.15rem;
    background-color: #E0E4E7;
`

const Document = styled.b`
    font-weight: 500;
`

const CreationDate = styled.div`
    display: inline-flex;
    align-items: center;
    font-weight:500;
    border-radius: 0.3rem;
    opacity: 0.7;
    font-size: 1.1rem;
    margin-top: 0.7rem;
    padding-bottom: 2.7rem;
`

const ListItem = styled.div`
    display: flex;
    font-size: 1.1rem;
    /*
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    background-color:#373a49;
    */
    border-radius: 0.6rem;
`

const Icon = styled.div`
    width: 5rem;
    margin-right: 1.5rem;
`

const Detail = styled.div`
    width: 100%;
    margin-left: 2rem;
`

const Content = styled.div`
    font-size: 1.35rem;
    line-height:1.6;
    margin-top: 0.2rem;
`

const IconBorder = styled.div`
    min-width: 3.3rem;
    max-width: 3.3rem;
    min-height: 3.3rem;
    max-height: 3.3rem;
    background-color: ${props => props.red ? chroma('#ff4757').alpha(0.2) : chroma('#19e5be').alpha(0.2)};
    color: ${props => props.red ? "#ff4757" : '#19e5be'};
    align-items: center;
    justify-content: center;
    display: flex;
    border-radius: 50%;
    font-size: 1.45rem;
`

const IconContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`