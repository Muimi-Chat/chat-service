import axios from 'axios';
import insertLog from '../repositories/insertLog';
import UserInformationInterface from '../interfaces/UserInformationInterface';
import { USER_SERVICE_API_CONFIG } from 'src/configs/userServiceApiConfig';

export default async function fetchUserInformation(sessionToken: string, userAgent: string, username: string) : Promise<UserInformationInterface> {
    try {
        const url = `${USER_SERVICE_API_CONFIG.SSL_ENABLED ? 'https://' : 'http://'}${USER_SERVICE_API_CONFIG.BASE_DOMAIN}/api-user/service-user-info?username=${username}`;
        
        const response = await axios.get(url, {
            headers: {
                'session-token': sessionToken,
                'service-token': USER_SERVICE_API_CONFIG.API_TOKEN,
                'user-agent': userAgent
            },
            proxy: false
        });

        const data = response.data;
        if (data.status !== "SUCCESS") {
            return {
                status: data.status,
                uuid: "",
                userStatus: "",
                deleted: false,
                authenticated: false
            }
        }

        return {
            status: data.status,
            uuid: data.uuid ?? "UUID_NOT_FOUND",
            userStatus: data.user_status ?? "ACCOUNT_STATUS_NOT_FOUND",
            deleted: data.deleted,
            authenticated: data.authenticated
        }
    } catch (error) {
        console.error('Error validating session token:', error);
        await insertLog(`Error validating session token :: ${error}`)
        throw error;
    }
}