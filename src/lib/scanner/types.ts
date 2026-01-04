// Additional types for scanner
export interface FrameworkFingerprint {
  framework: string | null
  version: string | null
  usesRsc: boolean
}

export interface VulnerabilityCheckResult {
  isVulnerable: boolean
  confidence: 'high' | 'medium' | 'low'
  status: number | null
  signature: string | null
}
