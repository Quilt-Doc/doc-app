import React, { Component } from 'react'
import RepoSearch from './Repo_Search'
import CodeBaseExplorer from './CodeBaseExplorer'
import FileViewer from './FileViewer'
class CodeViewer extends Component {
  render() {
    return (
    <div>
      <h1>Code Viewer</h1>
      <RepoSearch/>
      <CodeBaseExplorer/>
      <FileViewer/>
    </div>
    );
  }
}
export default CodeViewer