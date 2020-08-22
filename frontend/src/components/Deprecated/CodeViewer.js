import React, { Component } from 'react'
import RepoSearch from './Repo_Search'
import CodeBaseExplorer from './CodeBaseExplorer'
import FileViewer from './FileViewer'
import DocumentCreate from '../DocumentCreate'

class CodeViewer extends Component {
  render() {
    return (
    <div>
      <h1>Code Viewer</h1>
      <RepoSearch/>
      <CodeBaseExplorer/>
      <FileViewer/>
      <DocumentCreate/>
    </div>
    );
  }
}
export default CodeViewer