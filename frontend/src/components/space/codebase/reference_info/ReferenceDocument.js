import React, { Component } from 'react';

//styles
import styled from 'styled-components';
import chroma from 'chroma-js';
import { LIGHT_SHADOW_1 } from '../../../../styles/shadows';

//icons
import { AiOutlineClockCircle, AiOutlineExclamation } from 'react-icons/ai';
import { RiCheckFill, RiCloseFill, RiFileList2Fill, RiFileTextFill } from 'react-icons/ri'

//history
import history from '../../../../history';
import { withRouter } from 'react-router-dom';

//actions
import { getDocumentImage } from '../../../../actions/Document_Actions'

//loader
import { Oval } from 'svg-loaders-react';

//animation
import { CSSTransition } from 'react-transition-group';

//redux
import { connect } from 'react-redux';

// Card representing document that is broken
class ReferenceDocument extends Component {

    constructor(props){
        super(props);

        this.state = {
            image: null, 
            loaded: false
        }
    }

    componentDidMount = async () => {
        const { getDocumentImage, doc, match } = this.props;
        const { workspaceId } = match.params;

        const image = await getDocumentImage({ documentId: doc._id,  workspaceId });
        this.setState({image, loaded: true});
    }

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

    renderPlaceholderCard = () => {
        return (
            <Placeholder>
                <RiFileTextFill style = {{
                    color: '#2684FF',
                }}/>
            </Placeholder>
        )
    }

    renderImage = () => {
        const { image, loaded } = this.state;
        
        const imageJSX = image ? 
            <ImageContainer2>
                <ImageContainer src = {image}/>
            </ImageContainer2>
            : this.renderPlaceholderCard();
    
        if (loaded) return imageJSX;

        return this.renderLoader();
    }   

    renderLoader = () => {
        return (
            <Placeholder>
                <Oval stroke={"#d9d9e2"}/>
            </Placeholder>
        )
    }

    renderCard = () => {
        const { doc } = this.props;
        const { _id, title } = doc;

        return(
            <CSSTransition
                in={true}
                appear = {true}
                timeout = {150}
                classNames = "itemcard"
            >
                <div>
                    <Card  onClick = { () => history.push(`?document=${_id}`) } key = {doc._id} >
                        {this.renderStatus()}
                        {this.renderImage()}
                        <Bottom>
                            <Title>
                                <StyledIcon>
                                    <RiFileTextFill style = {{ color: '#2684FF' }}/>
                                </StyledIcon>
                                {title}
                            </Title> 
                        </Bottom>
                    </Card>
                </div>
            </CSSTransition>
        )
    }

    render(){
        return this.renderCard();
    }
}

const mapStateToProps = () => {
    return {}
}

export default withRouter(connect(mapStateToProps, {getDocumentImage})(ReferenceDocument));

const Bottom = styled.div`
    height: 5rem;
    width: 100%;
    border-bottom-left-radius: 0.5rem;
    border-bottom-right-radius: 0.5rem;
    display: flex;
    align-items: center;
`

const ImageContainer2 = styled.div`
    overflow-y: hidden;
    position: relative;
    padding-bottom: 70%;
    width: 100%;
`

const Placeholder = styled.div`
    width: 100%; 
    display: flex;
    align-items: center;
    justify-content: center;   
    font-size: 7rem;  
    height: 14rem;        
`

const ImageContainer = styled.img`
    object-fit: cover;
    position: absolute;
    top: 0; 
    left: 0;
    object-position: center top;
    width: 100%; 
    height: 100%;
    padding-left: 2rem;
    padding-right: 2rem;
    /*
    overflow-y: hidden;
    */
    /*
    display: flex;
    justify-content: center;
    */
    
`

const StyledIcon = styled.div`
    justify-content: center;
    align-items: center;
    display:flex;
    font-size: 2.2rem;
    margin-right: 0.8rem;
`

const Status = styled.div`
    display: inline-flex;
    background-color: ${chroma('#19e5be').alpha(0.15)};
    color:#19e5be;
    border: 1px solid #19e5be;
    font-weight: 500;
    border-radius: 0.3rem;
    font-size: 1.4rem;
    padding: 0rem 1rem;
    align-items: center;
    height: 2rem;
    margin-top: -0rem;
    margin-left: auto;
    margin-right: 2rem;
    justify-content: center;
`

const Title = styled.div`
    display: flex;
    font-weight: 500;
    font-size: 1.4rem;
    align-items: center;
    padding-left: 2rem;
    padding-right: 2rem;
`

const Card = styled.div`
    width: 20rem;
    position: relative;
    color: #172A4E;
    border-radius: 0.5rem;
    box-shadow: ${LIGHT_SHADOW_1};
    background-color: white;
    /*padding: 1.5rem 2rem;
    padding-top: 2rem;*/
    display: flex;
    align-items: center;
    padding-top: 1.2rem;
    flex-direction: column;
    align-self: ${props => props.top ? "flex-start" : ""};
    cursor: pointer;
    &:hover {
        box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 8px 16px -6px;
    }
    text-decoration: none;
    transition: box-shadow 0.1s;
    margin-right: 2rem;
`

/*
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
    
    background-color: ${chroma('#1e90ff').alpha(0.2)};
    color:#1e90ff;
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
*/