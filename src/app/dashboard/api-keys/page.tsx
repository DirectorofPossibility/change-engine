import { getApiKeys } from '@/lib/data/dashboard'
import { ApiKeysClient } from './ApiKeysClient'

export default async function ApiKeysPage() {
  const keys = await getApiKeys()
  return <ApiKeysClient initialKeys={keys} />
}
