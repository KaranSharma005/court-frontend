import { Client } from "./abstract";

export class OfficerC extends Client {
    constructor(url: string) {
        super(url);
    }

    async getRequests(){
        const res = await this.request("GET", `/template/requests`);
        return res.data;
    }
}