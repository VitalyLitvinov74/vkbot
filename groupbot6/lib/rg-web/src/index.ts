import * as HttpClient from "http";
import * as HttpsClient from "https";

import { assert } from "rg"
import { RGError as RGError } from "rg";

type Agent = HttpClient.Agent|HttpsClient.Agent;
type AgentOptions = HttpClient.AgentOptions|HttpsClient.AgentOptions;
type IncomingMessage = HttpClient.IncomingMessage;
type IncomingHeaders = HttpClient.IncomingHttpHeaders;

export type RequestOptions = HttpClient.RequestOptions|HttpsClient.RequestOptions;

const agentOptions: AgentOptions = {
	keepAlive: true,
	timeout: 8000
};

const httpAgent: Agent = new HttpClient.Agent(agentOptions);
const httpsAgent: Agent = new HttpsClient.Agent(agentOptions);

type Request = (
	options: RequestOptions,
	callback: (res: IncomingMessage) => void
) => HttpClient.ClientRequest;

interface HttpSuccess {
	is_success: true;
	http_status_code: number;
	headers: IncomingHeaders;
	data: string;
}

interface HttpError extends RGError {};

type HttpResult = HttpSuccess|HttpError;

interface Protocol {
	name: string;
	agent: Agent;
	client: Request;
}

export enum ErrorCodes {
	CommunicationTimedOut,
	CommunicationError
}

class RGWeb {
	private host: string;
	private port: number;
	private protocol: string;

	constructor(
		host: string,
		port: number,
		protocol: string
	) {
		this.host = host;
		
		if(!this.isPortValid(port)) {
			throw new Error("Port is not valid: " + port);
		}
		
		this.port = port;

		protocol = protocol.toLowerCase();

		if(!this.isProtocolValid(protocol)) {
			throw new Error("Protocol is not valid: " + protocol);
		}
		
		this.protocol = protocol;
	}

	private isPortValid(port: number): boolean {
		if(port <= 0) {
			return false;
		}
		
		if(port > 65535) {
			return false;
		}
		
		return true;
	}
	
	private isProtocolValid(protocol_name: string): boolean {
		let protocol: Protocol|null = this.getProtocolByName(protocol_name);
		
		if(protocol === null) {
			return false;
		}else{
			return true;
		}
	}
	
	private getProtocolByName(name: string): Protocol|null {
		let protocols: Protocol[] = this.getProtocols();
		
		for(let protocol of protocols) {
			if(protocol.name === name) {
				return protocol;
			}
		}
		
		return null;
	}
	
	private getProtocols(): Protocol[] {
		return [
			{ name: "http", agent: httpAgent, client: HttpClient.request },
			{ name: "https", agent: httpsAgent, client: HttpsClient.request }
		];
	}
	
	private getLocalProtocolClient(): Request|null {
		let protocol = this.getLocalProtocol();
		
		if(protocol === null) {
			return null;
		}
		
		return protocol.client;
	}
	
	private getLocalProtocolAgent(): Agent|null {
		let protocol = this.getLocalProtocol();
		
		if(protocol === null) {
			return null;
		}
		
		return protocol.agent;
	}
	
	private getLocalProtocol(): Protocol|null {
		return this.getProtocolByName(this.protocol);
	}
	
	public async request(
		options: RequestOptions,
		data: Buffer|null
	): Promise<HttpResult> {
		options.hostname = this.host;
		options.port = this.port;

		if(!options.method) {
			options.method = "GET";
		}

		let agent = this.getLocalProtocolAgent();

		if(agent) {
			options.agent = agent;
		}

		let request = this.getLocalProtocolClient();

		return new Promise((resolve) => {
			assert(request !== null);

			let req = request(options, (res) => {
				res.setEncoding("utf-8");

				let responseData: string = "";

				res.on("data", (chunk: string) => {
					responseData += chunk;
				});

				res.on("end", () => {
					let code = 0;

					if(res.statusCode) {
						code = res.statusCode;
					}

					resolve({
						is_success: true,
						http_status_code: code,
						headers: res.headers,
						data: responseData
					});
				});
			});

			req.on('error', (e: Error) => {
				resolve({
					is_success: false,
					error: {
						code: ErrorCodes.CommunicationError,
						message: e.message
					}
				});
			});
			
			req.on('timeout', () => {
				resolve({
					is_success: false,
					error: {
						code: ErrorCodes.CommunicationTimedOut,
						message: "Response has timed out"
					}
				});
			});

			if(data !== null) {
				req.write(data);
			}
			
			req.end();
		});
	}
}

export { RGWeb };
export { StatusCodes } from "./http_status_codes";