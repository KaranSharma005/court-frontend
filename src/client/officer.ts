import { Client } from "./abstract";

export class OfficerC extends Client {
  constructor(url: string) {
    super(url);
  }

  async getRequests() {
    const res = await this.request("GET", `/template/requests`);
    return res.data;
  }

  async rejectOne(tempId: string, docId: string, reason: string) {
    const res = await this.request(
      "DELETE",
      `/signatures/reject/${tempId}/${docId}`,
      { data: { reason } }
    );
    return res.data;
  }

  async rejectAll(tempId: string, reason: string) {
    const res = await this.request(
      "DELETE",
      `/signatures/rejectAll/${tempId}`,
      { data: { reason } }
    );
    return res.data;
  }

  async delegateRequest(tempId: string, reason: string) {
    const res = await this.request("PATCH", `/signatures/delegate/${tempId}`, {
      data: { reason },
    });
    return res.data;
  }

  async signDocuments(tempId: string, url : string, id : string) {
    url = `http://localhost:3000/signature/${url}`;
    const res = await this.request("POST", `/signatures/sign/${tempId}/${id}`,{
      data : {
        url
      }
    });
    return res.data;
  }

  async getSignatures() {
    const res = await this.request("GET", `/signatures/getSignatures`);
    return res.data;
  }
}
