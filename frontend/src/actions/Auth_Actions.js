import {
    CHECK_LOGIN,
    CHECK_INSTALLATION,
    RETRIEVE_DOMAIN_REPOSITORIES,
} from "./types/Auth_Types";

import { api, apiEndpoint } from "../apis/api";
import Cookies from "js-cookie";

export const checkLogin = () => async (dispatch) => {
    console.log("User-JWT Cookie: ");
    console.log(Cookies.get("user-jwt"));

    console.log("apiEndpoint: ", apiEndpoint);
    console.log("api: ");
    console.log(api);

    const response = await api.get("/auth/login/success", {
        withCredentials: true,
    });

    console.log("Headers: ");
    console.log(response.headers);
    console.log(response.data);

    dispatch({ type: CHECK_LOGIN, payload: response.data });
};

export const checkInstallation = (formValues) => async (dispatch) => {
    const response = await api.post("/auth/check_installation", formValues);

    if (response.data.success == false) {
        throw new Error(response.data.error.toString());
    } else {
        dispatch({ type: CHECK_INSTALLATION, payload: response.data.result });
    }
};

export const retrieveDomainRepositories = (formValues) => async (dispatch) => {
    const response = await api.post(
        "/auth/retrieve_domain_repositories",
        formValues
    );
    dispatch({ type: RETRIEVE_DOMAIN_REPOSITORIES, payload: response.data });
};

export const sendInvite = (formValues) => async (dispatch) => {
    const { workspaceId, email } = formValues;

    if (!workspaceId) {
        throw new Error("sendInvite: workspaceId not provided");
    }

    if (!email) {
        throw new Error("sendInvite: email not provided");
    }

    const response = await api.post(`/invites/${workspaceId}`, formValues);

    const { success, error } = response.data;

    if (success === false) {
        throw new Error(error);
    } else {
        return true;
    }
};

export const logOut = () => async () => {
    console.log("ENTERED HERE");
    await api.get(`/auth/logout`);
    console.log("LOGGING OUT");
    return true;
};
