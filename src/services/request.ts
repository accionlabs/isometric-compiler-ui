export async function makeRequest<T, P>(
    url: string,
    method: 'get' | 'post' | 'put' | 'delete',
    payload?: P,
    isFormData?: boolean,
  ): Promise<Response> {
    const headers: HeadersInit = {
      Accept: isFormData ? 'application/json' : '/',
    //   Authorization: `Bearer ${accessToken}`,
    }
  
    if (!isFormData) {
      headers['Content-Type'] = 'application/json'
    }
  
    return await fetch(url, {
      method,
      body: isFormData ? (payload as BodyInit) : JSON.stringify(payload),
      headers,
    })
  }

  export default async function fetcher<T, P>(
    url: string,
    method: 'get' | 'post' | 'put' | 'delete',
    payload?: P,
    makeResp?: boolean,
    isFormData?: boolean,
  ): Promise<T> {
    let res: Response = await makeRequest<T, P>(url, method, payload, isFormData)

  
    if (!res.ok) {
      const error: any = new Error()
      error.info = await res.json()
      error.status = res.status
      console.error('Fetcher Error:', error)
      throw error
    }
  
    const respJson = await res.json()
    const formattedResp = makeResp ? respJson.data : respJson
    return formattedResp
  }