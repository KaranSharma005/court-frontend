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

    async showPreview(id: string){
        const res = await this.request("GET", `/template/preview/${id}`,{
          responseType: 'blob',
        });
        return res.data;
    }

    async deleteTemplate(id : string){
        const res = await this.request("DELETE", `/template/delete/${id}`);
        return res.data;
    }

    async clone(id : string) {
        const res = await this.request("POST", `/template/clone/${id}`);
        return res.data;
    }
}