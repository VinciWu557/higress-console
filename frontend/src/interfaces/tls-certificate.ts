export interface TlsCertificate {
  name: string,
  namespace: string,
  endpoints: string[],
  [propName: string]: any,
}

export interface TlsCertificateResponse {
  data: TlsCertificate[],
  pageNum: number,
  pageSize: number,
  total: number,
}

