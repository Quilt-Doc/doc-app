import { createSelector } from 'reselect';

//gets the current reference
const getReferenceId = data => data.referenceId;
const getReferences = data => data.references;

export const makeGetCurrentReference = () => {
    return createSelector(
        [getReferenceId, getReferences],
        (referenceId, references) => {

            if (referenceId) return references[referenceId];
            return Object.values(references).filter((ref => ref.path === ""))[0];
        }
    )
}

//gets documents relevant to the current reference
const getDocuments = data => data.documents;
const getCurrentReference = data => data.currentReference;

export const makeGetReferenceDocuments = () => {
    return createSelector(
        [getDocuments, getCurrentReference],
        (documents, currentReference) => {
            if (currentReference) {
                return Object.values(documents).filter(doc => 
                    {
                        for (let i = 0; i < doc.references.length; i++) {
                            if (doc.references[i]._id === currentReference._id) {
                                return true
                            }
                        } return false
                    }
                )
            } else {
                return [];
            }
        }
    )
}

// filters the currentReference the references 
export const makeFilterCurrentReference = () => {
    return createSelector(
        [getReferenceId, getReferences],
        (referenceId, references) => {
            return Object.values(references).filter(reference => 
                reference._id !== referenceId && reference.path !== "");
        }
    )
}


const getSnippets = data => data.snippets;

// sorts snippets by line start
export const getSortedSnippets = createSelector(
    [getSnippets],
    (snippets) => {
        return Object.values(snippets).sort((a, b) => 
            {if (a.start < b.start) {return -1} else {return 1}});
    }
)


// SIDENAVBAR

const getParent = data => data.parent;

export const makeGetChildDocuments = () => {
    return createSelector(
        [getParent, getDocuments],
        (parent, documents) => {
            return parent ? parent.children.map(childId => documents[childId]) : [];
        }
    )
}
