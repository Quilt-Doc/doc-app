import React, { Component } from 'react';

//styles
import styled from 'styled-components';
import chroma from 'chroma-js';
import { LIGHT_SHADOW_1 } from '../../../../../../styles/shadows';

//icons
import { AiOutlineClockCircle, AiOutlineExclamation } from 'react-icons/ai';
import { RiCheckFill, RiCloseFill, RiFileList2Fill } from 'react-icons/ri'

//history
import history from '../../../../history';

// Card representing document that is broken
class ReferenceDocument extends Component {

    // depending on whether this is a warning card (from props) or not
    // display correct status
    renderStatus(){
        //let { warning } = this.props;
        return (
            <Status color = {"#19e5be"}>
                <RiCheckFill
                    style = 
                    {{
                        fontSize: "1.7rem"
                    }}
                />
            </Status>
        ) 
    }

    getDateItem = (doc) => {
        let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        let item =  new Date(doc.created)
        let dateString = `${months[item.getMonth()]} ${item.getDate()}, ${item.getFullYear()}`;
        return dateString
    }

    selectColor = (index) => {
        let colors = ['#5352ed',  '#e84393', '#20bf6b', '#1e3799', '#b71540', '#079992', '#ff4757', '#1e90ff', '#ff6348'];

        return index < colors.length ? colors[index] : 
            colors[index - Math.floor(index/colors.length) * colors.length];
    }

    renderCard = () => {
        const { doc, color } = this.props;
        const { _id, title, author } = doc;
        return(
            <Card  onClick = { () => history.push(`?document=${_id}`) }> 
                <Title>
                    <TitleText>{title}</TitleText>
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
                        {this.getDateItem(doc)}
                    </CreationDate>
                </Detail>
            </Card>
        )
    }

    renderPlaceholder = () => {
        return <PlaceholderCard >Add Document</PlaceholderCard>
    }

    render(){
        const { placeholder } = this.props;
        return placeholder ? this.renderPlaceholder() : this.renderCard();
    }
}

export default ReferenceDocument;

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
    width: 2.7rem;
    margin-top: -0rem;
    margin-left: auto;
    justify-content: center;
`

const Title = styled.div`
    display: flex;
    font-weight: 500;
    font-size: 1.4rem;
    align-items: center;
`

const TitleText = styled.div`
    opacity: 1;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    font-weight: 500;
    width: 13rem;
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

const CreationDate = styled.div`
    display: inline-flex;
    align-items: center;
    height: 2.3rem;
    font-weight:500;
    border-radius: 0.3rem;
    color: #8996A8;
    margin-left: auto;
`

const Card = styled.div`
    height: 16rem;
    width: 23rem;
    border-radius: 0.5rem;
    box-shadow: ${LIGHT_SHADOW_1};
    background-color: white;
    padding: 1.5rem 2rem;
    padding-top: 2rem;
    display: flex;
    flex-direction: column;
    margin-right: 3rem;
    cursor: pointer;
    &:hover {
        background-color: #F4F4F6;
    }
`

const PlaceholderCard = styled.div`
    height: 16rem;
    min-width: 23rem;
    border-radius: 0.5rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    background-color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 3rem;
    opacity: 0.5;
`
