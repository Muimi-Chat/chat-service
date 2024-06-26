import insertLog from "src/api/repositories/insertLog";
import { CAPPU_AUTH_KEY, CAPPU_BASE_HTTP } from "src/configs/cryptorConfig";

export default async function requestDecrypt(id: string, content: string, metadata: string = "") {
    try {
        const formData = new FormData();
        formData.append('content', content);
        formData.append('id', id);
        formData.append('metadata', metadata);

        const response = await fetch(`${CAPPU_BASE_HTTP}/crypt/decrypt`, {
            method: 'POST',
            headers: {
                'Authorization': CAPPU_AUTH_KEY
            },
            body: formData
        })

        const data = await response.json() as any
        if (!response.ok) {
            const errorMessage = `Non Success during decryption of content on id (${id}) :: ${data}`
            console.error(errorMessage)
            await insertLog(errorMessage, "ERROR")
            return
        }

        return data.decryptedContent;
    } catch (error) {
        const errorMessage = `Error decrypting content on id (${id}) :: ${error}`
        console.error(errorMessage)
        await insertLog(errorMessage, "CRITICAL")
    }
}