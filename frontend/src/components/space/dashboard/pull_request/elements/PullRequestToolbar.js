import React from 'react';

//styles
import styled from 'styled-components';

//icons
import { BiSearch } from 'react-icons/bi';
import { FiGitPullRequest } from 'react-icons/fi';
import { CgArrowsExpandRight } from 'react-icons/cg';
import { FiChevronDown, FiFilter } from 'react-icons/fi';

// Toolbar to sort/search/switch for the pull request component
const PullRequestToolbar = () => {
    return (
        <Toolbar>
            <SwitchButton> {/*TODO: REPEATED COMPONENT SELECT*/}
                <FiGitPullRequest style = {{
                        marginRight: "0.5rem",
                        fontSize: "1.45rem"
                    }}/>
                Pull Requests
                <FiChevronDown 
                    style = {{
                        marginLeft: "0.5rem",
                        marginTop: "0.3rem",
                        fontSize: "1.45rem"
                    }}
                />
            </SwitchButton>
            <SearchButton>
                <BiSearch style={{ 'fontSize': '2rem'}}  />
            </SearchButton>
            <FilterButton>
                <FiFilter/>
            </FilterButton>
            <CgArrowsExpandRight style = {{fontSize: "1.9rem", marginLeft: "1rem"}}/>
        </Toolbar>
    )
}

export default PullRequestToolbar;

const SearchButton = styled.div`
    height: 3.5rem;
    width: 3.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: auto;
`

const FilterButton = styled.div`
    margin-left: 0.8rem;
    margin-right: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.8rem;
    border-radius: 0.4rem;
`

const SwitchButton = styled.div`
    display: flex;
    align-items: center;
    border: 1px solid #E0E4e7;
    font-size: 1.4rem;
    padding: 0rem 1.5rem;
    border-radius: 0.4rem;
    height: 3.5rem;
    font-weight: 500;
`

const Toolbar = styled.div`
    height: 5rem;
    display: flex;
    align-items: center;
    border-bottom: 1px solid #EDEFF1;
    padding: 0 1.5rem;
    font-size: 1.5rem;
    font-weight: 500;
`
