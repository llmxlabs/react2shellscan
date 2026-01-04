export interface ScanResult {
  id: string;
  url: string;
  normalizedUrl: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  vulnerable: boolean | null;
  confidence: 'high' | 'medium' | 'low' | null;
  usesRsc: boolean | null;
  framework: string | null;
  detectedVersion: string | null;
  scanDurationMs: number | null;
  authorizationConfirmed: boolean;
  createdAt: string;
  completedAt: string | null;
  error?: string;
}

export interface ScanProgress {
  step: number;
  steps: {
    label: string;
    status: 'pending' | 'active' | 'complete';
  }[];
}

const RATE_LIMIT_KEY = 'react2shell_scans';
const MAX_SCANS_PER_DAY = 10;

export function getRemainingScans(): number {
  const data = localStorage.getItem(RATE_LIMIT_KEY);
  if (!data) return MAX_SCANS_PER_DAY;

  const { count, date } = JSON.parse(data);
  const today = new Date().toISOString().split('T')[0];

  if (date !== today) {
    localStorage.removeItem(RATE_LIMIT_KEY);
    return MAX_SCANS_PER_DAY;
  }

  return Math.max(0, MAX_SCANS_PER_DAY - count);
}

export function incrementScanCount(): void {
  const today = new Date().toISOString().split('T')[0];
  const data = localStorage.getItem(RATE_LIMIT_KEY);

  if (!data) {
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify({ count: 1, date: today }));
    return;
  }

  const { count, date } = JSON.parse(data);

  if (date !== today) {
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify({ count: 1, date: today }));
  } else {
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify({ count: count + 1, date: today }));
  }
}

export function validateUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url);

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'Please enter a valid URL starting with http:// or https://' };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Block localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return { valid: false, error: 'Scanning private/local URLs is not allowed' };
    }

    // Block private IP ranges
    const ipMatch = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
    if (ipMatch) {
      const [, a, b] = ipMatch.map(Number);
      if (a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) {
        return { valid: false, error: 'Scanning private/local URLs is not allowed' };
      }
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Please enter a valid URL starting with http:// or https://' };
  }
}

export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    let normalized = `${parsed.protocol}//${parsed.hostname.toLowerCase()}`;
    if (parsed.port) normalized += `:${parsed.port}`;
    normalized += parsed.pathname.replace(/\/$/, '') || '/';
    return normalized;
  } catch {
    return url;
  }
}

export async function mockScan(
  url: string,
  onProgress: (progress: ScanProgress) => void
): Promise<Omit<ScanResult, 'id' | 'url' | 'normalizedUrl' | 'authorizationConfirmed' | 'createdAt'>> {
  type StepStatus = 'pending' | 'active' | 'complete';
  const steps: { label: string; status: StepStatus }[] = [
    { label: 'Validating URL', status: 'pending' },
    { label: 'Checking for React Server Components', status: 'pending' },
    { label: 'Testing for vulnerability', status: 'pending' },
    { label: 'Generating results', status: 'pending' },
  ];

  const startTime = Date.now();

  // Step 1: Validating URL
  onProgress({ step: 0, steps: steps.map((s, i) => ({ ...s, status: (i === 0 ? 'active' : 'pending') as StepStatus })) });
  await new Promise(r => setTimeout(r, 500));
  steps[0].status = 'complete';

  // Step 2: Checking RSC
  onProgress({ step: 1, steps: steps.map((s, i) => ({ ...s, status: (i === 1 ? 'active' : s.status) as StepStatus })) });
  await new Promise(r => setTimeout(r, 800 + Math.random() * 500));
  steps[1].status = 'complete';

  // Step 3: Testing vulnerability
  onProgress({ step: 2, steps: steps.map((s, i) => ({ ...s, status: (i === 2 ? 'active' : s.status) as StepStatus })) });
  await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));
  steps[2].status = 'complete';

  // Step 4: Generating results
  onProgress({ step: 3, steps: steps.map((s, i) => ({ ...s, status: (i === 3 ? 'active' : s.status) as StepStatus })) });
  await new Promise(r => setTimeout(r, 500));
  steps[3].status = 'complete';

  onProgress({ step: 4, steps });

  const lowerUrl = url.toLowerCase();
  const isVulnerable = lowerUrl.includes('vulnerable') || lowerUrl.includes('test')
    ? true
    : lowerUrl.includes('safe') || lowerUrl.includes('patched')
      ? false
      : Math.random() < 0.3;

  return {
    status: 'complete',
    vulnerable: isVulnerable,
    confidence: isVulnerable ? 'high' : 'low',
    usesRsc: true,
    framework: 'nextjs',
    detectedVersion: isVulnerable ? '15.1.0' : '15.2.6',
    scanDurationMs: Date.now() - startTime,
    completedAt: new Date().toISOString(),
  };
}

const HISTORY_KEY = 'react2shell_history';

export function getScanHistory(): ScanResult[] {
  const data = localStorage.getItem(HISTORY_KEY);
  if (!data) return [];
  return JSON.parse(data);
}

export function saveScanToHistory(scan: ScanResult): void {
  const history = getScanHistory();
  const updated = [scan, ...history.filter(s => s.id !== scan.id)].slice(0, 50);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export function getScanById(id: string): ScanResult | null {
  const history = getScanHistory();
  return history.find(s => s.id === id) || null;
}

export function generateScanId(): string {
  return `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
