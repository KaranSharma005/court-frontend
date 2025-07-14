import { Client } from "./abstract";

export class OfficerC extends Client {
    constructor(url: string) {
        super(url);
    }

    async getRequests(){
        const res = await this.request("GET", `/template/requests`);
        return res.data;
    }

    async rejectOne(tempId : string, docId : string, reason : string){
        const res = await this.request("DELETE",`/signatures/reject/${tempId}/${docId}`, { data : {reason}});
        return res.data;
    }

    async rejectAll(tempId : string, reason : string){
        const res = await this.request("DELETE",`/signatures/rejectAll/${tempId}`, {data : {reason}});
        return res.data;
    }
}