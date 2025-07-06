// import Zod from "zod";
import { Client } from "./abstract";

export class ReaderC extends Client {
    constructor(url: string) {
        super(url);
    }

    async templateRequest(
        formData : FormData
    ) {
        const res = await this.request("POST", `/template/addTemplate`, {
			data: formData,
            headers: { "Content-Type" : "multipart/form-data"}
		});
        return res;
    }

    async allTemplates(){
        const res = await this.request("GET", `/template/getAll`);
        return res.data;
    }
}