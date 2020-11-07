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
        let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
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


const Creator = styled.div`
    min-height: 2.5rem;
    min-width: 2.5rem;
    max-height: 2.5rem;
    max-width: 2.5rem;
    background-color: ${props => chroma(props.color).alpha(1)};
    color: white; /*${props => props.color};*/
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.45rem;
    border-radius: 0.4rem;
    font-weight: 400;
    margin-left: 0.9rem;
`


const Divider = styled.div`
    height: 100%;
    width: 0.1rem;
    background-color: #e8ecee;
`

const Document = styled.b`
    font-weight: 500;
`

const CreationDate = styled.div`
    display: inline-flex;
    align-items: center;
    font-weight:400;
    border-radius: 0.3rem;
    opacity: 0.8;
    font-size: 1.15rem;
    margin-top: 1.2rem;
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
    margin-left: 1.5rem;
`

const Content = styled.div`
    font-size: 1.25rem;
    line-height:1.6;
`

const IconBorder = styled.div`
    min-width: 2.5rem;
    max-width: 2.5rem;
    min-height: 2.5rem;
    max-height: 2.5rem;
    background-color: ${props => props.red ? chroma('#ff4757').alpha(0.2) : chroma('#19e5be').alpha(0.2)};
    color: ${props => props.red ? "#ff4757" : '#19e5be'};
    align-items: center;
    justify-content: center;
    display: flex;
    border-radius: 0.4rem;
    font-size: 1.3rem;
`

const IconContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`