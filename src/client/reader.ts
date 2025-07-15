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

    async uploadSignature(
        formData : FormData
    ){
        const res = await this.request("POST", `/signatures/addSignature`, {
			data: formData,
            headers: { "Content-Type" : "multipart/form-data"}
		});
        return res.data;
    }

    async getSignature(){
        const res = await this.request("GET",`/signatures/getAll`);
        return res.data;
    }

    async deleteSignature(id : string){
        const res = await this.request("DELETE", `/signatures/delete/${id}`);
        return res.data;
    }

    async handleBulkUpload(formData : FormData, id : string){
        const res = await this.request("POST", `/template/addExcel/${id}`, {
			data: formData,
            headers: { "Content-Type" : "multipart/form-data"}
		});
        return res.data;
    }

    async getTemplateFields(id : string){
        const res = await this.request("GET", `/template/extractFields/${id}`);
        return res.data;
    }

    async getAllDoc(id : string){
        const res = await this.request("GET", `/template/getAll/${id}`);
        return res.data;
    }

    async deleteDoc(docId : string, id : string){
        const res = await this.request("DELETE", `/template/deleteDoc/${id}/${docId}`);
        return res.data;
    }

    async handlePreview(id : string, templateID : string){
        const res = await this.request("GET", `/template/preview/${templateID}/${id}`);
        return res.data;
    }

    async sendForSignature(templateID : string, id : string){
        await this.request("POST",`/signatures/sendForSign/${templateID}/${id}`);
    }
    
    async rejectedList(tempId : string){
        const res = await this.request("GET", `/template/rejected/${tempId}`);
        return res.data;
    }
}