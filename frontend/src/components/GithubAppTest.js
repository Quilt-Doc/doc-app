import React from 'react';

import axios from 'axios';

import styled from 'styled-components';

class GithubAppTest extends React.Component {
    constructor(props) {
        super(props)
    }
    /*

    credentials: "include",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "Access-Control-Allow-Credentials": true
            }
            */
    
    componentDidMount(){
        /*
        fetch("http://localhost:3001/", {
            method: "GET",
            credentials: "include",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              "Access-Control-Allow-Credentials": true
        }}).then(response => {
            console.log(response.data)
        }).then(responseJson => {
            console.log(responseJson)
        })*/
        
        axios.get("http://localhost:3001/api/auth/login/success", { withCredentials: true }).then(response => {
            console.log(response)
        })
        //console.log(response)
        /*
        fetch("http://localhost:3001/api/auth/login/success", {
            method: "GET",
            credentials: "include",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Access-Control-Allow-Credentials": true
            }
        })
          .then(response => {
              console.log("RESPONSE", response)
            if (response.status === 200) return response.json();
            throw new Error("failed to authenticate user");
          })
          .then(responseJson => {
              console.log("RESPONSEJSON", responseJson)
            
            this.setState({
              authenticated: true,
              user: responseJson.user
            });
          })
          .catch(error => {
            console.log(error)
            
            this.setState({
              authenticated: false,
              error: "Failed to authenticate user"
            });
            
          });*/
    }

    goLogin = () => {
        window.open("http://localhost:3001/api/auth/github", "_self");
    }

    goLogout = () => {
        window.open("http://localhost:3001/api/auth/logout", "_self");
    }

    render(){
        return(
            <>
                <Button onClick = {this.goLogin}>CLICK TO LOGIN</Button>
                <Button onClick = {this.goLogout}>CLICK TO LOGOUT</Button>
            </>
            
            )
    }
}

export default GithubAppTest;

const Button = styled.div`
    border: 2px solid black;
    width: 20rem;
    height: 10rem;
    margin: 0 auto;
    margin-top: 10rem;
    cursor: pointer;
`