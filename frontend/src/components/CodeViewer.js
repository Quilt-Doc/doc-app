import React, { Component } from 'react'
import RepoSearch from './Repo_Search'
class CodeViewer extends Component {
  render() {
    return (
    <div>
      <h1>Code Viewer</h1>
      <RepoSearch/>
    </div> 
    );
  }
}
export default CodeViewer