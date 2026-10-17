// Type bridge for the `resend` package. The package ships `.d.mts`
// declarations that are not always resolved by `moduleResolution: "bundler"`.
// This file provides a minimal, compatible surface so the app typechecks.
declare module "resend" {
  export interface SendEmailOptions {
    from: string;
    to: string | string[];
    subject?: string;
    html?: string;
    text?: string;
    cc?: string | string[];
    bcc?: string | string[];
    replyTo?: string | string[];
    headers?: Record<string, string>;
    tags?: { name: string; value: string }[];
  }

  export interface SendEmailData {
    id: string;
  }

  export interface SendEmailError {
    message: string;
    name?: string;
    [key: string]: unknown;
  }

  export interface SendEmailResponse {
    data: SendEmailData | null;
    error: SendEmailError | null;
  }

  export class Resend {
    constructor(apiKey: string);
    emails: {
      send(options: SendEmailOptions): Promise<SendEmailResponse>;
    };
  }

  export default Resend;
}